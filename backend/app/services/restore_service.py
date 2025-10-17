"""
MAIC Flask Optimized - Restore Service

GitHub Releases에 인덱싱된 파일들을 업로드하고 관리하는 서비스
"""

import os
import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
import zipfile
import tempfile

from ..config import Config


class RestoreService:
    """복원 관련 서비스 클래스"""
    
    def __init__(self):
        self.config = Config()
        self._persist_dir = Path(self.config.RAG_PERSIST_DIR)
        self._github_token = os.getenv('GITHUB_TOKEN')
        self._github_owner = os.getenv('GITHUB_OWNER', 'LEES1605')
        self._github_repo = os.getenv('GITHUB_REPO_NAME', 'MAIC-Flask')
        
        # persist 디렉토리 생성
        self._persist_dir.mkdir(parents=True, exist_ok=True)
    
    def upload_to_github_release(self, tag_name: str, files: List[Path]) -> Dict[str, Any]:
        """
        GitHub Releases에 파일 업로드
        
        Args:
            tag_name: 릴리스 태그명
            files: 업로드할 파일 목록
            
        Returns:
            Dict: 업로드 결과
        """
        if not self._github_token:
            return {"success": False, "error": "GitHub token이 설정되지 않았습니다"}
        
        try:
            import requests
            
            # 1. 릴리스 생성 또는 조회
            release_id = self._get_or_create_release(tag_name)
            if not release_id:
                return {"success": False, "error": "릴리스 생성/조회 실패"}
            
            # 2. 파일들을 ZIP으로 압축
            zip_path = self._create_archive(files, tag_name)
            
            # 3. ZIP 파일을 릴리스에 업로드
            upload_result = self._upload_asset(release_id, zip_path, f"maic-data-{tag_name}.zip")
            
            # 임시 파일 정리
            zip_path.unlink(missing_ok=True)
            
            return upload_result
            
        except Exception as e:
            return {"success": False, "error": f"업로드 실패: {str(e)}"}
    
    def _get_or_create_release(self, tag_name: str) -> Optional[str]:
        """릴리스 생성 또는 조회"""
        try:
            import requests
            
            headers = {
                'Authorization': f'token {self._github_token}',
                'Accept': 'application/vnd.github.v3+json'
            }
            
            # 기존 릴리스 조회
            url = f"https://api.github.com/repos/{self._github_owner}/{self._github_repo}/releases"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                releases = response.json()
                for release in releases:
                    if release['tag_name'] == tag_name:
                        print(f"[Restore] 기존 릴리스 발견: {tag_name}")
                        return str(release['id'])
            
            # 새 릴리스 생성
            create_data = {
                'tag_name': tag_name,
                'name': f'MAIC Data - {tag_name}',
                'body': f'MAIC 인덱싱 데이터 - {tag_name}\n\n생성일: {time.strftime("%Y-%m-%d %H:%M:%S")}',
                'draft': False,
                'prerelease': False
            }
            
            response = requests.post(url, headers=headers, json=create_data)
            
            if response.status_code == 201:
                release_data = response.json()
                print(f"[Restore] 새 릴리스 생성: {tag_name}")
                return str(release_data['id'])
            else:
                print(f"[Restore] 릴리스 생성 실패: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"[Restore] 릴리스 처리 실패: {e}")
            return None
    
    def _create_archive(self, files: List[Path], tag_name: str) -> Path:
        """파일들을 ZIP으로 압축"""
        try:
            # 임시 ZIP 파일 생성
            temp_dir = Path(tempfile.gettempdir())
            zip_path = temp_dir / f"maic-data-{tag_name}.zip"
            
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_path in files:
                    if file_path.exists():
                        # persist 디렉토리 기준으로 상대 경로 사용
                        arcname = file_path.relative_to(self._persist_dir)
                        zipf.write(file_path, arcname)
                        print(f"[Restore] 압축 추가: {arcname}")
            
            return zip_path
            
        except Exception as e:
            print(f"[Restore] 압축 생성 실패: {e}")
            raise
    
    def _upload_asset(self, release_id: str, file_path: Path, filename: str) -> Dict[str, Any]:
        """릴리스에 파일 업로드"""
        try:
            import requests
            
            headers = {
                'Authorization': f'token {self._github_token}',
                'Content-Type': 'application/zip'
            }
            
            url = f"https://uploads.github.com/repos/{self._github_owner}/{self._github_repo}/releases/{release_id}/assets?name={filename}"
            
            with open(file_path, 'rb') as f:
                response = requests.post(url, headers=headers, data=f)
            
            if response.status_code == 201:
                asset_data = response.json()
                print(f"[Restore] 파일 업로드 성공: {filename}")
                return {
                    "success": True,
                    "download_url": asset_data.get('browser_download_url'),
                    "size": asset_data.get('size'),
                    "filename": filename
                }
            else:
                print(f"[Restore] 파일 업로드 실패: {response.status_code} - {response.text}")
                return {"success": False, "error": f"업로드 실패: {response.status_code}"}
                
        except Exception as e:
            print(f"[Restore] 파일 업로드 실패: {e}")
            return {"success": False, "error": str(e)}
    
    def get_available_releases(self) -> List[Dict[str, Any]]:
        """사용 가능한 릴리스 목록 조회"""
        try:
            import requests
            
            headers = {
                'Authorization': f'token {self._github_token}',
                'Accept': 'application/vnd.github.v3+json'
            }
            
            url = f"https://api.github.com/repos/{self._github_owner}/{self._github_repo}/releases"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                releases = response.json()
                return [
                    {
                        'tag_name': release['tag_name'],
                        'name': release['name'],
                        'published_at': release['published_at'],
                        'assets': [
                            {
                                'name': asset['name'],
                                'size': asset['size'],
                                'download_url': asset['browser_download_url']
                            }
                            for asset in release.get('assets', [])
                        ]
                    }
                    for release in releases
                ]
            else:
                print(f"[Restore] 릴리스 목록 조회 실패: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"[Restore] 릴리스 목록 조회 실패: {e}")
            return []
    
    def download_from_release(self, tag_name: str, asset_name: str, target_dir: Path) -> Dict[str, Any]:
        """릴리스에서 파일 다운로드"""
        try:
            import requests
            
            # 릴리스 정보 조회
            releases = self.get_available_releases()
            target_release = None
            
            for release in releases:
                if release['tag_name'] == tag_name:
                    target_release = release
                    break
            
            if not target_release:
                return {"success": False, "error": f"릴리스 {tag_name}을 찾을 수 없습니다"}
            
            # 에셋 찾기
            target_asset = None
            for asset in target_release['assets']:
                if asset['name'] == asset_name:
                    target_asset = asset
                    break
            
            if not target_asset:
                return {"success": False, "error": f"에셋 {asset_name}을 찾을 수 없습니다"}
            
            # 파일 다운로드
            response = requests.get(target_asset['download_url'])
            
            if response.status_code == 200:
                target_dir.mkdir(parents=True, exist_ok=True)
                zip_path = target_dir / asset_name
                
                with open(zip_path, 'wb') as f:
                    f.write(response.content)
                
                # ZIP 파일 압축 해제
                with zipfile.ZipFile(zip_path, 'r') as zipf:
                    zipf.extractall(target_dir)
                
                # ZIP 파일 삭제
                zip_path.unlink()
                
                print(f"[Restore] 다운로드 및 압축 해제 완료: {asset_name}")
                return {"success": True, "extracted_to": str(target_dir)}
            else:
                return {"success": False, "error": f"다운로드 실패: {response.status_code}"}
                
        except Exception as e:
            print(f"[Restore] 다운로드 실패: {e}")
            return {"success": False, "error": str(e)}
    
    def auto_backup(self) -> Dict[str, Any]:
        """자동 백업 실행"""
        try:
            # 백업할 파일들
            backup_files = [
                self._persist_dir / "chunks.jsonl",
                self._persist_dir / ".indexing_state.json",
                self._persist_dir / "manifest.json"
            ]
            
            # 존재하는 파일만 필터링
            existing_files = [f for f in backup_files if f.exists()]
            
            if not existing_files:
                return {"success": False, "error": "백업할 파일이 없습니다"}
            
            # 태그명 생성 (날짜 기반)
            tag_name = f"backup-{time.strftime('%Y%m%d-%H%M%S')}"
            
            # GitHub Releases에 업로드
            result = self.upload_to_github_release(tag_name, existing_files)
            
            if result["success"]:
                print(f"[Restore] 자동 백업 완료: {tag_name}")
            
            return result
            
        except Exception as e:
            print(f"[Restore] 자동 백업 실패: {e}")
            return {"success": False, "error": str(e)}

# 전역 복원 서비스 인스턴스
restore_service = RestoreService()
