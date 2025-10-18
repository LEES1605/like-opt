/**
 * 메달 컴포넌트
 * Like-Opt 프론트엔드 메달 표시 컴포넌트
 */

import { BaseComponent } from '../base/BaseComponent.js';

/**
 * 메달 컴포넌트 클래스
 */
export class Medal extends BaseComponent {
  constructor(options = {}) {
    super({
      className: 'medal-component',
      ...options
    });
    
    this.medalType = options.medalType || 'bronze';
    this.title = options.title || '';
    this.description = options.description || '';
    this.icon = options.icon || '🏆';
    this.earned = options.earned || false;
    this.progress = options.progress || 0;
    this.maxProgress = options.maxProgress || 100;
    this.rarity = options.rarity || 'common';
    this.category = options.category || 'general';
  }
  
  /**
   * 상태 설정
   */
  setupState() {
    this.state = {
      medalType: this.medalType,
      title: this.title,
      description: this.description,
      icon: this.icon,
      earned: this.earned,
      progress: this.progress,
      maxProgress: this.maxProgress,
      rarity: this.rarity,
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
    const { medalType, title, description, icon, earned, progress, maxProgress, rarity, isHovered, isSelected } = this.state;
    
    const progressPercent = Math.min((progress / maxProgress) * 100, 100);
    const isCompleted = progress >= maxProgress;
    
    return `
      <div class="medal ${medalType} ${rarity} ${earned ? 'earned' : 'locked'} ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}" 
           data-medal-type="${medalType}" 
           data-rarity="${rarity}"
           data-category="${this.category}">
        
        <!-- 메달 아이콘 -->
        <div class="medal-icon">
          <div class="medal-icon-inner">
            ${icon}
          </div>
          ${!earned ? '<div class="medal-lock">🔒</div>' : ''}
        </div>
        
        <!-- 메달 정보 -->
        <div class="medal-info">
          <h3 class="medal-title">${title}</h3>
          <p class="medal-description">${description}</p>
          
          <!-- 진행률 표시 -->
          ${!earned ? `
            <div class="medal-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
              </div>
              <span class="progress-text">${progress}/${maxProgress}</span>
            </div>
          ` : ''}
          
          <!-- 획득 상태 -->
          ${earned ? `
            <div class="medal-earned">
              <span class="earned-badge">획득됨</span>
              <span class="earned-date">${this.formatDate(new Date())}</span>
            </div>
          ` : ''}
        </div>
        
        <!-- 희귀도 표시 -->
        <div class="medal-rarity ${rarity}">
          <span class="rarity-text">${this.getRarityText(rarity)}</span>
        </div>
      </div>
    `;
  }
  
  /**
   * 클릭 이벤트 처리
   */
  handleClick(event) {
    event.preventDefault();
    
    if (!this.state.earned) {
      this.showProgressModal();
    } else {
      this.showMedalDetails();
    }
    
    this.emit('medal:click', {
      medalType: this.state.medalType,
      earned: this.state.earned,
      progress: this.state.progress
    });
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
   * 메달 타입 설정
   */
  setMedalType(type) {
    this.setState({ medalType: type });
  }
  
  /**
   * 제목 설정
   */
  setTitle(title) {
    this.setState({ title });
  }
  
  /**
   * 설명 설정
   */
  setDescription(description) {
    this.setState({ description });
  }
  
  /**
   * 아이콘 설정
   */
  setIcon(icon) {
    this.setState({ icon });
  }
  
  /**
   * 획득 상태 설정
   */
  setEarned(earned) {
    this.setState({ earned });
  }
  
  /**
   * 진행률 설정
   */
  setProgress(progress, maxProgress = null) {
    this.setState({ 
      progress,
      ...(maxProgress && { maxProgress })
    });
  }
  
  /**
   * 희귀도 설정
   */
  setRarity(rarity) {
    this.setState({ rarity });
  }
  
  /**
   * 선택 상태 설정
   */
  setSelected(selected) {
    this.setState({ isSelected: selected });
  }
  
  /**
   * 진행률 모달 표시
   */
  showProgressModal() {
    const { title, description, progress, maxProgress } = this.state;
    
    this.emit('modal:show', {
      type: 'progress',
      title: `${title} 진행률`,
      content: `
        <div class="medal-progress-modal">
          <p>${description}</p>
          <div class="progress-details">
            <div class="progress-bar large">
              <div class="progress-fill" style="width: ${(progress / maxProgress) * 100}%"></div>
            </div>
            <p class="progress-text">${progress}/${maxProgress} 완료</p>
          </div>
        </div>
      `,
      buttons: [
        { text: '닫기', type: 'primary', action: 'close' }
      ]
    });
  }
  
  /**
   * 메달 상세 정보 표시
   */
  showMedalDetails() {
    const { title, description, icon, rarity, category } = this.state;
    
    this.emit('modal:show', {
      type: 'details',
      title: `${title} 상세 정보`,
      content: `
        <div class="medal-details-modal">
          <div class="medal-icon-large">${icon}</div>
          <h3>${title}</h3>
          <p>${description}</p>
          <div class="medal-meta">
            <span class="rarity-badge ${rarity}">${this.getRarityText(rarity)}</span>
            <span class="category-badge">${this.getCategoryText(category)}</span>
          </div>
        </div>
      `,
      buttons: [
        { text: '닫기', type: 'primary', action: 'close' }
      ]
    });
  }
  
  /**
   * 희귀도 텍스트 가져오기
   */
  getRarityText(rarity) {
    const rarityMap = {
      common: '일반',
      uncommon: '언커먼',
      rare: '레어',
      epic: '에픽',
      legendary: '레전더리'
    };
    
    return rarityMap[rarity] || '일반';
  }
  
  /**
   * 카테고리 텍스트 가져오기
   */
  getCategoryText(category) {
    const categoryMap = {
      general: '일반',
      grammar: '문법',
      sentence: '문장분석',
      passage: '지문설명',
      achievement: '업적',
      milestone: '마일스톤'
    };
    
    return categoryMap[category] || '일반';
  }
  
  /**
   * 날짜 포맷팅
   */
  formatDate(date) {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  /**
   * 메달 데이터 가져오기
   */
  getMedalData() {
    return {
      medalType: this.state.medalType,
      title: this.state.title,
      description: this.state.description,
      icon: this.state.icon,
      earned: this.state.earned,
      progress: this.state.progress,
      maxProgress: this.state.maxProgress,
      rarity: this.state.rarity,
      category: this.category
    };
  }
  
  /**
   * 메달 데이터 설정
   */
  setMedalData(data) {
    this.setState({
      medalType: data.medalType || this.state.medalType,
      title: data.title || this.state.title,
      description: data.description || this.state.description,
      icon: data.icon || this.state.icon,
      earned: data.earned !== undefined ? data.earned : this.state.earned,
      progress: data.progress !== undefined ? data.progress : this.state.progress,
      maxProgress: data.maxProgress || this.state.maxProgress,
      rarity: data.rarity || this.state.rarity,
      category: data.category || this.category
    });
  }
}

// 메달 팩토리
export class MedalFactory {
  static create(type, data = {}) {
    const medalTypes = {
      bronze: { medalType: 'bronze', icon: '🥉', rarity: 'common' },
      silver: { medalType: 'silver', icon: '🥈', rarity: 'uncommon' },
      gold: { medalType: 'gold', icon: '🥇', rarity: 'rare' },
      platinum: { medalType: 'platinum', icon: '💎', rarity: 'epic' },
      diamond: { medalType: 'diamond', icon: '💠', rarity: 'legendary' }
    };
    
    const medalData = { ...medalTypes[type], ...data };
    return new Medal(medalData);
  }
  
  static createBronze(data = {}) {
    return this.create('bronze', data);
  }
  
  static createSilver(data = {}) {
    return this.create('silver', data);
  }
  
  static createGold(data = {}) {
    return this.create('gold', data);
  }
  
  static createPlatinum(data = {}) {
    return this.create('platinum', data);
  }
  
  static createDiamond(data = {}) {
    return this.create('diamond', data);
  }
}

// 메달 매니저
export class MedalManager {
  static medals = new Map();
  
  static register(id, medal) {
    this.medals.set(id, medal);
  }
  
  static get(id) {
    return this.medals.get(id);
  }
  
  static getAll() {
    return Array.from(this.medals.values());
  }
  
  static getByCategory(category) {
    return this.getAll().filter(medal => medal.category === category);
  }
  
  static getByRarity(rarity) {
    return this.getAll().filter(medal => medal.state.rarity === rarity);
  }
  
  static getEarned() {
    return this.getAll().filter(medal => medal.state.earned);
  }
  
  static getLocked() {
    return this.getAll().filter(medal => !medal.state.earned);
  }
  
  static cleanup() {
    this.medals.clear();
  }
}
