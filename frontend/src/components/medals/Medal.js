/**
 * Medal - 재사용 가능한 메달 컴포넌트
 * 개별 메달 4개 + 마스터 메달 시스템
 */
export class Medal {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      size: 'medium', // 'small', 'medium', 'large'
      showText: true, // 텍스트 표시 여부
      showProgress: true, // 진행률 표시 여부
      clickable: true, // 클릭 가능 여부
      animated: true, // 애니메이션 활성화
      ...options
    };
    
    this.medalTypes = {
      bronze: { 
        level: 1, 
        icon: '🥉', 
        name: '브론즈', 
        color: 'linear-gradient(135deg, #CD7F32, #8B4513)',
        description: '첫 번째 메달'
      },
      silver: { 
        level: 2, 
        icon: '🥈', 
        name: '실버', 
        color: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
        description: '두 번째 메달'
      },
      gold: { 
        level: 3, 
        icon: '🥇', 
        name: '골드', 
        color: 'linear-gradient(135deg, #FFD700, #FFA500)',
        description: '세 번째 메달'
      },
      platinum: { 
        level: 4, 
        icon: '💎', 
        name: '플래티넘', 
        color: 'linear-gradient(135deg, #E5E4E2, #9370DB)',
        description: '네 번째 메달'
      },
      master: { 
        level: 5, 
        icon: '🏆', 
        name: '마스터', 
        color: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)',
        description: '모든 메달을 모았습니다!'
      }
    };
    
    this.currentMedal = 'bronze';
    this.medalCount = 0; // 0-4 (개별 메달), 5 (마스터)
    this.progress = 0; // 0-100
    
    this.init();
  }
  
  /**
   * 메달 초기화
   */
  init() {
    this.render();
    this.setupEventListeners();
  }
  
  /**
   * 메달 HTML 렌더링
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with id '${this.containerId}' not found`);
      return;
    }
    
    const medalInfo = this.getMedalInfo();
    const sizeClass = `medal-${this.options.size}`;
    const clickableClass = this.options.clickable ? 'medal-clickable' : '';
    const animatedClass = this.options.animated ? 'medal-animated' : '';
    
    container.innerHTML = `
      <div class="medal-container ${sizeClass} ${clickableClass} ${animatedClass}" 
           data-medal="${this.currentMedal}" 
           data-count="${this.medalCount}">
        
        <div class="medal-icon" style="background: ${medalInfo.color}">
          <span class="medal-symbol">${medalInfo.icon}</span>
          ${this.medalCount < 5 ? `
            <span class="medal-number">${this.medalCount}</span>
          ` : ''}
        </div>
        
        ${this.options.showText ? `
          <div class="medal-text">
            <span class="medal-name">${medalInfo.name}</span>
            <span class="medal-description">${medalInfo.description}</span>
          </div>
        ` : ''}
        
        ${this.options.showProgress && this.medalCount < 5 ? `
          <div class="medal-progress">
            <div class="progress-ring">
              <svg class="progress-svg" viewBox="0 0 36 36">
                <path class="progress-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                <path class="progress-fill" 
                      stroke-dasharray="${this.progress}, 100" 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
              </svg>
              <span class="progress-text">${Math.round(this.progress)}%</span>
            </div>
          </div>
        ` : ''}
        
        <div class="medal-glow" style="background: ${medalInfo.color}"></div>
        <div class="medal-sparkles"></div>
      </div>
    `;
  }
  
  /**
   * 현재 메달 정보 가져오기
   */
  getMedalInfo() {
    if (this.medalCount >= 5) {
      return this.medalTypes.master;
    }
    
    const medalKeys = ['bronze', 'silver', 'gold', 'platinum'];
    const medalIndex = Math.min(this.medalCount, 3);
    const medalKey = medalKeys[medalIndex];
    
    return this.medalTypes[medalKey];
  }
  
  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    const medal = document.querySelector('.medal-container');
    if (!medal || !this.options.clickable) return;
    
    medal.addEventListener('click', () => {
      this.handleClick();
    });
    
    // 호버 효과
    medal.addEventListener('mouseenter', () => {
      medal.classList.add('medal-hover');
    });
    
    medal.addEventListener('mouseleave', () => {
      medal.classList.remove('medal-hover');
    });
  }
  
  /**
   * 메달 개수 설정
   */
  setMedalCount(count, progress = 0) {
    this.medalCount = Math.max(0, Math.min(5, count));
    this.progress = Math.max(0, Math.min(100, progress));
    
    // 메달 타입 결정
    if (this.medalCount >= 5) {
      this.currentMedal = 'master';
    } else {
      const medalKeys = ['bronze', 'silver', 'gold', 'platinum'];
      this.currentMedal = medalKeys[Math.min(this.medalCount, 3)];
    }
    
    this.render();
    this.setupEventListeners();
    
    // 메달 변경 이벤트 발생
    this.emitMedalChange(this.medalCount, this.progress);
  }
  
  /**
   * 메달 추가
   */
  addMedal() {
    if (this.medalCount < 5) {
      const newCount = Math.min(5, this.medalCount + 1);
      this.setMedalCount(newCount, 0);
      
      if (newCount === 5) {
        this.showMasterMedalAnimation();
      } else {
        this.showMedalEarnedAnimation();
      }
      
      return true;
    }
    return false;
  }
  
  /**
   * 진행률 설정
   */
  setProgress(progress) {
    this.progress = Math.max(0, Math.min(100, progress));
    
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (progressFill) {
      progressFill.setAttribute('stroke-dasharray', `${this.progress}, 100`);
    }
    
    if (progressText) {
      progressText.textContent = `${Math.round(this.progress)}%`;
    }
  }
  
  /**
   * 메달 획득 애니메이션
   */
  showMedalEarnedAnimation() {
    const medal = document.querySelector('.medal-container');
    if (medal) {
      medal.classList.add('medal-earned');
      
      setTimeout(() => {
        medal.classList.remove('medal-earned');
      }, 1500);
    }
  }
  
  /**
   * 마스터 메달 획득 애니메이션
   */
  showMasterMedalAnimation() {
    const medal = document.querySelector('.medal-container');
    if (medal) {
      medal.classList.add('medal-master-earned');
      
      setTimeout(() => {
        medal.classList.remove('medal-master-earned');
      }, 3000);
    }
  }
  
  /**
   * 메달 클릭 핸들러
   */
  handleClick() {
    const medalInfo = this.getMedalInfo();
    
    // 클릭 이벤트 발생
    const event = new CustomEvent('medalClick', {
      detail: {
        medal: this.currentMedal,
        count: this.medalCount,
        name: medalInfo.name,
        progress: this.progress,
        isMaster: this.medalCount >= 5
      }
    });
    
    document.dispatchEvent(event);
    
    // 상세 정보 표시
    this.showMedalDetails();
  }
  
  /**
   * 메달 상세 정보 표시
   */
  showMedalDetails() {
    const medalInfo = this.getMedalInfo();
    
    console.group('🏅 메달 정보');
    console.log('현재 메달:', medalInfo.name);
    console.log('메달 개수:', this.medalCount);
    console.log('아이콘:', medalInfo.icon);
    console.log('색상:', medalInfo.color);
    console.log('설명:', medalInfo.description);
    console.log('진행률:', `${Math.round(this.progress)}%`);
    console.log('마스터 여부:', this.medalCount >= 5);
    console.groupEnd();
    
    // 상세 정보 이벤트 발생
    const event = new CustomEvent('medalDetailsRequested', {
      detail: {
        medal: this.currentMedal,
        count: this.medalCount,
        medalInfo,
        progress: this.progress,
        nextMedal: this.getNextMedal()
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * 다음 메달 정보 가져오기
   */
  getNextMedal() {
    if (this.medalCount >= 5) {
      return null; // 이미 마스터
    }
    
    const nextCount = this.medalCount + 1;
    const medalKeys = ['bronze', 'silver', 'gold', 'platinum'];
    
    if (nextCount >= 5) {
      return this.medalTypes.master;
    }
    
    return this.medalTypes[medalKeys[Math.min(nextCount, 3)]];
  }
  
  /**
   * 메달 변경 이벤트 발생
   */
  emitMedalChange(count, progress) {
    const event = new CustomEvent('medalChange', {
      detail: {
        medal: this.currentMedal,
        count,
        progress,
        isMaster: count >= 5,
        timestamp: new Date()
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * 현재 메달 정보 가져오기
   */
  getCurrentMedal() {
    return {
      medal: this.currentMedal,
      count: this.medalCount,
      progress: this.progress,
      isMaster: this.medalCount >= 5,
      medalInfo: this.getMedalInfo()
    };
  }
  
  /**
   * 모든 메달 타입 가져오기
   */
  getAllMedalTypes() {
    return { ...this.medalTypes };
  }
  
  /**
   * 컴포넌트 정리
   */
  destroy() {
    const medal = document.querySelector('.medal-container');
    if (medal) {
      medal.remove();
    }
  }
}
