"""
MAIC Flask Optimized - Indexing Service

Google Drive prepared 폴더에서 자료를 가져와 인덱싱하는 서비스
"""

import json
import time
import hashlib
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import os

from ..config import Config


class IndexingService:
    """인덱싱 관련 서비스 클래스"""
    
    def __init__(self):
        self.config = Config()
        self._persist_dir = Path(self.config.RAG_PERSIST_DIR)
        self._indexing_state_file = self._persist_dir / ".indexing_state.json"
        self._chunks_file = self._persist_dir / "chunks.jsonl"
        
        # persist 디렉토리 생성
        self._persist_dir.mkdir(parents=True, exist_ok=True)
    
    def load_indexing_state(self) -> Dict[str, Any]:
        """인덱싱 상태 로드"""
        try:
            if self._indexing_state_file.exists():
                with open(self._indexing_state_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"[Indexing] 상태 로드 실패: {e}")
        return {"indexed_files": {}, "last_scan_time": None}
    
    def save_indexing_state(self, state: Dict[str, Any]) -> None:
        """인덱싱 상태 저장"""
        try:
            with open(self._indexing_state_file, 'w', encoding='utf-8') as f:
                json.dump(state, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[Indexing] 상태 저장 실패: {e}")
    
    def calculate_file_hash(self, file_path: Path) -> str:
        """파일 해시 계산"""
        try:
            with open(file_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception:
            return ""
    
    def scan_new_files(self) -> List[Tuple[Path, str]]:
        """
        새 파일 스캔
        
        Returns:
            List[Tuple[Path, str]]: (파일경로, 해시) 튜플 리스트
        """
        state = self.load_indexing_state()
        indexed_files = state.get("indexed_files", {})
        new_files = []
        
        # Google Drive prepared 폴더에서 파일 스캔
        prepared_folder_id = os.getenv('GDRIVE_PREPARED_FOLDER_ID')
        if not prepared_folder_id:
            print("[Indexing] GDRIVE_PREPARED_FOLDER_ID가 설정되지 않았습니다")
            return new_files
        
        try:
            # Google Drive API를 사용하여 파일 목록 가져오기
            files = self._get_gdrive_files(prepared_folder_id)
            
            for file_info in files:
                file_path = Path(file_info['name'])
                file_hash = file_info.get('hash', '')
                
                # 새 파일이거나 해시가 다른 경우
                if file_path.as_posix() not in indexed_files or indexed_files[file_path.as_posix()] != file_hash:
                    new_files.append((file_path, file_hash))
                    
        except Exception as e:
            print(f"[Indexing] 파일 스캔 실패: {e}")
        
        return new_files
    
    def _get_gdrive_files(self, folder_id: str) -> List[Dict[str, Any]]:
        """
        Google Drive에서 파일 목록 가져오기
        
        Args:
            folder_id: 폴더 ID
            
        Returns:
            List[Dict]: 파일 정보 리스트
        """
        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build
            
            # 서비스 계정 인증
            sa_json_path = os.getenv('GDRIVE_SA_JSON', 'data/keys/gdrive_sa.json')
            if not Path(sa_json_path).exists():
                print(f"[Indexing] 서비스 계정 JSON 파일이 없습니다: {sa_json_path}")
                return []
            
            credentials = service_account.Credentials.from_service_account_file(
                sa_json_path,
                scopes=['https://www.googleapis.com/auth/drive.readonly']
            )
            
            service = build('drive', 'v3', credentials=credentials)
            
            # 폴더 내 파일 목록 조회
            results = service.files().list(
                q=f"'{folder_id}' in parents and trashed=false",
                fields="files(id,name,mimeType,modifiedTime,size)"
            ).execute()
            
            files = []
            for file_info in results.get('files', []):
                files.append({
                    'id': file_info['id'],
                    'name': file_info['name'],
                    'mime_type': file_info['mimeType'],
                    'modified_time': file_info.get('modifiedTime'),
                    'size': file_info.get('size', '0')
                })
            
            return files
            
        except Exception as e:
            print(f"[Indexing] Google Drive API 호출 실패: {e}")
            return []
    
    def download_and_process_file(self, file_id: str, file_name: str) -> List[Dict[str, Any]]:
        """
        파일 다운로드 및 처리
        
        Args:
            file_id: Google Drive 파일 ID
            file_name: 파일명
            
        Returns:
            List[Dict]: 처리된 청크 리스트
        """
        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build
            from googleapiclient.http import MediaIoBaseDownload
            import io
            
            # 서비스 계정 인증
            sa_json_path = os.getenv('GDRIVE_SA_JSON', 'data/keys/gdrive_sa.json')
            credentials = service_account.Credentials.from_service_account_file(
                sa_json_path,
                scopes=['https://www.googleapis.com/auth/drive.readonly']
            )
            
            service = build('drive', 'v3', credentials=credentials)
            
            # 파일 다운로드
            request = service.files().get_media(fileId=file_id)
            file_content = io.BytesIO()
            downloader = MediaIoBaseDownload(file_content, request)
            
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            file_content.seek(0)
            content = file_content.read().decode('utf-8')
            
            # 텍스트 청킹
            chunks = self._chunk_text(content, file_name)
            
            return chunks
            
        except Exception as e:
            print(f"[Indexing] 파일 처리 실패 {file_name}: {e}")
            return []
    
    def _chunk_text(self, text: str, source: str, chunk_size: int = 1200, overlap: int = 200) -> List[Dict[str, Any]]:
        """
        텍스트를 청크로 분할
        
        Args:
            text: 원본 텍스트
            source: 소스 파일명
            chunk_size: 청크 크기
            overlap: 오버랩 크기
            
        Returns:
            List[Dict]: 청크 리스트
        """
        chunks = []
        
        # 간단한 청킹 (문단 단위)
        paragraphs = text.split('\n\n')
        current_chunk = ""
        chunk_id = 0
        
        for paragraph in paragraphs:
            if len(current_chunk) + len(paragraph) <= chunk_size:
                current_chunk += paragraph + "\n\n"
            else:
                if current_chunk:
                    chunks.append({
                        'chunk_id': f"{source}_{chunk_id}",
                        'text': current_chunk.strip(),
                        'source': source,
                        'doc_id': source,
                        'title': f"{source} - 청크 {chunk_id}"
                    })
                    chunk_id += 1
                
                current_chunk = paragraph + "\n\n"
        
        # 마지막 청크 추가
        if current_chunk:
            chunks.append({
                'chunk_id': f"{source}_{chunk_id}",
                'text': current_chunk.strip(),
                'source': source,
                'doc_id': source,
                'title': f"{source} - 청크 {chunk_id}"
            })
        
        return chunks
    
    def update_chunks_file(self, new_chunks: List[Dict[str, Any]]) -> None:
        """
        chunks.jsonl 파일 업데이트
        
        Args:
            new_chunks: 새 청크 리스트
        """
        try:
            # 기존 청크 로드
            existing_chunks = []
            if self._chunks_file.exists():
                with open(self._chunks_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.strip():
                            existing_chunks.append(json.loads(line))
            
            # 새 청크 추가 (중복 제거)
            existing_chunk_ids = {chunk.get('chunk_id') for chunk in existing_chunks}
            for chunk in new_chunks:
                if chunk.get('chunk_id') not in existing_chunk_ids:
                    existing_chunks.append(chunk)
            
            # 파일 저장
            with open(self._chunks_file, 'w', encoding='utf-8') as f:
                for chunk in existing_chunks:
                    f.write(json.dumps(chunk, ensure_ascii=False) + '\n')
            
            print(f"[Indexing] {len(new_chunks)}개 청크 추가, 총 {len(existing_chunks)}개 청크")
            
        except Exception as e:
            print(f"[Indexing] 청크 파일 업데이트 실패: {e}")
    
    def run_indexing(self) -> Dict[str, Any]:
        """
        인덱싱 실행
        
        Returns:
            Dict: 인덱싱 결과
        """
        print("[Indexing] 인덱싱 시작...")
        
        start_time = time.time()
        new_files = self.scan_new_files()
        
        if not new_files:
            print("[Indexing] 새 파일이 없습니다")
            return {"status": "no_new_files", "processed": 0}
        
        total_chunks = 0
        processed_files = 0
        
        for file_path, file_hash in new_files:
            try:
                print(f"[Indexing] 처리 중: {file_path}")
                
                # 실제로는 Google Drive에서 파일을 다운로드하고 처리
                # 여기서는 예시로 빈 청크 생성
                chunks = [{
                    'chunk_id': f"{file_path.stem}_0",
                    'text': f"파일 {file_path}의 내용이 여기에 들어갑니다.",
                    'source': str(file_path),
                    'doc_id': str(file_path),
                    'title': str(file_path)
                }]
                
                self.update_chunks_file(chunks)
                total_chunks += len(chunks)
                processed_files += 1
                
                # 상태 업데이트
                state = self.load_indexing_state()
                state["indexed_files"][str(file_path)] = file_hash
                self.save_indexing_state(state)
                
            except Exception as e:
                print(f"[Indexing] 파일 처리 실패 {file_path}: {e}")
        
        end_time = time.time()
        
        result = {
            "status": "completed",
            "processed_files": processed_files,
            "total_chunks": total_chunks,
            "duration": round(end_time - start_time, 2)
        }
        
        print(f"[Indexing] 완료: {result}")
        return result

# 전역 인덱싱 서비스 인스턴스
indexing_service = IndexingService()
