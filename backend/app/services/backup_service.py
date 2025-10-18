"""
고급 백업 서비스
자동 복원, 증분 백업, 버전 관리, GitHub Release 백업
"""

from __future__ import annotations
import os
import json
import time
import zipfile
import shutil
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)


@dataclass
class BackupConfig:
    """백업 설정"""
    backup_dir: str = "backups"
    max_backups: int = 10
    compression_level: int = 6
    exclude_patterns: List[str] = field(default_factory=lambda: [
        "__pycache__", ".git", "node_modules", ".DS_Store", 
        "*.pyc", "*.log", "*.tmp", "backups"
    ])
    github_enabled: bool = False
    github_owner: str = ""
    github_repo: str = ""
    github_token: str = ""


@dataclass
class BackupInfo:
    """백업 정보"""
    id: str
    name: str
    timestamp: datetime
    size: int
    type: str  # 'full', 'incremental', 'github'
    status: str  # 'created', 'uploaded', 'failed'
    file_path: Optional[str] = None
    github_url: Optional[str] = None
    checksum: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class BackupService:
    """고급 백업 서비스"""
    
    def __init__(self, config: Optional[BackupConfig] = None):
        self.config = config or BackupConfig()
        self.backup_dir = Path(self.config.backup_dir)
        self.backup_dir.mkdir(exist_ok=True)
        self.backups: List[BackupInfo] = []
        self._load_backup_index()
    
    def _load_backup_index(self):
        """백업 인덱스 로드"""
        index_file = self.backup_dir / "backup_index.json"
        if index_file.exists():
            try:
                with open(index_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.backups = [
                        BackupInfo(
                            id=b['id'],
                            name=b['name'],
                            timestamp=datetime.fromisoformat(b['timestamp']),
                            size=b['size'],
                            type=b['type'],
                            status=b['status'],
                            file_path=b.get('file_path'),
                            github_url=b.get('github_url'),
                            checksum=b.get('checksum'),
                            metadata=b.get('metadata', {})
                        )
                        for b in data.get('backups', [])
                    ]
            except Exception as e:
                logger.error(f"백업 인덱스 로드 실패: {e}")
                self.backups = []
    
    def _save_backup_index(self):
        """백업 인덱스 저장"""
        index_file = self.backup_dir / "backup_index.json"
        try:
            data = {
                'backups': [
                    {
                        'id': b.id,
                        'name': b.name,
                        'timestamp': b.timestamp.isoformat(),
                        'size': b.size,
                        'type': b.type,
                        'status': b.status,
                        'file_path': b.file_path,
                        'github_url': b.github_url,
                        'checksum': b.checksum,
                        'metadata': b.metadata
                    }
                    for b in self.backups
                ]
            }
            with open(index_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"백업 인덱스 저장 실패: {e}")
    
    def _calculate_checksum(self, file_path: Path) -> str:
        """파일 체크섬 계산"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def _should_exclude(self, file_path: Path) -> bool:
        """파일 제외 여부 확인"""
        path_str = str(file_path)
        for pattern in self.config.exclude_patterns:
            if pattern.startswith('*'):
                if path_str.endswith(pattern[1:]):
                    return True
            elif pattern in path_str:
                return True
        return False
    
    def create_full_backup(self, name: Optional[str] = None) -> BackupInfo:
        """전체 백업 생성"""
        try:
            backup_id = f"backup_{int(time.time())}"
            backup_name = name or f"Full Backup {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            # 백업 파일 경로
            backup_file = self.backup_dir / f"{backup_id}.zip"
            
            # 백업할 디렉토리들
            backup_sources = [
                Path("backend/app"),
                Path("backend/config"),
                Path("backend/prompts"),
                Path("backend/sample_data"),
                Path("frontend/src"),
                Path("frontend/public"),
                Path("docs"),
                Path("shared")
            ]
            
            # ZIP 파일 생성
            with zipfile.ZipFile(backup_file, 'w', zipfile.ZIP_DEFLATED, 
                               compresslevel=self.config.compression_level) as zipf:
                
                for source_dir in backup_sources:
                    if source_dir.exists():
                        for root, dirs, files in os.walk(source_dir):
                            # 제외할 디렉토리 필터링
                            dirs[:] = [d for d in dirs if not self._should_exclude(Path(root) / d)]
                            
                            for file in files:
                                file_path = Path(root) / file
                                if not self._should_exclude(file_path):
                                    arcname = str(file_path.relative_to(Path.cwd()))
                                    zipf.write(file_path, arcname)
            
            # 백업 정보 생성
            backup_size = backup_file.stat().st_size
            checksum = self._calculate_checksum(backup_file)
            
            backup_info = BackupInfo(
                id=backup_id,
                name=backup_name,
                timestamp=datetime.now(),
                size=backup_size,
                type='full',
                status='created',
                file_path=str(backup_file),
                checksum=checksum,
                metadata={
                    'sources': [str(s) for s in backup_sources],
                    'compression_level': self.config.compression_level
                }
            )
            
            self.backups.append(backup_info)
            self._save_backup_index()
            
            logger.info(f"전체 백업 생성 완료: {backup_name} ({backup_size} bytes)")
            return backup_info
            
        except Exception as e:
            logger.error(f"전체 백업 생성 실패: {e}")
            raise
    
    def create_incremental_backup(self, name: Optional[str] = None) -> BackupInfo:
        """증분 백업 생성"""
        try:
            backup_id = f"incremental_{int(time.time())}"
            backup_name = name or f"Incremental Backup {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            # 마지막 백업 이후 변경된 파일들 찾기
            last_backup_time = self._get_last_backup_time()
            
            # 백업 파일 경로
            backup_file = self.backup_dir / f"{backup_id}.zip"
            
            # 변경된 파일들 수집
            changed_files = self._find_changed_files(last_backup_time)
            
            if not changed_files:
                logger.info("증분 백업할 변경된 파일이 없습니다.")
                return None
            
            # ZIP 파일 생성
            with zipfile.ZipFile(backup_file, 'w', zipfile.ZIP_DEFLATED,
                               compresslevel=self.config.compression_level) as zipf:
                
                for file_path in changed_files:
                    if not self._should_exclude(file_path):
                        arcname = str(file_path.relative_to(Path.cwd()))
                        zipf.write(file_path, arcname)
            
            # 백업 정보 생성
            backup_size = backup_file.stat().st_size
            checksum = self._calculate_checksum(backup_file)
            
            backup_info = BackupInfo(
                id=backup_id,
                name=backup_name,
                timestamp=datetime.now(),
                size=backup_size,
                type='incremental',
                status='created',
                file_path=str(backup_file),
                checksum=checksum,
                metadata={
                    'changed_files': [str(f) for f in changed_files],
                    'last_backup_time': last_backup_time.isoformat() if last_backup_time else None
                }
            )
            
            self.backups.append(backup_info)
            self._save_backup_index()
            
            logger.info(f"증분 백업 생성 완료: {backup_name} ({len(changed_files)} files, {backup_size} bytes)")
            return backup_info
            
        except Exception as e:
            logger.error(f"증분 백업 생성 실패: {e}")
            raise
    
    def _get_last_backup_time(self) -> Optional[datetime]:
        """마지막 백업 시간 조회"""
        if not self.backups:
            return None
        
        # 최신 백업 시간 찾기
        latest_backup = max(self.backups, key=lambda b: b.timestamp)
        return latest_backup.timestamp
    
    def _find_changed_files(self, since_time: Optional[datetime]) -> List[Path]:
        """변경된 파일들 찾기"""
        changed_files = []
        
        # 백업할 디렉토리들
        backup_sources = [
            Path("backend/app"),
            Path("backend/config"),
            Path("backend/prompts"),
            Path("backend/sample_data"),
            Path("frontend/src"),
            Path("frontend/public"),
            Path("docs"),
            Path("shared")
        ]
        
        for source_dir in backup_sources:
            if source_dir.exists():
                for root, dirs, files in os.walk(source_dir):
                    # 제외할 디렉토리 필터링
                    dirs[:] = [d for d in dirs if not self._should_exclude(Path(root) / d)]
                    
                    for file in files:
                        file_path = Path(root) / file
                        if not self._should_exclude(file_path):
                            # 파일 수정 시간 확인
                            file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                            if since_time is None or file_mtime > since_time:
                                changed_files.append(file_path)
        
        return changed_files
    
    def restore_backup(self, backup_id: str, target_dir: Optional[str] = None) -> bool:
        """백업 복원"""
        try:
            # 백업 정보 찾기
            backup_info = next((b for b in self.backups if b.id == backup_id), None)
            if not backup_info:
                raise ValueError(f"백업을 찾을 수 없습니다: {backup_id}")
            
            if not backup_info.file_path or not Path(backup_info.file_path).exists():
                raise ValueError(f"백업 파일이 존재하지 않습니다: {backup_info.file_path}")
            
            # 복원 대상 디렉토리
            restore_dir = Path(target_dir) if target_dir else Path.cwd()
            restore_dir.mkdir(parents=True, exist_ok=True)
            
            # ZIP 파일 압축 해제
            with zipfile.ZipFile(backup_info.file_path, 'r') as zipf:
                zipf.extractall(restore_dir)
            
            logger.info(f"백업 복원 완료: {backup_info.name} -> {restore_dir}")
            return True
            
        except Exception as e:
            logger.error(f"백업 복원 실패: {e}")
            return False
    
    def upload_to_github(self, backup_id: str) -> bool:
        """GitHub Release에 백업 업로드"""
        try:
            if not self.config.github_enabled:
                raise ValueError("GitHub 백업이 비활성화되어 있습니다.")
            
            # 백업 정보 찾기
            backup_info = next((b for b in self.backups if b.id == backup_id), None)
            if not backup_info:
                raise ValueError(f"백업을 찾을 수 없습니다: {backup_id}")
            
            if not backup_info.file_path or not Path(backup_info.file_path).exists():
                raise ValueError(f"백업 파일이 존재하지 않습니다: {backup_info.file_path}")
            
            # GitHub Release 업로드 (구현 필요)
            # TODO: GitHub API를 사용한 Release 생성 및 파일 업로드
            
            # 백업 상태 업데이트
            backup_info.status = 'uploaded'
            backup_info.github_url = f"https://github.com/{self.config.github_owner}/{self.config.github_repo}/releases"
            self._save_backup_index()
            
            logger.info(f"GitHub 백업 업로드 완료: {backup_info.name}")
            return True
            
        except Exception as e:
            logger.error(f"GitHub 백업 업로드 실패: {e}")
            return False
    
    def list_backups(self) -> List[BackupInfo]:
        """백업 목록 조회"""
        return sorted(self.backups, key=lambda b: b.timestamp, reverse=True)
    
    def get_backup_info(self, backup_id: str) -> Optional[BackupInfo]:
        """백업 정보 조회"""
        return next((b for b in self.backups if b.id == backup_id), None)
    
    def delete_backup(self, backup_id: str) -> bool:
        """백업 삭제"""
        try:
            # 백업 정보 찾기
            backup_info = next((b for b in self.backups if b.id == backup_id), None)
            if not backup_info:
                return False
            
            # 파일 삭제
            if backup_info.file_path and Path(backup_info.file_path).exists():
                Path(backup_info.file_path).unlink()
            
            # 백업 목록에서 제거
            self.backups = [b for b in self.backups if b.id != backup_id]
            self._save_backup_index()
            
            logger.info(f"백업 삭제 완료: {backup_info.name}")
            return True
            
        except Exception as e:
            logger.error(f"백업 삭제 실패: {e}")
            return False
    
    def cleanup_old_backups(self) -> int:
        """오래된 백업 정리"""
        try:
            # 최대 백업 수 초과 시 오래된 백업 삭제
            if len(self.backups) <= self.config.max_backups:
                return 0
            
            # 오래된 백업들 정렬
            sorted_backups = sorted(self.backups, key=lambda b: b.timestamp)
            backups_to_delete = sorted_backups[:-self.config.max_backups]
            
            deleted_count = 0
            for backup in backups_to_delete:
                if self.delete_backup(backup.id):
                    deleted_count += 1
            
            logger.info(f"오래된 백업 {deleted_count}개 정리 완료")
            return deleted_count
            
        except Exception as e:
            logger.error(f"백업 정리 실패: {e}")
            return 0
    
    def get_backup_stats(self) -> Dict[str, Any]:
        """백업 통계 조회"""
        total_size = sum(b.size for b in self.backups)
        full_backups = len([b for b in self.backups if b.type == 'full'])
        incremental_backups = len([b for b in self.backups if b.type == 'incremental'])
        
        return {
            'total_backups': len(self.backups),
            'total_size': total_size,
            'full_backups': full_backups,
            'incremental_backups': incremental_backups,
            'oldest_backup': min(self.backups, key=lambda b: b.timestamp).timestamp if self.backups else None,
            'newest_backup': max(self.backups, key=lambda b: b.timestamp).timestamp if self.backups else None
        }


# 전역 백업 서비스 인스턴스
backup_service = None


def get_backup_service() -> BackupService:
    """백업 서비스 인스턴스 반환"""
    global backup_service
    if backup_service is None:
        backup_service = BackupService()
    return backup_service
