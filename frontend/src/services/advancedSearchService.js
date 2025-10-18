/**
 * 고급 검색 서비스
 * 하이브리드 검색, 리랭킹, 동적 인덱싱을 포함한 고급 RAG 검색
 */

import { apiClient, ApiError } from './api.js';

export class AdvancedSearchService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분
  }

  /**
   * 하이브리드 검색 실행
   * @param {Object} options - 검색 옵션
   * @param {string} options.query - 검색 쿼리
   * @param {number} options.topK - 상위 결과 수 (기본값: 10)
   * @param {number} options.alpha - BM25 가중치 (기본값: 0.5)
   * @param {boolean} options.useRerank - 리랭킹 사용 여부 (기본값: true)
   * @returns {Promise<Object>} 검색 결과
   */
  async hybridSearch(options = {}) {
    const {
      query,
      topK = 10,
      alpha = 0.5,
      useRerank = true
    } = options;

    if (!query || query.trim().length === 0) {
      throw new ApiError(400, '검색 쿼리가 비어있습니다.');
    }

    // 캐시 확인
    const cacheKey = `search:${query}:${topK}:${alpha}:${useRerank}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await apiClient.post('/search/advanced', {
        query: query.trim(),
        top_k: topK,
        alpha: alpha,
        use_rerank: useRerank
      });

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      throw new ApiError(error.status || 500, `하이브리드 검색 실패: ${error.message}`);
    }
  }

  /**
   * 검색 통계 조회
   * @returns {Promise<Object>} 검색 통계
   */
  async getSearchStats() {
    try {
      const response = await apiClient.get('/search/stats');
      return response;
    } catch (error) {
      throw new ApiError(error.status || 500, `검색 통계 조회 실패: ${error.message}`);
    }
  }

  /**
   * 검색 인덱스 최적화
   * @returns {Promise<Object>} 최적화 결과
   */
  async optimizeIndex() {
    try {
      const response = await apiClient.post('/search/optimize');
      return response;
    } catch (error) {
      throw new ApiError(error.status || 500, `인덱스 최적화 실패: ${error.message}`);
    }
  }

  /**
   * 검색 결과 분석
   * @param {Array} results - 검색 결과
   * @returns {Object} 분석 결과
   */
  analyzeResults(results) {
    if (!results || results.length === 0) {
      return {
        totalResults: 0,
        avgScore: 0,
        scoreDistribution: {},
        sourceDistribution: {},
        classificationDistribution: {}
      };
    }

    const scores = results.map(r => r.score);
    const sources = results.map(r => r.source);
    const classifications = results.map(r => r.metadata?.classification || 'unknown');

    return {
      totalResults: results.length,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
      scoreDistribution: this._calculateDistribution(scores),
      sourceDistribution: this._calculateDistribution(sources),
      classificationDistribution: this._calculateDistribution(classifications)
    };
  }

  /**
   * 검색 결과 필터링
   * @param {Array} results - 검색 결과
   * @param {Object} filters - 필터 옵션
   * @returns {Array} 필터링된 결과
   */
  filterResults(results, filters = {}) {
    let filtered = [...results];

    // 점수 필터
    if (filters.minScore !== undefined) {
      filtered = filtered.filter(r => r.score >= filters.minScore);
    }

    // 소스 필터
    if (filters.sources && filters.sources.length > 0) {
      filtered = filtered.filter(r => filters.sources.includes(r.source));
    }

    // 분류 필터
    if (filters.classifications && filters.classifications.length > 0) {
      filtered = filtered.filter(r => 
        filters.classifications.includes(r.metadata?.classification || 'unknown')
      );
    }

    // 텍스트 길이 필터
    if (filters.minTextLength !== undefined) {
      filtered = filtered.filter(r => r.text.length >= filters.minTextLength);
    }

    return filtered;
  }

  /**
   * 검색 결과 정렬
   * @param {Array} results - 검색 결과
   * @param {string} sortBy - 정렬 기준 ('score', 'bm25_score', 'vector_score', 'text_length')
   * @param {string} order - 정렬 순서 ('asc', 'desc')
   * @returns {Array} 정렬된 결과
   */
  sortResults(results, sortBy = 'score', order = 'desc') {
    const sorted = [...results].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'bm25_score':
          aValue = a.bm25_score;
          bValue = b.bm25_score;
          break;
        case 'vector_score':
          aValue = a.vector_score;
          bValue = b.vector_score;
          break;
        case 'text_length':
          aValue = a.text.length;
          bValue = b.text.length;
          break;
        default:
          aValue = a.score;
          bValue = b.score;
      }

      if (order === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  }

  /**
   * 검색 히스토리 관리
   */
  getSearchHistory() {
    const history = localStorage.getItem('advanced_search_history');
    return history ? JSON.parse(history) : [];
  }

  addToSearchHistory(query, results) {
    const history = this.getSearchHistory();
    const newEntry = {
      query,
      timestamp: new Date().toISOString(),
      resultCount: results.length,
      avgScore: results.length > 0 ? 
        results.reduce((sum, r) => sum + r.score, 0) / results.length : 0
    };

    // 중복 제거
    const filtered = history.filter(h => h.query !== query);
    filtered.unshift(newEntry);

    // 최대 50개 유지
    const limited = filtered.slice(0, 50);
    localStorage.setItem('advanced_search_history', JSON.stringify(limited));
  }

  clearSearchHistory() {
    localStorage.removeItem('advanced_search_history');
  }

  /**
   * 캐시 관리
   */
  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 유틸리티 메서드들
   */
  _calculateDistribution(values) {
    const distribution = {};
    values.forEach(value => {
      distribution[value] = (distribution[value] || 0) + 1;
    });
    return distribution;
  }

  /**
   * 검색 결과를 텍스트로 변환
   * @param {Array} results - 검색 결과
   * @param {Object} options - 옵션
   * @returns {string} 텍스트 형태의 결과
   */
  resultsToText(results, options = {}) {
    const {
      includeScore = false,
      includeMetadata = false,
      maxLength = 1000
    } = options;

    let text = '';
    results.forEach((result, index) => {
      text += `${index + 1}. ${result.title || '제목 없음'}\n`;
      text += `   ${result.text.substring(0, maxLength)}${result.text.length > maxLength ? '...' : ''}\n`;
      
      if (includeScore) {
        text += `   점수: ${result.score.toFixed(3)} (BM25: ${result.bm25_score.toFixed(3)}, Vector: ${result.vector_score.toFixed(3)})\n`;
      }
      
      if (includeMetadata && result.metadata) {
        text += `   메타데이터: ${JSON.stringify(result.metadata)}\n`;
      }
      
      text += `   출처: ${result.source}\n\n`;
    });

    return text;
  }
}

export class AdvancedSearchError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'AdvancedSearchError';
    this.status = status;
  }
}

// 전역 인스턴스
export const advancedSearchService = new AdvancedSearchService();
