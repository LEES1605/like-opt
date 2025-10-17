/**
 * RankChip - 재사용 가능한 등급 칩 컴포넌트
 * 브론즈부터 챌린지까지 7단계 등급 시스템
 */
export class RankChip {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      size: 'medium', // 'small', 'medium', 'large'
      showText: false, // 텍스트 표시 여부
      showProgress: false, // 진행률 표시 여부
      clickable: true, // 클릭 가능 여부
      ...options
    };
    
    this.rankLevels = {
      sprout: { level: 1, icon: '🌱', name: '새싹', color: '#90EE90', description: '처음 시작하는 단계' },
      leaf: { level: 2, icon: '🌿', name: '잎사귀', color: '#32CD32', description: '조금씩 자라는 단계' },
      tree: { level: 3, icon: '🌳', name: '나무', color: '#8B4513', description: '잘 자란 단계' },
      butterfly: { level: 4, icon: '🦋', name: '나비', color: 'linear-gradient(45deg, #FF69B4, #FF1493, #FF6347)', description: '변화하는 단계' },
      eagle: { level: 5, icon: '🦅', name: '독수리', color: '#4169E1', description: '높이 날아오르는 단계' },
      star: { level: 6, icon: '⭐', name: '별', color: '#FFD700', description: '빛나는 단계' },
      rocket: { level: 7, icon: '🚀', name: '로켓', color: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)', description: '최고 높이로 날아가는 단계' }
    };
    
    this.currentRank = 'sprout';
    this.progress = 0; // 0-100
    
    this.init();
  }
  
  /**
   * 등급 칩 초기화
   */
  init() {
    this.render();
    this.setupEventListeners();
  }
  
  /**
   * 등급 칩 HTML 렌더링
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with id '${this.containerId}' not found`);
      return;
    }
    
    const rankInfo = this.rankLevels[this.currentRank];
    const sizeClass = `rank-chip-${this.options.size}`;
    const clickableClass = this.options.clickable ? 'rank-chip-clickable' : '';
    
    container.innerHTML = `
      <div class="rank-chip ${sizeClass} ${clickableClass}" 
           data-rank="${this.currentRank}" 
           data-level="${rankInfo.level}">
        
        <div class="rank-chip-icon" 
             style="background: ${rankInfo.color.includes('gradient') ? rankInfo.color : `linear-gradient(135deg, ${rankInfo.color}, ${this.adjustColor(rankInfo.color, 20)}`}">
          <span class="rank-icon">${rankInfo.icon}</span>
        </div>
        
        ${this.options.showText ? `
          <div class="rank-chip-text">
            <span class="rank-name">${rankInfo.name}</span>
            <span class="rank-level">Lv.${rankInfo.level}</span>
          </div>
        ` : ''}
        
        ${this.options.showProgress ? `
          <div class="rank-chip-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${this.progress}%"></div>
            </div>
            <span class="progress-text">${this.progress}%</span>
          </div>
        ` : ''}
        
        <div class="rank-chip-glow" style="background: ${rankInfo.color}"></div>
      </div>
    `;
  }
  
  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    const chip = document.querySelector('.rank-chip');
    if (!chip || !this.options.clickable) return;
    
    chip.addEventListener('click', () => {
      this.handleClick();
    });
    
    // 호버 효과
    chip.addEventListener('mouseenter', () => {
      chip.classList.add('rank-chip-hover');
    });
    
    chip.addEventListener('mouseleave', () => {
      chip.classList.remove('rank-chip-hover');
    });
  }
  
  /**
   * 등급 설정
   */
  setRank(rank, progress = 0) {
    if (!this.rankLevels[rank]) {
      console.error(`Invalid rank: ${rank}`);
      return;
    }
    
    this.currentRank = rank;
    this.progress = Math.max(0, Math.min(100, progress));
    this.render();
    this.setupEventListeners();
    
    // 등급 변경 이벤트 발생
    this.emitRankChange(rank, progress);
  }
  
  /**
   * 다음 등급까지의 진행률 설정
   */
  setProgress(progress) {
    this.progress = Math.max(0, Math.min(100, progress));
    
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (progressFill) {
      progressFill.style.width = `${this.progress}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${Math.round(this.progress)}%`;
    }
  }
  
  /**
   * 등급 업그레이드
   */
  upgrade() {
    const currentLevel = this.rankLevels[this.currentRank].level;
    const nextRank = Object.keys(this.rankLevels).find(
      rank => this.rankLevels[rank].level === currentLevel + 1
    );
    
    if (nextRank) {
      this.setRank(nextRank, 0);
      this.showUpgradeAnimation();
      return true;
    }
    
    return false;
  }
  
  /**
   * 업그레이드 애니메이션
   */
  showUpgradeAnimation() {
    const chip = document.querySelector('.rank-chip');
    if (!chip) return;
    
    chip.classList.add('rank-chip-upgrade');
    
    setTimeout(() => {
      chip.classList.remove('rank-chip-upgrade');
    }, 2000);
  }
  
  /**
   * 칩 클릭 핸들러
   */
  handleClick() {
    const rankInfo = this.rankLevels[this.currentRank];
    
    // 클릭 이벤트 발생
    const event = new CustomEvent('rankChipClick', {
      detail: {
        rank: this.currentRank,
        level: rankInfo.level,
        name: rankInfo.name,
        progress: this.progress
      }
    });
    
    document.dispatchEvent(event);
    
    // 상세 정보 표시
    this.showRankDetails();
  }
  
  /**
   * 등급 상세 정보 표시
   */
  showRankDetails() {
    const rankInfo = this.rankLevels[this.currentRank];
    const nextRank = this.getNextRank();
    
    const details = {
      current: {
        rank: this.currentRank,
        level: rankInfo.level,
        name: rankInfo.name,
        icon: rankInfo.icon
      },
      next: nextRank,
      progress: this.progress
    };
    
    // 콘솔에 상세 정보 출력
    console.group('🏆 등급 정보');
    console.log('현재 등급:', details.current);
    console.log('다음 등급:', details.next);
    console.log('진행률:', `${details.progress}%`);
    console.groupEnd();
    
    // 상세 정보 이벤트 발생
    const event = new CustomEvent('rankDetailsRequested', {
      detail: details
    });
    document.dispatchEvent(event);
  }
  
  /**
   * 다음 등급 정보 가져오기
   */
  getNextRank() {
    const currentLevel = this.rankLevels[this.currentRank].level;
    const nextRank = Object.keys(this.rankLevels).find(
      rank => this.rankLevels[rank].level === currentLevel + 1
    );
    
    return nextRank ? this.rankLevels[nextRank] : null;
  }
  
  /**
   * 등급 변경 이벤트 발생
   */
  emitRankChange(rank, progress) {
    const event = new CustomEvent('rankChange', {
      detail: {
        rank,
        level: this.rankLevels[rank].level,
        name: this.rankLevels[rank].name,
        progress,
        timestamp: new Date()
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * 색상 조정 (밝기 변경)
   */
  adjustColor(color, amount) {
    // 간단한 색상 밝기 조정
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  /**
   * 현재 등급 정보 가져오기
   */
  getCurrentRank() {
    return {
      rank: this.currentRank,
      level: this.rankLevels[this.currentRank].level,
      name: this.rankLevels[this.currentRank].name,
      icon: this.rankLevels[this.currentRank].icon,
      progress: this.progress
    };
  }
  
  /**
   * 모든 등급 정보 가져오기
   */
  getAllRanks() {
    return { ...this.rankLevels };
  }
  
  /**
   * 컴포넌트 정리
   */
  destroy() {
    const chip = document.querySelector('.rank-chip');
    if (chip) {
      chip.remove();
    }
  }
}
