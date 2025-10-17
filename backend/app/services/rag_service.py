"""
MAIC Flask Optimized - RAG Service

RAG 인덱스 관리 및 검색 기능을 제공합니다.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class RAGResult:
    """RAG 검색 결과"""
    title: str
    text: str
    score: float
    doc_id: str
    chunk_id: str
    source: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'title': self.title,
            'text': self.text,
            'score': self.score,
            'doc_id': self.doc_id,
            'chunk_id': self.chunk_id,
            'source': self.source
        }


class RAGService:
    """RAG 서비스 클래스 (하이브리드 검색 지원)"""
    
    def __init__(self):
        self._chunks: Optional[List[Dict]] = None
        self._chunks_loaded = False
        self._hybrid_engine = None
        self._retrieval_mode = 'hybrid'  # 'bm25', 'vector', 'hybrid'
    
    def _load_chunks(self) -> List[Dict]:
        """
        chunks.jsonl 파일에서 청크 로드
        
        Returns:
            List[Dict]: 청크 리스트
        """
        if self._chunks_loaded and self._chunks is not None:
            return self._chunks
        
        try:
            from ..config import Config
            config = Config()
            persist_dir = Path(config.RAG_PERSIST_DIR)
            chunks_file = persist_dir / "chunks.jsonl"
            
            if not chunks_file.exists():
                print(f"[RAG] chunks.jsonl 파일이 없습니다: {chunks_file}")
                self._chunks = []
                self._chunks_loaded = True
                return []
            
            chunks = []
            with open(chunks_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        try:
                            chunks.append(json.loads(line))
                        except Exception as e:
                            print(f"[RAG] 청크 파싱 실패: {e}")
                            continue
            
            self._chunks = chunks
            self._chunks_loaded = True
            print(f"[RAG] {len(chunks)}개 청크 로드 완료")
            return chunks
            
        except Exception as e:
            print(f"[RAG] 청크 로드 실패: {e}")
            self._chunks = []
            self._chunks_loaded = True
            return []
    
    def is_index_ready(self) -> bool:
        """
        인덱스가 준비되었는지 확인
        
        Returns:
            bool: 인덱스 준비 상태
        """
        chunks = self._load_chunks()
        return len(chunks) > 0
    
    def search(self, query: str, top_k: int = 5, use_hybrid: bool = False) -> List[RAGResult]:
        """
        쿼리로 RAG 검색 (하이브리드 검색 지원)
        
        Args:
            query (str): 검색 쿼리
            top_k (int): 반환할 최대 결과 수
            use_hybrid (bool): 하이브리드 검색 사용 여부
            
        Returns:
            List[RAGResult]: 검색 결과 리스트
        """
        # 하이브리드 검색 시도
        if use_hybrid:
            try:
                hybrid_engine = self._get_hybrid_engine()
                if hybrid_engine:
                    hybrid_results = hybrid_engine.search(query, top_k=top_k)
                    
                    # HybridSearchResult를 RAGResult로 변환
                    rag_results = []
                    for hr in hybrid_results:
                        rag_results.append(RAGResult(
                            title=hr.title,
                            text=hr.text,
                            score=hr.score,
                            doc_id=hr.doc_id,
                            chunk_id=hr.chunk_id,
                            source=hr.source
                        ))
                    
                    print(f"[RAG] Hybrid search found {len(rag_results)} results")
                    return rag_results
            except Exception as e:
                print(f"[RAG] Hybrid search failed, falling back to keyword search: {e}")
        
        # 폴백: 기존 키워드 기반 검색
        chunks = self._load_chunks()
        
        if not chunks:
            return []
        
        # 간단한 키워드 기반 검색
        query_lower = query.lower()
        query_tokens = re.findall(r'[가-힣A-Za-z0-9]+', query_lower)
        
        if not query_tokens:
            return []
        
        results = []
        
        for chunk in chunks:
            text = chunk.get('text', '').lower()
            title = chunk.get('title', '').lower()
            
            # 점수 계산 (키워드 매칭)
            score = 0
            for token in query_tokens:
                if token in text:
                    score += 1
                if token in title:
                    score += 2  # 제목에 있으면 더 높은 점수
            
            if score > 0:
                results.append(RAGResult(
                    title=chunk.get('title', ''),
                    text=chunk.get('text', ''),
                    score=score,
                    doc_id=chunk.get('doc_id', ''),
                    chunk_id=chunk.get('chunk_id', ''),
                    source=chunk.get('source', '')
                ))
        
        # 점수 순으로 정렬하고 상위 k개 반환
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]
    
    def get_context_for_query(self, query: str, max_chunks: int = 3) -> Optional[str]:
        """
        쿼리에 대한 컨텍스트 생성
        
        Args:
            query (str): 검색 쿼리
            max_chunks (int): 최대 청크 수
            
        Returns:
            Optional[str]: 생성된 컨텍스트
        """
        results = self.search(query, top_k=max_chunks, use_hybrid=True)
        
        if not results:
            return None
        
        context_parts = ["=== 관련 학습 자료 ==="]
        
        for i, result in enumerate(results, 1):
            context_parts.append(f"\n[{i}] {result.title}")
            context_parts.append(f"출처: {result.source}")
            context_parts.append(f"{result.text}")
        
        context_parts.append("\n=== 위 자료를 참고하여 답변해주세요 ===\n")
        
        return "\n".join(context_parts)
    
    def _get_hybrid_engine(self):
        """하이브리드 검색 엔진 지연 로딩"""
        if self._hybrid_engine is not None:
            return self._hybrid_engine
        
        try:
            # 하이브리드 검색 엔진 초기화 (향후 구현)
            print("[RAG] 하이브리드 검색 엔진 초기화 중...")
            # TODO: 하이브리드 검색 엔진 구현
            return None
            
        except Exception as e:
            print(f"[RAG] 하이브리드 검색 엔진 초기화 실패: {e}")
            return None
    
    def get_stats(self) -> Dict[str, Any]:
        """
        RAG 서비스 통계 정보
        
        Returns:
            Dict[str, Any]: 통계 정보
        """
        chunks = self._load_chunks()
        
        return {
            'total_chunks': len(chunks),
            'index_ready': self.is_index_ready(),
            'retrieval_mode': self._retrieval_mode,
            'hybrid_engine_available': self._hybrid_engine is not None
        }

# 전역 RAG 서비스 인스턴스
rag_service = RAGService()
