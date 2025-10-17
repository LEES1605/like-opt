/**
 * RankCollection - 여러 등급 칩을 관리하는 컨테이너 컴포넌트
 * 학생들의 등급을 한 번에 표시하고 관리
 */
export class RankCollection {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      showDescriptions: true,
      showProgress: true,
      clickable: true,
      maxDisplay: 7, // 최대 표시할 등급 수
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
    
    this.ranks = []; // 등급 데이터 배열
    this.currentIndex = 0;
    
    this.init();
  }
  
  /**
   * 등급 컬렉션 초기화
   */
  init() {
    this.render();
    this.setupEventListeners();
  }
  
  /**
   * 등급 데이터 설정
   */
  setRanks(ranksData) {
    this.ranks = ranksData.map(rank => ({
      id: rank.id || Math.random().toString(36).substr(2, 9),
      name: rank.name || '익명',
      rank: rank.rank || 'sprout',
      progress: rank.progress || 0,
      totalQuestions: rank.totalQuestions || 0,
      ...rank
    }));
    
    this.render();
  }
  
  /**
   * 등급 컬렉션 HTML 렌더링
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with id '${this.containerId}' not found`);
      return;
    }
    
    if (this.ranks.length === 0) {
      container.innerHTML = `
        <div class="rank-collection-empty">
          <div class="empty-icon">🏆</div>
          <p>아직 등급 데이터가 없습니다.</p>
        </div>
      `;
      return;
    }
    
    const displayRanks = this.ranks.slice(0, this.options.maxDisplay);
    
    container.innerHTML = `
      <div class="rank-collection-header">
        <h3 class="collection-title">학생 등급 현황</h3>
        <div class="collection-stats">
          <span class="total-count">총 ${this.ranks.length}명</span>
          ${this.ranks.length > this.options.maxDisplay ? 
            `<span class="show-more">+${this.ranks.length - this.options.maxDisplay}명 더</span>` : ''}
        </div>
      </div>
      
      <div class="rank-collection-grid">
        ${displayRanks.map(rank => this.renderRankItem(rank)).join('')}
      </div>
      
      ${this.options.showDescriptions ? this.renderRankLegend() : ''}
    `;
  }
  
  /**
   * 개별 등급 아이템 렌더링
   */
  renderRankItem(rankData) {
    const rankInfo = this.rankLevels[rankData.rank] || this.rankLevels.sprout;
    const clickableClass = this.options.clickable ? 'rank-item-clickable' : '';
    
    return `
      <div class="rank-item ${clickableClass}" 
           data-rank-id="${rankData.id}" 
           data-rank="${rankData.rank}">
        
        <div class="rank-item-header">
          <div class="rank-chip rank-chip-small" data-rank="${rankData.rank}">
            <div class="rank-chip-icon">
              <span class="rank-icon">${rankInfo.icon}</span>
            </div>
            <div class="rank-chip-glow"></div>
          </div>
          
          <div class="rank-item-info">
            <h4 class="student-name">${rankData.name}</h4>
            <span class="rank-name">${rankInfo.name}</span>
            <span class="rank-level">Lv.${rankInfo.level}</span>
          </div>
        </div>
        
        ${this.options.showProgress ? `
          <div class="rank-item-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${rankData.progress}%"></div>
            </div>
            <div class="progress-info">
              <span class="progress-text">${Math.round(rankData.progress)}%</span>
              <span class="question-count">${rankData.totalQuestions}개 질문</span>
            </div>
          </div>
        ` : ''}
        
        ${this.options.showDescriptions ? `
          <div class="rank-description">
            <span class="description-text">${rankInfo.description}</span>
          </div>
        ` : ''}
        
        <div class="rank-item-glow"></div>
      </div>
    `;
  }
  
  /**
   * 등급 범례 렌더링
   */
  renderRankLegend() {
    return `
      <div class="rank-legend">
        <h4>등급 설명</h4>
        <div class="legend-items">
          ${Object.entries(this.rankLevels).map(([key, rank]) => `
            <div class="legend-item">
              <div class="legend-icon">${rank.icon}</div>
              <div class="legend-info">
                <span class="legend-name">${rank.name}</span>
                <span class="legend-description">${rank.description}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    if (!this.options.clickable) return;
    
    const rankItems = document.querySelectorAll('.rank-item-clickable');
    rankItems.forEach(item => {
      item.addEventListener('click', (event) => {
        this.handleRankClick(event, item);
      });
      
      // 호버 효과
      item.addEventListener('mouseenter', () => {
        item.classList.add('rank-item-hover');
      });
      
      item.addEventListener('mouseleave', () => {
        item.classList.remove('rank-item-hover');
      });
    });
  }
  
  /**
   * 등급 클릭 핸들러
   */
  handleRankClick(event, item) {
    const rankId = item.getAttribute('data-rank-id');
    const rankData = this.ranks.find(rank => rank.id === rankId);
    
    if (rankData) {
      const rankInfo = this.rankLevels[rankData.rank];
      
      // 클릭 이벤트 발생
      const clickEvent = new CustomEvent('rankItemClick', {
        detail: {
          rankId,
          studentName: rankData.name,
          rank: rankData.rank,
          rankName: rankInfo.name,
          level: rankInfo.level,
          progress: rankData.progress,
          totalQuestions: rankData.totalQuestions
        }
      });
      
      document.dispatchEvent(clickEvent);
      
      // 상세 정보 표시
      this.showRankDetails(rankData, rankInfo);
    }
  }
  
  /**
   * 등급 상세 정보 표시
   */
  showRankDetails(rankData, rankInfo) {
    console.group('🏆 학생 등급 정보');
    console.log('학생 이름:', rankData.name);
    console.log('현재 등급:', rankInfo.name, `(Lv.${rankInfo.level})`);
    console.log('아이콘:', rankInfo.icon);
    console.log('진행률:', `${Math.round(rankData.progress)}%`);
    console.log('총 질문 수:', rankData.totalQuestions);
    console.log('설명:', rankInfo.description);
    console.groupEnd();
    
    // 상세 정보 이벤트 발생
    const detailEvent = new CustomEvent('rankDetailsRequested', {
      detail: {
        student: rankData,
        rankInfo,
        nextRank: this.getNextRank(rankData.rank)
      }
    });
    
    document.dispatchEvent(detailEvent);
  }
  
  /**
   * 다음 등급 정보 가져오기
   */
  getNextRank(currentRank) {
    const currentLevel = this.rankLevels[currentRank]?.level || 1;
    const nextRank = Object.keys(this.rankLevels).find(
      rank => this.rankLevels[rank].level === currentLevel + 1
    );
    
    return nextRank ? this.rankLevels[nextRank] : null;
  }
  
  /**
   * 등급 업데이트
   */
  updateRank(rankId, newRank, newProgress = 0) {
    const rankIndex = this.ranks.findIndex(rank => rank.id === rankId);
    if (rankIndex !== -1) {
      this.ranks[rankIndex].rank = newRank;
      this.ranks[rankIndex].progress = newProgress;
      
      this.render();
      this.setupEventListeners();
      
      // 업데이트 이벤트 발생
      const updateEvent = new CustomEvent('rankUpdated', {
        detail: {
          rankId,
          newRank,
          newProgress,
          student: this.ranks[rankIndex]
        }
      });
      
      document.dispatchEvent(updateEvent);
    }
  }
  
  /**
   * 새로운 학생 추가
   */
  addStudent(studentData) {
    const newStudent = {
      id: Math.random().toString(36).substr(2, 9),
      rank: 'sprout',
      progress: 0,
      totalQuestions: 0,
      ...studentData
    };
    
    this.ranks.push(newStudent);
    this.render();
    this.setupEventListeners();
    
    return newStudent;
  }
  
  /**
   * 학생 제거
   */
  removeStudent(rankId) {
    this.ranks = this.ranks.filter(rank => rank.id !== rankId);
    this.render();
    this.setupEventListeners();
  }
  
  /**
   * 등급별 통계 가져오기
   */
  getRankStatistics() {
    const stats = {};
    
    Object.keys(this.rankLevels).forEach(rank => {
      stats[rank] = {
        count: 0,
        students: []
      };
    });
    
    this.ranks.forEach(student => {
      stats[student.rank].count++;
      stats[student.rank].students.push(student);
    });
    
    return stats;
  }
  
  /**
   * 컬렉션 정리
   */
  destroy() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
    }
  }
}
