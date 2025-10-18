/**
 * 고급 검색 인터페이스 컴포넌트
 * 하이브리드 검색, 리랭킹, 필터링 기능을 제공하는 고급 검색 UI
 */

import { BaseComponent } from '../base/BaseComponent.js';
import { advancedSearchService, AdvancedSearchError } from '../../services/advancedSearchService.js';
import { eventBus, AppEvents } from '../../utils/events.js';

export class AdvancedSearchInterface extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.searchService = advancedSearchService;
    this.searchHistory = [];
    this.currentResults = [];
    this.isSearching = false;
    
    // 검색 설정
    this.searchConfig = {
      topK: 10,
      alpha: 0.5,
      useRerank: true,
      filters: {
        minScore: 0,
        sources: [],
        classifications: [],
        minTextLength: 0
      },
      sortBy: 'score',
      sortOrder: 'desc'
    };
    
    this.init();
  }

  init() {
    this.createHTML();
    this.bindEvents();
    this.loadSearchHistory();
    this.updateStats();
  }

  createHTML() {
    this.element.innerHTML = `
      <div class="advanced-search-interface">
        <!-- 검색 헤더 -->
        <div class="search-header">
          <h2>🔍 고급 검색</h2>
          <div class="search-stats" id="search-stats">
            <span class="stat-item">
              <span class="stat-label">문서 수:</span>
              <span class="stat-value" id="total-docs">-</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">토큰 수:</span>
              <span class="stat-value" id="total-tokens">-</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">캐시:</span>
              <span class="stat-value" id="cache-size">-</span>
            </span>
          </div>
        </div>

        <!-- 검색 입력 영역 -->
        <div class="search-input-section">
          <div class="search-input-container">
            <input 
              type="text" 
              id="search-query" 
              class="search-input" 
              placeholder="검색어를 입력하세요..."
              autocomplete="off"
            >
            <button id="search-button" class="search-button" disabled>
              <span class="search-icon">🔍</span>
              <span class="search-text">검색</span>
            </button>
          </div>
          
          <!-- 검색 히스토리 -->
          <div class="search-history" id="search-history" style="display: none;">
            <div class="history-header">
              <span>최근 검색어</span>
              <button id="clear-history" class="clear-history-btn">지우기</button>
            </div>
            <div class="history-items" id="history-items"></div>
          </div>
        </div>

        <!-- 검색 설정 -->
        <div class="search-settings">
          <div class="settings-row">
            <div class="setting-group">
              <label for="top-k">결과 수:</label>
              <input type="number" id="top-k" min="1" max="50" value="10">
            </div>
            <div class="setting-group">
              <label for="alpha">BM25 가중치:</label>
              <input type="range" id="alpha" min="0" max="1" step="0.1" value="0.5">
              <span id="alpha-value">0.5</span>
            </div>
            <div class="setting-group">
              <label>
                <input type="checkbox" id="use-rerank" checked>
                리랭킹 사용
              </label>
            </div>
          </div>
        </div>

        <!-- 필터 설정 -->
        <div class="search-filters">
          <div class="filter-section">
            <h3>필터</h3>
            <div class="filter-row">
              <div class="filter-group">
                <label for="min-score">최소 점수:</label>
                <input type="number" id="min-score" min="0" step="0.1" value="0">
              </div>
              <div class="filter-group">
                <label for="min-text-length">최소 텍스트 길이:</label>
                <input type="number" id="min-text-length" min="0" value="0">
              </div>
            </div>
          </div>
        </div>

        <!-- 검색 결과 -->
        <div class="search-results" id="search-results">
          <div class="results-header">
            <h3>검색 결과</h3>
            <div class="results-actions">
              <button id="export-results" class="action-btn" disabled>내보내기</button>
              <button id="optimize-index" class="action-btn">인덱스 최적화</button>
            </div>
          </div>
          <div class="results-content" id="results-content">
            <div class="no-results">
              <p>검색어를 입력하고 검색 버튼을 클릭하세요.</p>
            </div>
          </div>
        </div>

        <!-- 로딩 인디케이터 -->
        <div class="loading-indicator" id="loading-indicator" style="display: none;">
          <div class="spinner"></div>
          <span>검색 중...</span>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 검색 입력
    const searchInput = this.element.querySelector('#search-query');
    const searchButton = this.element.querySelector('#search-button');
    
    searchInput.addEventListener('input', () => {
      this.toggleSearchButton();
      this.showSearchHistory();
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.isSearching) {
        this.performSearch();
      }
    });
    
    searchButton.addEventListener('click', () => {
      this.performSearch();
    });

    // 검색 히스토리
    const clearHistoryBtn = this.element.querySelector('#clear-history');
    clearHistoryBtn.addEventListener('click', () => {
      this.clearSearchHistory();
    });

    // 검색 설정
    const alphaSlider = this.element.querySelector('#alpha');
    const alphaValue = this.element.querySelector('#alpha-value');
    
    alphaSlider.addEventListener('input', (e) => {
      alphaValue.textContent = e.target.value;
      this.searchConfig.alpha = parseFloat(e.target.value);
    });

    const topKInput = this.element.querySelector('#top-k');
    topKInput.addEventListener('change', (e) => {
      this.searchConfig.topK = parseInt(e.target.value);
    });

    const useRerankCheckbox = this.element.querySelector('#use-rerank');
    useRerankCheckbox.addEventListener('change', (e) => {
      this.searchConfig.useRerank = e.target.checked;
    });

    // 필터 설정
    const minScoreInput = this.element.querySelector('#min-score');
    minScoreInput.addEventListener('change', (e) => {
      this.searchConfig.filters.minScore = parseFloat(e.target.value);
    });

    const minTextLengthInput = this.element.querySelector('#min-text-length');
    minTextLengthInput.addEventListener('change', (e) => {
      this.searchConfig.filters.minTextLength = parseInt(e.target.value);
    });

    // 결과 액션
    const exportBtn = this.element.querySelector('#export-results');
    exportBtn.addEventListener('click', () => {
      this.exportResults();
    });

    const optimizeBtn = this.element.querySelector('#optimize-index');
    optimizeBtn.addEventListener('click', () => {
      this.optimizeIndex();
    });
  }

  async performSearch() {
    const query = this.element.querySelector('#search-query').value.trim();
    if (!query) return;

    this.isSearching = true;
    this.showLoading(true);
    this.toggleSearchButton();

    try {
      // 검색 실행
      const results = await this.searchService.hybridSearch({
        query,
        topK: this.searchConfig.topK,
        alpha: this.searchConfig.alpha,
        useRerank: this.searchConfig.useRerank
      });

      // 결과 처리
      this.currentResults = results.results || [];
      this.displayResults(this.currentResults);
      
      // 히스토리에 추가
      this.addToSearchHistory(query, this.currentResults);
      
      // 통계 업데이트
      this.updateStats();
      
      // 이벤트 발생
      eventBus.emit(AppEvents.ADVANCED_SEARCH_COMPLETED, {
        query,
        results: this.currentResults,
        stats: results.stats
      });

    } catch (error) {
      console.error('검색 실패:', error);
      this.showError(`검색 실패: ${error.message}`);
    } finally {
      this.isSearching = false;
      this.showLoading(false);
      this.toggleSearchButton();
    }
  }

  displayResults(results) {
    const resultsContent = this.element.querySelector('#results-content');
    const exportBtn = this.element.querySelector('#export-results');
    
    if (!results || results.length === 0) {
      resultsContent.innerHTML = `
        <div class="no-results">
          <p>검색 결과가 없습니다.</p>
        </div>
      `;
      exportBtn.disabled = true;
      return;
    }

    // 필터링 적용
    const filteredResults = this.searchService.filterResults(results, this.searchConfig.filters);
    
    // 정렬 적용
    const sortedResults = this.searchService.sortResults(
      filteredResults, 
      this.searchConfig.sortBy, 
      this.searchConfig.sortOrder
    );

    // 결과 분석
    const analysis = this.searchService.analyzeResults(sortedResults);

    // HTML 생성
    let html = `
      <div class="results-summary">
        <div class="summary-stats">
          <span>총 ${sortedResults.length}개 결과</span>
          <span>평균 점수: ${analysis.avgScore.toFixed(3)}</span>
          <span>최고 점수: ${analysis.maxScore.toFixed(3)}</span>
        </div>
      </div>
      <div class="results-list">
    `;

    sortedResults.forEach((result, index) => {
      const metadata = result.metadata || {};
      const classification = metadata.classification || 'unknown';
      const boostFactor = metadata.boost_factor || 0;
      
      html += `
        <div class="result-item" data-index="${index}">
          <div class="result-header">
            <div class="result-title">
              <span class="result-number">${index + 1}</span>
              <span class="result-title-text">${result.title || '제목 없음'}</span>
            </div>
            <div class="result-scores">
              <span class="score total">${result.score.toFixed(3)}</span>
              <span class="score bm25">BM25: ${result.bm25_score.toFixed(3)}</span>
              <span class="score vector">Vector: ${result.vector_score.toFixed(3)}</span>
              ${boostFactor > 0 ? `<span class="score boost">+${boostFactor.toFixed(2)}</span>` : ''}
            </div>
          </div>
          <div class="result-content">
            <div class="result-text">${this.truncateText(result.text, 300)}</div>
            <div class="result-metadata">
              <span class="source">출처: ${result.source}</span>
              <span class="classification">분류: ${classification}</span>
              <span class="search-type">타입: ${result.search_type}</span>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    resultsContent.innerHTML = html;
    exportBtn.disabled = false;
  }

  showLoading(show) {
    const loadingIndicator = this.element.querySelector('#loading-indicator');
    loadingIndicator.style.display = show ? 'flex' : 'none';
  }

  toggleSearchButton() {
    const searchButton = this.element.querySelector('#search-button');
    const searchInput = this.element.querySelector('#search-query');
    const hasQuery = searchInput.value.trim().length > 0;
    
    searchButton.disabled = !hasQuery || this.isSearching;
  }

  showSearchHistory() {
    const historyContainer = this.element.querySelector('#search-history');
    const historyItems = this.element.querySelector('#history-items');
    
    if (this.searchHistory.length > 0) {
      historyContainer.style.display = 'block';
      
      let html = '';
      this.searchHistory.slice(0, 5).forEach(item => {
        html += `
          <div class="history-item" data-query="${item.query}">
            <span class="history-query">${item.query}</span>
            <span class="history-meta">
              ${item.resultCount}개 결과 • ${new Date(item.timestamp).toLocaleDateString()}
            </span>
          </div>
        `;
      });
      
      historyItems.innerHTML = html;
      
      // 히스토리 아이템 클릭 이벤트
      historyItems.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
          const query = item.dataset.query;
          this.element.querySelector('#search-query').value = query;
          this.performSearch();
        });
      });
    } else {
      historyContainer.style.display = 'none';
    }
  }

  loadSearchHistory() {
    this.searchHistory = this.searchService.getSearchHistory();
  }

  addToSearchHistory(query, results) {
    this.searchService.addToSearchHistory(query, results);
    this.loadSearchHistory();
  }

  clearSearchHistory() {
    this.searchService.clearSearchHistory();
    this.searchHistory = [];
    this.showSearchHistory();
  }

  async updateStats() {
    try {
      const stats = await this.searchService.getSearchStats();
      
      this.element.querySelector('#total-docs').textContent = stats.total_documents || 0;
      this.element.querySelector('#total-tokens').textContent = stats.total_tokens || 0;
      this.element.querySelector('#cache-size').textContent = stats.cache_size || 0;
    } catch (error) {
      console.error('통계 업데이트 실패:', error);
    }
  }

  async optimizeIndex() {
    const optimizeBtn = this.element.querySelector('#optimize-index');
    optimizeBtn.disabled = true;
    optimizeBtn.textContent = '최적화 중...';

    try {
      await this.searchService.optimizeIndex();
      this.showSuccess('인덱스 최적화가 완료되었습니다.');
      this.updateStats();
    } catch (error) {
      this.showError(`인덱스 최적화 실패: ${error.message}`);
    } finally {
      optimizeBtn.disabled = false;
      optimizeBtn.textContent = '인덱스 최적화';
    }
  }

  exportResults() {
    if (!this.currentResults || this.currentResults.length === 0) {
      this.showError('내보낼 결과가 없습니다.');
      return;
    }

    const query = this.element.querySelector('#search-query').value;
    const text = this.searchService.resultsToText(this.currentResults, {
      includeScore: true,
      includeMetadata: true
    });

    const blob = new Blob([`검색어: ${query}\n\n${text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search_results_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  showError(message) {
    // 에러 메시지 표시 로직
    console.error(message);
    // TODO: 토스트 알림 구현
  }

  showSuccess(message) {
    // 성공 메시지 표시 로직
    console.log(message);
    // TODO: 토스트 알림 구현
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  destroy() {
    // 정리 작업
    this.searchService.clearCache();
    super.destroy();
  }
}
