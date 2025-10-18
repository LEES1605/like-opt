/**
 * 랭크 칩 컴포넌트
 * Like-Opt 프론트엔드 랭킹 표시 컴포넌트
 */

import { BaseComponent } from '../base/BaseComponent.js';

/**
 * 랭크 칩 컴포넌트 클래스
 */
export class RankChip extends BaseComponent {
  constructor(options = {}) {
    super({
      className: 'rank-chip',
      ...options
    });
    
    this.rank = options.rank || 1;
    this.title = options.title || '';
    this.subtitle = options.subtitle || '';
    this.score = options.score || 0;
    this.avatar = options.avatar || '';
    this.badge = options.badge || '';
    this.trend = options.trend || 'stable'; // up, down, stable
    this.isCurrentUser = options.isCurrentUser || false;
    this.category = options.category || 'overall';
  }
  
  /**
   * 상태 설정
   */
  setupState() {
    this.state = {
      rank: this.rank,
      title: this.title,
      subtitle: this.subtitle,
      score: this.score,
      avatar: this.avatar,
      badge: this.badge,
      trend: this.trend,
      isCurrentUser: this.isCurrentUser,
      category: this.category,
      isHovered: false,
      isSelected: false
    };
  }
  
  /**
   * 이벤트 설정
   */
  setupEvents() {
    this.events = {
      click: (event) => this.handleClick(event),
      mouseenter: (event) => this.handleMouseEnter(event),
      mouseleave: (event) => this.handleMouseLeave(event),
      ...this.events
    };
  }
  
  /**
   * 템플릿 렌더링
   */
  renderTemplate() {
    const { rank, title, subtitle, score, avatar, badge, trend, isCurrentUser, isHovered, isSelected } = this.state;
    
    const rankClass = this.getRankClass(rank);
    const trendIcon = this.getTrendIcon(trend);
    const rankText = this.getRankText(rank);
    
    return `
      <div class="rank-chip ${rankClass} ${isCurrentUser ? 'current-user' : ''} ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}" 
           data-rank="${rank}" 
           data-category="${this.category}">
        
        <!-- 랭크 번호 -->
        <div class="rank-number">
          <span class="rank-text">${rankText}</span>
          ${trend !== 'stable' ? `<span class="trend-icon ${trend}">${trendIcon}</span>` : ''}
        </div>
        
        <!-- 아바타 -->
        <div class="rank-avatar">
          ${avatar ? `<img src="${avatar}" alt="${title}" class="avatar-image">` : `<div class="avatar-placeholder">${title.charAt(0)}</div>`}
          ${badge ? `<div class="rank-badge">${badge}</div>` : ''}
        </div>
        
        <!-- 사용자 정보 -->
        <div class="rank-info">
          <h3 class="rank-title">${title}</h3>
          ${subtitle ? `<p class="rank-subtitle">${subtitle}</p>` : ''}
        </div>
        
        <!-- 점수 -->
        <div class="rank-score">
          <span class="score-value">${this.formatScore(score)}</span>
          <span class="score-label">점</span>
        </div>
        
        <!-- 현재 사용자 표시 -->
        ${isCurrentUser ? '<div class="current-user-indicator">나</div>' : ''}
      </div>
    `;
  }
  
  /**
   * 클릭 이벤트 처리
   */
  handleClick(event) {
    event.preventDefault();
    
    this.emit('rank:click', {
      rank: this.state.rank,
      title: this.state.title,
      score: this.state.score,
      category: this.category
    });
    
    this.showUserDetails();
  }
  
  /**
   * 마우스 진입 이벤트 처리
   */
  handleMouseEnter(event) {
    this.setState({ isHovered: true });
  }
  
  /**
   * 마우스 벗어남 이벤트 처리
   */
  handleMouseLeave(event) {
    this.setState({ isHovered: false });
  }
  
  /**
   * 랭크 클래스 가져오기
   */
  getRankClass(rank) {
    if (rank === 1) return 'rank-first';
    if (rank === 2) return 'rank-second';
    if (rank === 3) return 'rank-third';
    if (rank <= 10) return 'rank-top10';
    if (rank <= 100) return 'rank-top100';
    return 'rank-other';
  }
  
  /**
   * 랭크 텍스트 가져오기
   */
  getRankText(rank) {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  }
  
  /**
   * 트렌드 아이콘 가져오기
   */
  getTrendIcon(trend) {
    const icons = {
      up: '↗',
      down: '↘',
      stable: ''
    };
    return icons[trend] || '';
  }
  
  /**
   * 점수 포맷팅
   */
  formatScore(score) {
    if (score >= 1000000) {
      return (score / 1000000).toFixed(1) + 'M';
    }
    if (score >= 1000) {
      return (score / 1000).toFixed(1) + 'K';
    }
    return score.toString();
  }
  
  /**
   * 랭크 설정
   */
  setRank(rank) {
    this.setState({ rank });
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
   * 점수 설정
   */
  setScore(score) {
    this.setState({ score });
  }
  
  /**
   * 아바타 설정
   */
  setAvatar(avatar) {
    this.setState({ avatar });
  }
  
  /**
   * 배지 설정
   */
  setBadge(badge) {
    this.setState({ badge });
  }
  
  /**
   * 트렌드 설정
   */
  setTrend(trend) {
    this.setState({ trend });
  }
  
  /**
   * 현재 사용자 설정
   */
  setCurrentUser(isCurrentUser) {
    this.setState({ isCurrentUser });
  }
  
  /**
   * 선택 상태 설정
   */
  setSelected(selected) {
    this.setState({ isSelected: selected });
  }
  
  /**
   * 사용자 상세 정보 표시
   */
  showUserDetails() {
    const { rank, title, subtitle, score, avatar, badge, trend, category } = this.state;
    
    this.emit('modal:show', {
      type: 'user-details',
      title: `${title} 상세 정보`,
      content: `
        <div class="user-details-modal">
          <div class="user-header">
            <div class="user-avatar-large">
              ${avatar ? `<img src="${avatar}" alt="${title}">` : `<div class="avatar-placeholder-large">${title.charAt(0)}</div>`}
              ${badge ? `<div class="user-badge-large">${badge}</div>` : ''}
            </div>
            <div class="user-info">
              <h2>${title}</h2>
              ${subtitle ? `<p>${subtitle}</p>` : ''}
            </div>
          </div>
          
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-label">랭킹</span>
              <span class="stat-value">${this.getRankText(rank)}</span>
              ${trend !== 'stable' ? `<span class="trend-indicator ${trend}">${this.getTrendIcon(trend)}</span>` : ''}
            </div>
            <div class="stat-item">
              <span class="stat-label">점수</span>
              <span class="stat-value">${this.formatScore(score)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">카테고리</span>
              <span class="stat-value">${this.getCategoryText(category)}</span>
            </div>
          </div>
        </div>
      `,
      buttons: [
        { text: '닫기', type: 'primary', action: 'close' }
      ]
    });
  }
  
  /**
   * 카테고리 텍스트 가져오기
   */
  getCategoryText(category) {
    const categoryMap = {
      overall: '전체',
      grammar: '문법',
      sentence: '문장분석',
      passage: '지문설명',
      weekly: '주간',
      monthly: '월간'
    };
    
    return categoryMap[category] || '전체';
  }
  
  /**
   * 랭크 데이터 가져오기
   */
  getRankData() {
    return {
      rank: this.state.rank,
      title: this.state.title,
      subtitle: this.state.subtitle,
      score: this.state.score,
      avatar: this.state.avatar,
      badge: this.state.badge,
      trend: this.state.trend,
      isCurrentUser: this.state.isCurrentUser,
      category: this.category
    };
  }
  
  /**
   * 랭크 데이터 설정
   */
  setRankData(data) {
    this.setState({
      rank: data.rank || this.state.rank,
      title: data.title || this.state.title,
      subtitle: data.subtitle || this.state.subtitle,
      score: data.score !== undefined ? data.score : this.state.score,
      avatar: data.avatar || this.state.avatar,
      badge: data.badge || this.state.badge,
      trend: data.trend || this.state.trend,
      isCurrentUser: data.isCurrentUser !== undefined ? data.isCurrentUser : this.state.isCurrentUser,
      category: data.category || this.category
    });
  }
}

// 랭크 칩 팩토리
export class RankChipFactory {
  static create(data = {}) {
    return new RankChip(data);
  }
  
  static createTopRank(rank, data = {}) {
    return new RankChip({
      rank,
      ...data
    });
  }
  
  static createCurrentUser(data = {}) {
    return new RankChip({
      isCurrentUser: true,
      ...data
    });
  }
}

// 랭크 칩 매니저
export class RankChipManager {
  static chips = new Map();
  
  static register(id, chip) {
    this.chips.set(id, chip);
  }
  
  static get(id) {
    return this.chips.get(id);
  }
  
  static getAll() {
    return Array.from(this.chips.values());
  }
  
  static getByCategory(category) {
    return this.getAll().filter(chip => chip.category === category);
  }
  
  static getTopRanks(limit = 10) {
    return this.getAll()
      .sort((a, b) => a.state.rank - b.state.rank)
      .slice(0, limit);
  }
  
  static getCurrentUser() {
    return this.getAll().find(chip => chip.state.isCurrentUser);
  }
  
  static cleanup() {
    this.chips.clear();
  }
}
