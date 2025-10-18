"""
GitHub Release 백업 서비스
GitHub Releases를 사용한 백업 업로드/다운로드/복원
"""

from __future__ import annotations
import json
import mimetypes
import os
import shutil
import tarfile
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from urllib import error, request, parse
import logging

logger = logging.getLogger(__name__)


class GHError(RuntimeError):
    """GitHub API 오류"""
    pass


@dataclass
class GHConfig:
    """GitHub 설정"""
    owner: str
    repo: str
    token: Optional[str] = None


@dataclass
class RestoreLog:
    """복원 로그"""
    tag: Optional[str]
    release_id: Optional[int]
    asset_name: Optional[str]
    detail: str = ""
    used_latest_endpoint: bool = False


class GitHubBackupService:
    """GitHub Release 백업 서비스"""
    
    def __init__(self, config: GHConfig):
        self.config = config
        self.base_url = f"https://api.github.com/repos/{config.owner}/{config.repo}"
    
    def _headers(self, *, accept_upload: bool = False, accept_octet: bool = False) -> Dict[str, str]:
        """HTTP 헤더 생성"""
        h = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "like-opt-backup/1.0",
        }
        if self.config.token:
            h["Authorization"] = f"Bearer {self.config.token}"
        if accept_upload:
            h["Accept"] = "application/vnd.github+json"
        if accept_octet:
            h["Accept"] = "application/octet-stream"
        return h
    
    def _http(self, method: str, url: str, *, data: Optional[bytes] = None, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """HTTP 요청"""
        req = request.Request(url, data=data, headers=headers or {}, method=method)
        try:
            with request.urlopen(req, timeout=30) as resp:
                body = resp.read()
                if not body:
                    return {}
                try:
                    return json.loads(body.decode("utf-8"))
                except Exception:
                    return {}
        except error.HTTPError as e:
            try:
                err_json = json.loads(e.read().decode("utf-8"))
            except Exception:
                err_json = {"message": str(e)}
            msg = err_json.get("message") or str(e)
            raise GHError(f"{method} {url} -> {e.code}: {msg}") from e
        except error.URLError as e:
            raise GHError(f"{method} {url} -> URLError: {e.reason}") from e
    
    def get_latest_release(self) -> Optional[Dict[str, Any]]:
        """최신 릴리스 조회"""
        url = f"{self.base_url}/releases/latest"
        try:
            return self._http("GET", url, headers=self._headers())
        except GHError as e:
            logger.warning(f"최신 릴리스 조회 실패: {e}")
            return None
    
    def get_release_by_tag(self, tag: str) -> Optional[Dict[str, Any]]:
        """태그로 릴리스 조회"""
        url = f"{self.base_url}/releases/tags/{tag}"
        try:
            return self._http("GET", url, headers=self._headers())
        except GHError as e:
            logger.warning(f"릴리스 조회 실패 (tag={tag}): {e}")
            return None
    
    def create_release(self, tag: str, title: str, body: str = "", draft: bool = False, prerelease: bool = False) -> Dict[str, Any]:
        """릴리스 생성"""
        url = f"{self.base_url}/releases"
        data = {
            "tag_name": tag,
            "target_commitish": "main",
            "name": title,
            "body": body,
            "draft": draft,
            "prerelease": prerelease
        }
        
        response = self._http("POST", url, 
                            data=json.dumps(data).encode('utf-8'),
                            headers={**self._headers(), "Content-Type": "application/json"})
        
        logger.info(f"릴리스 생성 완료: {tag} - {title}")
        return response
    
    def ensure_release(self, tag: str, title: Optional[str] = None) -> Dict[str, Any]:
        """릴리스 확인/생성"""
        # 기존 릴리스 확인
        existing = self.get_release_by_tag(tag)
        if existing:
            logger.info(f"기존 릴리스 사용: {tag}")
            return existing
        
        # 새 릴리스 생성
        release_title = title or f"Backup {tag}"
        return self.create_release(tag, release_title, f"자동 백업 - {tag}")
    
    def upload_asset(self, tag: str, file_path: Path, asset_name: Optional[str] = None) -> Dict[str, Any]:
        """에셋 업로드"""
        # 릴리스 정보 조회
        release = self.get_release_by_tag(tag)
        if not release:
            raise GHError(f"릴리스를 찾을 수 없습니다: {tag}")
        
        # 업로드 URL 생성
        upload_url = release.get("upload_url", "").replace("{?name,label}", "")
        if not upload_url:
            raise GHError("업로드 URL을 찾을 수 없습니다.")
        
        # 파일 정보
        if not file_path.exists():
            raise GHError(f"파일이 존재하지 않습니다: {file_path}")
        
        asset_name = asset_name or file_path.name
        file_size = file_path.stat().st_size
        
        # MIME 타입 확인
        mime_type, _ = mimetypes.guess_type(str(file_path))
        if not mime_type:
            mime_type = "application/octet-stream"
        
        # 파일 읽기
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # 업로드 URL에 쿼리 파라미터 추가
        upload_url_with_params = f"{upload_url}?name={parse.quote(asset_name)}"
        
        # 업로드
        headers = {
            **self._headers(accept_upload=True),
            "Content-Type": mime_type,
            "Content-Length": str(file_size)
        }
        
        response = self._http("POST", upload_url_with_params,
                            data=file_data,
                            headers=headers)
        
        logger.info(f"에셋 업로드 완료: {asset_name} ({file_size} bytes)")
        return response
    
    def download_asset(self, tag: str, asset_name: str, target_path: Path) -> bool:
        """에셋 다운로드"""
        try:
            # 릴리스 정보 조회
            release = self.get_release_by_tag(tag)
            if not release:
                raise GHError(f"릴리스를 찾을 수 없습니다: {tag}")
            
            # 에셋 찾기
            assets = release.get("assets", [])
            asset = next((a for a in assets if a["name"] == asset_name), None)
            if not asset:
                raise GHError(f"에셋을 찾을 수 없습니다: {asset_name}")
            
            # 다운로드 URL
            download_url = asset["browser_download_url"]
            
            # 파일 다운로드
            req = request.Request(download_url, headers=self._headers(accept_octet=True))
            with request.urlopen(req) as response:
                with open(target_path, 'wb') as f:
                    shutil.copyfileobj(response, f)
            
            logger.info(f"에셋 다운로드 완료: {asset_name} -> {target_path}")
            return True
            
        except Exception as e:
            logger.error(f"에셋 다운로드 실패: {e}")
            return False
    
    def list_releases(self, limit: int = 10) -> List[Dict[str, Any]]:
        """릴리스 목록 조회"""
        url = f"{self.base_url}/releases"
        params = f"?per_page={limit}"
        try:
            return self._http("GET", f"{url}{params}", headers=self._headers())
        except GHError as e:
            logger.error(f"릴리스 목록 조회 실패: {e}")
            return []
    
    def delete_release(self, tag: str) -> bool:
        """릴리스 삭제"""
        try:
            # 릴리스 정보 조회
            release = self.get_release_by_tag(tag)
            if not release:
                return False
            
            # 릴리스 삭제
            url = f"{self.base_url}/releases/{release['id']}"
            self._http("DELETE", url, headers=self._headers())
            
            logger.info(f"릴리스 삭제 완료: {tag}")
            return True
            
        except Exception as e:
            logger.error(f"릴리스 삭제 실패: {e}")
            return False
    
    def get_release_assets(self, tag: str) -> List[Dict[str, Any]]:
        """릴리스 에셋 목록 조회"""
        release = self.get_release_by_tag(tag)
        if not release:
            return []
        
        return release.get("assets", [])
    
    def restore_from_github(self, tag: str, asset_name: str, target_dir: Path) -> RestoreLog:
        """GitHub에서 백업 복원"""
        log = RestoreLog(tag=tag, asset_name=asset_name)
        
        try:
            # 릴리스 정보 조회
            release = self.get_release_by_tag(tag)
            if not release:
                log.detail = f"릴리스를 찾을 수 없습니다: {tag}"
                return log
            
            log.release_id = release.get("id")
            
            # 에셋 다운로드
            temp_file = target_dir / f"temp_{asset_name}"
            if self.download_asset(tag, asset_name, temp_file):
                # 압축 해제
                if asset_name.endswith('.zip'):
                    with zipfile.ZipFile(temp_file, 'r') as zipf:
                        zipf.extractall(target_dir)
                elif asset_name.endswith(('.tar', '.tar.gz')):
                    with tarfile.open(temp_file, 'r:*') as tarf:
                        tarf.extractall(target_dir)
                
                # 임시 파일 삭제
                temp_file.unlink()
                
                log.detail = f"백업 복원 완료: {tag}/{asset_name}"
                logger.info(log.detail)
            else:
                log.detail = f"에셋 다운로드 실패: {asset_name}"
            
        except Exception as e:
            log.detail = f"복원 실패: {e}"
            logger.error(log.detail)
        
        return log


# 전역 GitHub 백업 서비스 인스턴스
github_backup_service = None


def get_github_backup_service(owner: str, repo: str, token: Optional[str] = None) -> GitHubBackupService:
    """GitHub 백업 서비스 인스턴스 반환"""
    global github_backup_service
    if github_backup_service is None:
        config = GHConfig(owner=owner, repo=repo, token=token)
        github_backup_service = GitHubBackupService(config)
    return github_backup_service
