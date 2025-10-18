"""
고급 RAG 서비스
하이브리드 검색, 리랭킹, 동적 인덱싱을 포함한 고급 RAG 시스템
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional, Tuple, Union
from dataclasses import dataclass
import math
import asyncio
import logging
from pathlib import Path

from .rag_service import RAGService
from .indexing_service import IndexingService

logger = logging.getLogger(__name__)


@dataclass
class HybridSearchResult:
    """하이브리드 검색 결과"""
    doc_id: str
    chunk_id: str
    score: float
    bm25_score: float
    vector_score: float
    text: str
    title: str
    source: str
    search_type: str  # 'bm25', 'vector', 'hybrid'
    metadata: Dict[str, Any]


@dataclass
class RerankResult:
    """리랭킹 결과"""
    original_score: float
    rerank_score: float
    boost_factor: float
    classification: str
    evidence_score: float


class BM25Engine:
    """BM25 검색 엔진"""
    
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.N = 0  # 총 문서 수
        self.avg_len = 0.0  # 평균 문서 길이
        self.doc_len = {}  # 문서별 길이
        self.postings = {}  # 토큰별 포스팅 리스트
        self.df = {}  # 토큰별 문서 빈도
        self.docs = {}  # 문서 저장소
    
    def _tokenize(self, text: str) -> List[str]:
        """텍스트 토큰화"""
        return [t.lower().strip() for t in text.split() if t.strip()]
    
    def add_document(self, doc_id: str, text: str, metadata: Dict[str, Any] = None):
        """문서 추가"""
        tokens = self._tokenize(text)
        doc_len = len(tokens)
        
        self.docs[doc_id] = {
            'text': text,
            'tokens': tokens,
            'metadata': metadata or {}
        }
        self.doc_len[doc_id] = doc_len
        
        # 포스팅 업데이트
        for token in set(tokens):
            if token not in self.postings:
                self.postings[token] = []
                self.df[token] = 0
            
            # 중복 제거
            existing = [p for p in self.postings[token] if p.doc_id != doc_id]
            existing.append(self._InvPost(doc_id, tokens.count(token)))
            self.postings[token] = existing
            self.df[token] = len(set(p.doc_id for p in self.postings[token]))
        
        self._update_stats()
    
    def _update_stats(self):
        """통계 정보 업데이트"""
        self.N = len(self.docs)
        if self.N > 0:
            self.avg_len = sum(self.doc_len.values()) / self.N
    
    def search(self, query: str, top_k: int = 10) -> List[Tuple[str, float]]:
        """BM25 검색"""
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []
        
        scores = {}
        
        for token in query_tokens:
            if token not in self.postings:
                continue
            
            idf = math.log((self.N - self.df[token] + 0.5) / (self.df[token] + 0.5))
            
            for posting in self.postings[token]:
                doc_id = posting.doc_id
                tf = posting.tf
                doc_len = self.doc_len[doc_id]
                
                # BM25 점수 계산
                score = idf * (tf * (self.k1 + 1)) / (
                    tf + self.k1 * (1 - self.b + self.b * (doc_len / self.avg_len))
                )
                
                scores[doc_id] = scores.get(doc_id, 0) + score
        
        # 상위 k개 결과 반환
        sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_results[:top_k]
    
    @dataclass
    class _InvPost:
        doc_id: str
        tf: int


class VectorEngine:
    """벡터 검색 엔진"""
    
    def __init__(self, embedding_model=None):
        self.embedding_model = embedding_model
        self.embeddings = {}  # doc_id -> embedding
        self.doc_metadata = {}  # doc_id -> metadata
    
    def add_document(self, doc_id: str, text: str, metadata: Dict[str, Any] = None):
        """문서 추가"""
        if self.embedding_model:
            embedding = self.embedding_model.encode(text)
            self.embeddings[doc_id] = embedding
            self.doc_metadata[doc_id] = metadata or {}
    
    def search(self, query: str, top_k: int = 10) -> List[Tuple[str, float]]:
        """벡터 검색"""
        if not self.embedding_model or not self.embeddings:
            return []
        
        query_embedding = self.embedding_model.encode(query)
        scores = {}
        
        for doc_id, doc_embedding in self.embeddings.items():
            # 코사인 유사도 계산
            similarity = self._cosine_similarity(query_embedding, doc_embedding)
            scores[doc_id] = similarity
        
        # 상위 k개 결과 반환
        sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_results[:top_k]
    
    def _cosine_similarity(self, a, b):
        """코사인 유사도 계산"""
        import numpy as np
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


class RerankEngine:
    """리랭킹 엔진"""
    
    def __init__(self):
        self.classifiers = {}
        self.boost_factors = {
            'reason': 0.50,  # 이유문법/깨알문법
            'book': 0.20,    # 문법서/grammar 계열
            'other': 0.00    # 기타
        }
    
    def classify_document(self, doc_metadata: Dict[str, Any]) -> str:
        """문서 분류"""
        # 간단한 규칙 기반 분류
        text = doc_metadata.get('text', '').lower()
        source = doc_metadata.get('source', '').lower()
        
        if any(keyword in text for keyword in ['이유', '왜', 'because', 'reason']):
            return 'reason'
        elif any(keyword in source for keyword in ['grammar', '문법', 'book']):
            return 'book'
        else:
            return 'other'
    
    def rerank(self, results: List[HybridSearchResult]) -> List[HybridSearchResult]:
        """검색 결과 리랭킹"""
        for result in results:
            # 문서 분류
            classification = self.classify_document(result.metadata)
            
            # 증거 점수 계산
            evidence_score = self._calculate_evidence_score(result, classification)
            
            # 부스트 팩터 적용
            boost_factor = self.boost_factors.get(classification, 0.0)
            
            # 최종 점수 계산
            result.score = result.score * (1 + boost_factor) + evidence_score
            
            # 메타데이터 업데이트
            result.metadata.update({
                'classification': classification,
                'evidence_score': evidence_score,
                'boost_factor': boost_factor
            })
        
        # 점수순으로 재정렬
        return sorted(results, key=lambda x: x.score, reverse=True)
    
    def _calculate_evidence_score(self, result: HybridSearchResult, classification: str) -> float:
        """증거 점수 계산"""
        base_score = 0.0
        
        # 텍스트 길이 기반 점수
        text_length = len(result.text)
        if text_length > 500:
            base_score += 0.1
        elif text_length > 200:
            base_score += 0.05
        
        # 소스 신뢰도 기반 점수
        source = result.source.lower()
        if 'official' in source or '공식' in source:
            base_score += 0.2
        elif 'academic' in source or '학술' in source:
            base_score += 0.15
        
        return base_score


class AdvancedRAGService:
    """고급 RAG 서비스"""
    
    def __init__(self, rag_service: RAGService, indexing_service: IndexingService):
        self.rag_service = rag_service
        self.indexing_service = indexing_service
        
        # 검색 엔진 초기화
        self.bm25_engine = BM25Engine()
        self.vector_engine = VectorEngine()
        self.rerank_engine = RerankEngine()
        
        # 하이브리드 검색 설정
        self.alpha = 0.5  # BM25 가중치 (0.0 = 벡터만, 1.0 = BM25만)
        self.cache = {}  # 검색 결과 캐시
        self.cache_ttl = 3600  # 캐시 TTL (초)
    
    async def initialize(self):
        """서비스 초기화"""
        logger.info("고급 RAG 서비스 초기화 중...")
        
        # 기존 인덱스 로드
        await self._load_existing_index()
        
        # 벡터 엔진 설정
        try:
            from sentence_transformers import SentenceTransformer
            self.vector_engine.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("벡터 엔진 초기화 완료")
        except ImportError:
            logger.warning("sentence-transformers가 설치되지 않음. 벡터 검색 비활성화")
        
        logger.info("고급 RAG 서비스 초기화 완료")
    
    async def _load_existing_index(self):
        """기존 인덱스 로드"""
        try:
            # 기존 RAG 서비스에서 문서 로드
            documents = await self.rag_service.get_all_documents()
            
            for doc in documents:
                doc_id = doc.get('id', '')
                text = doc.get('content', '')
                metadata = doc.get('metadata', {})
                
                # BM25 엔진에 추가
                self.bm25_engine.add_document(doc_id, text, metadata)
                
                # 벡터 엔진에 추가
                self.vector_engine.add_document(doc_id, text, metadata)
            
            logger.info(f"기존 인덱스 로드 완료: {len(documents)}개 문서")
            
        except Exception as e:
            logger.error(f"기존 인덱스 로드 실패: {e}")
    
    async def hybrid_search(
        self,
        query: str,
        top_k: int = 10,
        alpha: float = None,
        use_rerank: bool = True
    ) -> List[HybridSearchResult]:
        """하이브리드 검색"""
        if alpha is None:
            alpha = self.alpha
        
        # 캐시 확인
        cache_key = f"hybrid:{query}:{top_k}:{alpha}:{use_rerank}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # BM25 검색
            bm25_results = self.bm25_engine.search(query, top_k * 2)
            bm25_scores = {doc_id: score for doc_id, score in bm25_results}
            
            # 벡터 검색
            vector_results = self.vector_engine.search(query, top_k * 2)
            vector_scores = {doc_id: score for doc_id, score in vector_results}
            
            # 모든 문서 ID 수집
            all_doc_ids = set(bm25_scores.keys()) | set(vector_scores.keys())
            
            # 하이브리드 점수 계산
            hybrid_results = []
            for doc_id in all_doc_ids:
                bm25_score = bm25_scores.get(doc_id, 0.0)
                vector_score = vector_scores.get(doc_id, 0.0)
                
                # 가중 평균 점수
                hybrid_score = alpha * bm25_score + (1 - alpha) * vector_score
                
                # 문서 정보 가져오기
                doc_info = self.bm25_engine.docs.get(doc_id, {})
                text = doc_info.get('text', '')
                metadata = doc_info.get('metadata', {})
                
                result = HybridSearchResult(
                    doc_id=doc_id,
                    chunk_id=doc_id,
                    score=hybrid_score,
                    bm25_score=bm25_score,
                    vector_score=vector_score,
                    text=text,
                    title=metadata.get('title', ''),
                    source=metadata.get('source', ''),
                    search_type='hybrid',
                    metadata=metadata
                )
                
                hybrid_results.append(result)
            
            # 점수순 정렬
            hybrid_results.sort(key=lambda x: x.score, reverse=True)
            
            # 상위 k개 선택
            top_results = hybrid_results[:top_k]
            
            # 리랭킹 적용
            if use_rerank:
                top_results = self.rerank_engine.rerank(top_results)
            
            # 캐시 저장
            self.cache[cache_key] = top_results
            
            logger.info(f"하이브리드 검색 완료: {len(top_results)}개 결과")
            return top_results
            
        except Exception as e:
            logger.error(f"하이브리드 검색 실패: {e}")
            return []
    
    async def add_document(self, doc_id: str, text: str, metadata: Dict[str, Any] = None):
        """문서 추가 (동적 인덱싱)"""
        try:
            # BM25 엔진에 추가
            self.bm25_engine.add_document(doc_id, text, metadata)
            
            # 벡터 엔진에 추가
            self.vector_engine.add_document(doc_id, text, metadata)
            
            # 캐시 무효화
            self._invalidate_cache()
            
            logger.info(f"문서 추가 완료: {doc_id}")
            
        except Exception as e:
            logger.error(f"문서 추가 실패: {e}")
    
    async def remove_document(self, doc_id: str):
        """문서 제거"""
        try:
            # BM25 엔진에서 제거
            if doc_id in self.bm25_engine.docs:
                del self.bm25_engine.docs[doc_id]
                del self.bm25_engine.doc_len[doc_id]
                
                # 포스팅에서 제거
                for token, postings in self.bm25_engine.postings.items():
                    self.bm25_engine.postings[token] = [
                        p for p in postings if p.doc_id != doc_id
                    ]
                    self.bm25_engine.df[token] = len(set(
                        p.doc_id for p in self.bm25_engine.postings[token]
                    ))
                
                self.bm25_engine._update_stats()
            
            # 벡터 엔진에서 제거
            if doc_id in self.vector_engine.embeddings:
                del self.vector_engine.embeddings[doc_id]
                del self.vector_engine.doc_metadata[doc_id]
            
            # 캐시 무효화
            self._invalidate_cache()
            
            logger.info(f"문서 제거 완료: {doc_id}")
            
        except Exception as e:
            logger.error(f"문서 제거 실패: {e}")
    
    def _invalidate_cache(self):
        """캐시 무효화"""
        self.cache.clear()
        logger.info("캐시 무효화 완료")
    
    async def get_search_stats(self) -> Dict[str, Any]:
        """검색 통계 정보"""
        return {
            'total_documents': len(self.bm25_engine.docs),
            'total_tokens': len(self.bm25_engine.postings),
            'avg_doc_length': self.bm25_engine.avg_len,
            'cache_size': len(self.cache),
            'vector_embeddings': len(self.vector_engine.embeddings)
        }
    
    async def optimize_index(self):
        """인덱스 최적화"""
        try:
            # 불필요한 토큰 제거
            tokens_to_remove = []
            for token, df in self.bm25_engine.df.items():
                if df < 2:  # 2개 미만 문서에만 나타나는 토큰 제거
                    tokens_to_remove.append(token)
            
            for token in tokens_to_remove:
                if token in self.bm25_engine.postings:
                    del self.bm25_engine.postings[token]
                if token in self.bm25_engine.df:
                    del self.bm25_engine.df[token]
            
            logger.info(f"인덱스 최적화 완료: {len(tokens_to_remove)}개 토큰 제거")
            
        except Exception as e:
            logger.error(f"인덱스 최적화 실패: {e}")


# 전역 인스턴스
advanced_rag_service = None


async def get_advanced_rag_service() -> AdvancedRAGService:
    """고급 RAG 서비스 인스턴스 반환"""
    global advanced_rag_service
    
    if advanced_rag_service is None:
        from .rag_service import rag_service
        from .indexing_service import indexing_service
        
        advanced_rag_service = AdvancedRAGService(rag_service, indexing_service)
        await advanced_rag_service.initialize()
    
    return advanced_rag_service
