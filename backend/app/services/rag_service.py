"""
RAG 서비스 모듈

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
            # Like-Opt용 persist 디렉토리 설정
            from ..config import Config
            config = Config()
            effective_persist_dir = lambda: config.RAG_PERSIST_DIR
            
            persist_dir = Path(effective_persist_dir())
            chunks_file = persist_dir / "chunks.jsonl"
            
            # persist 디렉토리가 없으면 생성
            persist_dir.mkdir(parents=True, exist_ok=True)
            
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
    
    def _get_hybrid_engine(self):
        """하이브리드 검색 엔진 지연 로딩"""
        if self._hybrid_engine is not None:
            return self._hybrid_engine
        
        try:
            import os
            from ..domain.rag.hybrid_search import create_hybrid_search_engine
            from ..domain.rag.vector_indexer import get_default_indexer
            
            # 검색 모드 설정
            self._retrieval_mode = os.getenv('RAG_RETRIEVAL_MODE', 'hybrid')
            
            # BM25 엔진 (기존 키워드 검색을 BM25로 업그레이드)
            # 현재는 간단한 키워드 검색을 유지하고, 벡터 검색과 병합
            bm25_engine = self  # self.search()를 BM25로 사용
            
            # 벡터 인덱서
            try:
                vector_indexer = get_default_indexer()
            except Exception as e:
                print(f"[RAG] Vector indexer not available: {e}")
                vector_indexer = None
            
            # 하이브리드 엔진 생성
            alpha = float(os.getenv('RAG_ALPHA', '0.5'))
            self._hybrid_engine = create_hybrid_search_engine(
                bm25_engine=bm25_engine,
                vector_indexer=vector_indexer,
                alpha=alpha
            )
            
            print(f"[RAG] Hybrid search engine initialized (mode: {self._retrieval_mode}, alpha: {alpha})")
            return self._hybrid_engine
            
        except Exception as e:
            print(f"[RAG] Failed to initialize hybrid engine: {e}")
            return None
    
    def _convert_to_dict_list(self, rag_results: List[RAGResult]) -> List[Dict[str, Any]]:
        """RAGResult 리스트를 딕셔너리 리스트로 변환"""
        return [result.to_dict() for result in rag_results]
    
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
            text = chunk.get('text', '')
            text_lower = text.lower()
            
            # 점수 계산: 쿼리 토큰이 몇 개나 포함되어 있는지
            score = 0
            for token in query_tokens:
                # 정확한 단어 매칭
                count = len(re.findall(r'\b' + re.escape(token) + r'\b', text_lower, re.IGNORECASE))
                if count > 0:
                    score += count
                else:
                    # 부분 문자열 매칭
                    score += text_lower.count(token) * 0.5
            
            if score > 0:
                results.append({
                    'chunk': chunk,
                    'score': score,
                    'text': text
                })
        
        # 점수 순 정렬
        results.sort(key=lambda x: x['score'], reverse=True)
        top_results = results[:top_k]
        
        # RAGResult 객체로 변환
        rag_results = []
        for result in top_results:
            chunk = result['chunk']
            rag_results.append(RAGResult(
                title=chunk.get('title', 'Untitled'),
                text=result['text'],
                score=result['score'],
                doc_id=chunk.get('doc_id', ''),
                chunk_id=chunk.get('chunk_id', ''),
                source=chunk.get('source', '')
            ))
        
        return rag_results
    
    def get_context_for_query(self, query: str, max_chunks: int = 3) -> str:
        """
        쿼리에 대한 컨텍스트 생성 (Professor G에게 전달할 정보)
        
        Args:
            query (str): 사용자 쿼리
            max_chunks (int): 최대 청크 수
            
        Returns:
            str: 컨텍스트 텍스트
        """
        # 하이브리드 검색 시도 (환경 변수로 제어)
        import os
        use_hybrid = os.getenv('RAG_RETRIEVAL_MODE', 'bm25') == 'hybrid'
        
        results = self.search(query, top_k=max_chunks, use_hybrid=use_hybrid)
        
        if not results:
            return ""
        
        context_parts = []
        context_parts.append("=== 관련 학습 자료 ===\n")
        
        for i, result in enumerate(results, 1):
            context_parts.append(f"\n[자료 {i}] {result.title}")
            context_parts.append(f"{result.text[:500]}...")
            context_parts.append("")
        
        context_parts.append("=== 위 자료를 참고하여 답변하세요 ===\n")
        
        return "\n".join(context_parts)
    
    def is_index_ready(self) -> bool:
        """
        인덱스가 준비되었는지 확인
        
        Returns:
            bool: 인덱스 준비 여부
        """
        chunks = self._load_chunks()
        return len(chunks) > 0
    
    def get_index_stats(self) -> Dict[str, Any]:
        """
        인덱스 통계 정보
        
        Returns:
            Dict[str, Any]: 통계 정보
        """
        chunks = self._load_chunks()
        
        if not chunks:
            return {
                'ready': False,
                'chunk_count': 0,
                'file_count': 0
            }
        
        # 고유 문서 ID 개수
        doc_ids = set(chunk.get('doc_id', '') for chunk in chunks)
        
        return {
            'ready': True,
            'chunk_count': len(chunks),
            'file_count': len(doc_ids)
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """
        RAG 서비스 통계 정보 (Like-Opt 호환)
        
        Returns:
            Dict[str, Any]: 통계 정보
        """
        stats = self.get_index_stats()
        stats.update({
            'index_ready': self.is_index_ready(),
            'retrieval_mode': self._retrieval_mode,
            'hybrid_engine_available': self._hybrid_engine is not None
        })
        return stats


# 싱글톤 인스턴스
rag_service = RAGService()

