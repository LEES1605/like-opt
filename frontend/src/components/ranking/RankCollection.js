/**
 * 랭크 컬렉션 컴포넌트
 * Like-Opt 프론트엔드 랭킹 목록 컴포넌트
 */

import { BaseComponent } from '../base/BaseComponent.js';
import { RankChip } from './RankChip.js';

/**
 * 랭크 컬렉션 컴포넌트 클래스
 */
export class RankCollection extends BaseComponent {
  constructor(options = {}) {
    super({
      className: 'rank-collection',
      ...options
    });
    
    this.ranks = options.ranks || [];
    this.category = options.category || 'overall';
    this.title = options.title || '랭킹';
    this.subtitle = options.subtitle || '';
    this.showHeader = options.showHeader !== false;
    this.showFilters = options.showFilters !== false;
    this.showPagination = options.showPagination !== false;
    this.itemsPerPage = options.itemsPerPage || 10;
    this.currentPage = options.currentPage || 1;
    this.sortBy = options.sortBy || 'rank'; // rank, score, name
    this.sortOrder = options.sortOrder || 'asc'; // asc, desc
    this.currentUserId = options.currentUserId || null;
  }
  
  /**
   * 상태 설정
   */
  setupState() {
    this.state = {
      ranks: this.ranks,
      category: this.category,
      title: this.title,
      subtitle: this.subtitle,
      showHeader: this.showHeader,
      showFilters: this.showFilters,
      showPagination: this.showPagination,
      itemsPerPage: this.itemsPerPage,
      currentPage: this.currentPage,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      currentUserId: this.currentUserId,
      filteredRanks: this.ranks,
      totalPages: Math.ceil(this.ranks.length / this.itemsPerPage),
      isLoading: false,
      error: null
    };
  }
  
  /**
   * 이벤트 설정
   */
  setupEvents() {
    this.events = {
      'click .filter-button': (event) => this.handleFilterClick(event),
      'click .sort-button': (event) => this.handleSortClick(event),
      'click .pagination-button': (event) => this.handlePaginationClick(event),
      'click .refresh-button': (event) => this.handleRefreshClick(event),
      ...this.events
    };
  }
  
  /**
   * 템플릿 렌더링
   */
  renderTemplate() {
    const { 
      title, subtitle, showHeader, showFilters, showPagination, 
      filteredRanks, currentPage, totalPages, sortBy, sortOrder,
      isLoading, error 
    } = this.state;
    
    const paginatedRanks = this.getPaginatedRanks();
    
    return `
      <div class="rank-collection-container">
        ${showHeader ? this.renderHeader() : ''}
        
        ${showFilters ? this.renderFilters() : ''}
        
        ${error ? this.renderError() : ''}
        
        ${isLoading ? this.renderLoading() : ''}
        
        <div class="rank-list">
          ${paginatedRanks.map((rank, index) => this.renderRankChip(rank, index)).join('')}
        </div>
        
        ${showPagination && totalPages > 1 ? this.renderPagination() : ''}
      </div>
    `;
  }
  
  /**
   * 헤더 렌더링
   */
  renderHeader() {
    const { title, subtitle } = this.state;
    
    return `
      <div class="rank-collection-header">
        <div class="header-content">
          <h2 class="collection-title">${title}</h2>
          ${subtitle ? `<p class="collection-subtitle">${subtitle}</p>` : ''}
        </div>
        <div class="header-actions">
          <button class="refresh-button" title="새로고침">
            <span class="refresh-icon">🔄</span>
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * 필터 렌더링
   */
  renderFilters() {
    const { sortBy, sortOrder } = this.state;
    
    return `
      <div class="rank-collection-filters">
        <div class="filter-group">
          <label class="filter-label">정렬 기준:</label>
          <div class="filter-buttons">
            <button class="filter-button ${sortBy === 'rank' ? 'active' : ''}" data-sort="rank">
              랭킹순
            </button>
            <button class="filter-button ${sortBy === 'score' ? 'active' : ''}" data-sort="score">
              점수순
            </button>
            <button class="filter-button ${sortBy === 'name' ? 'active' : ''}" data-sort="name">
              이름순
            </button>
          </div>
        </div>
        
        <div class="sort-order-group">
          <button class="sort-button ${sortOrder === 'asc' ? 'active' : ''}" data-order="asc">
            <span class="sort-icon">↑</span> 오름차순
          </button>
          <button class="sort-button ${sortOrder === 'desc' ? 'active' : ''}" data-order="desc">
            <span class="sort-icon">↓</span> 내림차순
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * 랭크 칩 렌더링
   */
  renderRankChip(rankData, index) {
    const rankChip = new RankChip({
      ...rankData,
      isCurrentUser: rankData.id === this.state.currentUserId
    });
    
    return rankChip.render();
  }
  
  /**
   * 페이지네이션 렌더링
   */
  renderPagination() {
    const { currentPage, totalPages } = this.state;
    
    const pages = this.getPaginationPages();
    
    return `
      <div class="rank-collection-pagination">
        <button class="pagination-button prev ${currentPage === 1 ? 'disabled' : ''}" 
                data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
          이전
        </button>
        
        <div class="pagination-pages">
          ${pages.map(page => `
            <button class="pagination-button page ${page === currentPage ? 'active' : ''}" 
                    data-page="${page}">
              ${page}
            </button>
          `).join('')}
        </div>
        
        <button class="pagination-button next ${currentPage === totalPages ? 'disabled' : ''}" 
                data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
          다음
        </button>
      </div>
    `;
  }
  
  /**
   * 로딩 렌더링
   */
  renderLoading() {
    return `
      <div class="rank-collection-loading">
        <div class="loading-spinner"></div>
        <p>랭킹을 불러오는 중...</p>
      </div>
    `;
  }
  
  /**
   * 에러 렌더링
   */
  renderError() {
    const { error } = this.state;
    
    return `
      <div class="rank-collection-error">
        <div class="error-icon">⚠️</div>
        <h3>랭킹을 불러올 수 없습니다</h3>
        <p>${error}</p>
        <button class="retry-button" onclick="this.refresh()">다시 시도</button>
      </div>
    `;
  }
  
  /**
   * 필터 클릭 이벤트 처리
   */
  handleFilterClick(event) {
    const sortBy = event.target.dataset.sort;
    if (sortBy) {
      this.setSortBy(sortBy);
    }
  }
  
  /**
   * 정렬 클릭 이벤트 처리
   */
  handleSortClick(event) {
    const order = event.target.dataset.order;
    if (order) {
      this.setSortOrder(order);
    }
  }
  
  /**
   * 페이지네이션 클릭 이벤트 처리
   */
  handlePaginationClick(event) {
    const page = parseInt(event.target.dataset.page);
    if (page && page !== this.state.currentPage) {
      this.setCurrentPage(page);
    }
  }
  
  /**
   * 새로고침 클릭 이벤트 처리
   */
  handleRefreshClick(event) {
    this.refresh();
  }
  
  /**
   * 랭크 데이터 설정
   */
  setRanks(ranks) {
    this.setState({ 
      ranks,
      filteredRanks: this.filterRanks(ranks),
      totalPages: Math.ceil(ranks.length / this.state.itemsPerPage)
    });
  }
  
  /**
   * 카테고리 설정
   */
  setCategory(category) {
    this.setState({ category });
    this.filterRanks();
  }
  
  /**
   * 제목 설정
   */
  setTitle(title) {
    this.setState({ title });
  }
  
  /**
   * 부제목 설정
   */
  setSubtitle(subtitle) {
    this.setState({ subtitle });
  }
  
  /**
   * 정렬 기준 설정
   */
  setSortBy(sortBy) {
    this.setState({ sortBy });
    this.sortRanks();
  }
  
  /**
   * 정렬 순서 설정
   */
  setSortOrder(sortOrder) {
    this.setState({ sortOrder });
    this.sortRanks();
  }
  
  /**
   * 현재 페이지 설정
   */
  setCurrentPage(page) {
    this.setState({ currentPage: page });
  }
  
  /**
   * 현재 사용자 ID 설정
   */
  setCurrentUserId(userId) {
    this.setState({ currentUserId: userId });
  }
  
  /**
   * 랭크 필터링
   */
  filterRanks(ranks = null) {
    const ranksToFilter = ranks || this.state.ranks;
    const { category } = this.state;
    
    let filtered = ranksToFilter;
    
    if (category && category !== 'overall') {
      filtered = filtered.filter(rank => rank.category === category);
    }
    
    this.setState({ filteredRanks: filtered });
    this.sortRanks(filtered);
    
    return filtered;
  }
  
  /**
   * 랭크 정렬
   */
  sortRanks(ranks = null) {
    const ranksToSort = ranks || this.state.filteredRanks;
    const { sortBy, sortOrder } = this.state;
    
    const sorted = [...ranksToSort].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'rank':
          aValue = a.rank || 0;
          bValue = b.rank || 0;
          break;
        case 'score':
          aValue = a.score || 0;
          bValue = b.score || 0;
          break;
        case 'name':
          aValue = (a.title || '').toLowerCase();
          bValue = (b.title || '').toLowerCase();
          break;
        default:
          aValue = a.rank || 0;
          bValue = b.rank || 0;
      }
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
    
    this.setState({ filteredRanks: sorted });
    return sorted;
  }
  
  /**
   * 페이지네이션된 랭크 가져오기
   */
  getPaginatedRanks() {
    const { filteredRanks, currentPage, itemsPerPage } = this.state;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return filteredRanks.slice(startIndex, endIndex);
  }
  
  /**
   * 페이지네이션 페이지 목록 가져오기
   */
  getPaginationPages() {
    const { currentPage, totalPages } = this.state;
    const pages = [];
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  /**
   * 새로고침
   */
  async refresh() {
    this.setState({ isLoading: true, error: null });
    
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 실제 구현에서는 API에서 데이터를 가져옴
      this.setState({ isLoading: false });
      
      this.emit('rank:refresh', {
        category: this.state.category,
        sortBy: this.state.sortBy,
        sortOrder: this.state.sortOrder
      });
      
    } catch (error) {
      this.setState({ 
        isLoading: false, 
        error: error.message || '랭킹을 불러오는 중 오류가 발생했습니다.' 
      });
    }
  }
  
  /**
   * 랭크 추가
   */
  addRank(rankData) {
    const newRanks = [...this.state.ranks, rankData];
    this.setRanks(newRanks);
  }
  
  /**
   * 랭크 업데이트
   */
  updateRank(rankId, rankData) {
    const updatedRanks = this.state.ranks.map(rank => 
      rank.id === rankId ? { ...rank, ...rankData } : rank
    );
    this.setRanks(updatedRanks);
  }
  
  /**
   * 랭크 제거
   */
  removeRank(rankId) {
    const filteredRanks = this.state.ranks.filter(rank => rank.id !== rankId);
    this.setRanks(filteredRanks);
  }
  
  /**
   * 랭크 데이터 가져오기
   */
  getRankData() {
    return {
      ranks: this.state.ranks,
      category: this.state.category,
      title: this.state.title,
      subtitle: this.state.subtitle,
      sortBy: this.state.sortBy,
      sortOrder: this.state.sortOrder,
      currentPage: this.state.currentPage,
      totalPages: this.state.totalPages
    };
  }
}

// 랭크 컬렉션 팩토리
export class RankCollectionFactory {
  static create(options = {}) {
    return new RankCollection(options);
  }
  
  static createLeaderboard(ranks, options = {}) {
    return new RankCollection({
      title: '리더보드',
      subtitle: '전체 랭킹',
      ranks,
      showFilters: true,
      showPagination: true,
      ...options
    });
  }
  
  static createCategoryRanking(category, ranks, options = {}) {
    const categoryTitles = {
      grammar: '문법 랭킹',
      sentence: '문장분석 랭킹',
      passage: '지문설명 랭킹',
      weekly: '주간 랭킹',
      monthly: '월간 랭킹'
    };
    
    return new RankCollection({
      title: categoryTitles[category] || '랭킹',
      category,
      ranks,
      showFilters: false,
      showPagination: true,
      ...options
    });
  }
}

// 랭크 컬렉션 매니저
export class RankCollectionManager {
  static collections = new Map();
  
  static register(id, collection) {
    this.collections.set(id, collection);
  }
  
  static get(id) {
    return this.collections.get(id);
  }
  
  static getAll() {
    return Array.from(this.collections.values());
  }
  
  static getByCategory(category) {
    return this.getAll().filter(collection => collection.state.category === category);
  }
  
  static cleanup() {
    this.collections.clear();
  }
}
