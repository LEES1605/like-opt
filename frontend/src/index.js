/**
 * MAIC Flask Optimized - 간단한 데모 애플리케이션
 */

// 스타일 임포트
import './styles/index.css';

/**
 * 간단한 데모 앱
 */
class SimpleDemoApp {
  constructor() {
    this.init();
  }
  
  async init() {
    try {
      console.log('🚀 MAIC Flask Optimized 간단 데모 시작...');
      
      // DOM이 준비될 때까지 대기
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.createDemo());
      } else {
        this.createDemo();
      }
      
    } catch (error) {
      console.error('❌ 데모 초기화 실패:', error);
      this.showError('데모를 초기화하는 중 오류가 발생했습니다.');
    }
  }
  
  createDemo() {
    console.log('📝 데모 컴포넌트 생성 중...');
    
    // 로딩 숨기기
    this.hideLoading();
    
    // 앱 표시
    const app = document.getElementById('app');
    if (app) {
      app.style.display = 'block';
    }
    
    // 간단한 버튼들 생성
    this.createSimpleButtons();
    
    // 간단한 토글들 생성
    this.createSimpleToggles();
    
    // 등급 칩 데모 생성
    this.createRankDemo();
    
    // 메달 시스템 데모 생성
    this.createMedalDemo();
    
    // 상태 업데이트
    this.updateStatus();
    
    console.log('✅ 데모 컴포넌트 생성 완료');
  }
  
  createSimpleButtons() {
    const buttonDemo = document.getElementById('button-demo');
    if (!buttonDemo) return;
    
    // 기본 버튼들
    const primaryBtn = this.createButton('Primary Button', 'primary', () => {
      alert('Primary Button 클릭됨!');
    });
    
    const secondaryBtn = this.createButton('Secondary Button', 'secondary', () => {
      alert('Secondary Button 클릭됨!');
    });
    
    buttonDemo.appendChild(primaryBtn);
    buttonDemo.appendChild(secondaryBtn);
    
    // 상태 버튼들
    const buttonStateDemo = document.getElementById('button-state-demo');
    if (buttonStateDemo) {
      const disabledBtn = this.createButton('Disabled Button', 'primary', null, true);
      const loadingBtn = this.createButton('Loading...', 'primary', null, false, true);
      
      buttonStateDemo.appendChild(disabledBtn);
      buttonStateDemo.appendChild(loadingBtn);
    }
  }
  
  createSimpleToggles() {
    const professorGToggle = document.getElementById('professor-g-toggle');
    if (professorGToggle) {
      const profToggle = this.createToggle('Professor G 활성화', true, (checked) => {
        console.log('Professor G:', checked ? '활성화' : '비활성화');
        this.updateStatus();
      });
      professorGToggle.appendChild(profToggle);
    }
    
    const modeToggles = document.getElementById('mode-toggles');
    if (modeToggles) {
      const modes = [
        { label: '문법 학습', key: 'grammar' },
        { label: '문장분석', key: 'sentence' },
        { label: '지문설명', key: 'passage' }
      ];
      
      modes.forEach(mode => {
        const toggle = this.createToggle(mode.label, true, (checked) => {
          console.log(`${mode.key} 모드:`, checked ? '활성화' : '비활성화');
          this.updateStatus();
        });
        modeToggles.appendChild(toggle);
      });
    }
  }
  
  createButton(text, type, onClick, disabled = false, loading = false) {
    const button = document.createElement('button');
    button.className = `btn btn-${type} ${disabled ? 'btn-disabled' : ''} ${loading ? 'btn-loading' : ''}`;
    button.textContent = text;
    button.disabled = disabled || loading;
    
    if (onClick) {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }
  
  createToggle(label, checked, onChange) {
    const container = document.createElement('div');
    container.className = 'toggle-container';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.className = 'toggle-label';
    
    const toggleEl = document.createElement('label');
    toggleEl.className = 'toggle-switch';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    
    const slider = document.createElement('span');
    slider.className = 'toggle-slider';
    
    toggleEl.appendChild(input);
    toggleEl.appendChild(slider);
    
    container.appendChild(labelEl);
    container.appendChild(toggleEl);
    
    if (onChange) {
      input.addEventListener('change', (e) => {
        onChange(e.target.checked);
      });
    }
    
    return container;
  }
  
  createRankDemo() {
    // 등급 칩 데모 섹션 추가
    const main = document.querySelector('.app-main');
    if (!main) return;
    
    // 등급 데모 섹션 HTML 추가
    const rankDemoHTML = `
      <div class="demo-card card">
        <div class="card-header">
          <h4 class="card-title">🏆 등급 시스템 데모</h4>
        </div>
        <div class="card-body">
          <p style="margin-bottom: 1rem; opacity: 0.8;">
            학생들의 질문 활동에 따라 성장하는 등급 시스템입니다.
          </p>
          
          <div style="margin-bottom: 1.5rem;">
            <h5 style="margin-bottom: 1rem;">개별 등급 칩</h5>
            <div id="individual-rank-demo" style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;"></div>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <h5 style="margin-bottom: 1rem;">학생 등급 현황</h5>
            <div id="rank-collection-demo"></div>
          </div>
          
          <div style="text-align: center;">
            <button id="upgrade-demo-btn" class="btn btn-success" style="margin-right: 0.5rem;">등급 업그레이드</button>
            <button id="add-student-btn" class="btn btn-primary" style="margin-right: 0.5rem;">학생 추가</button>
            <button id="random-progress-btn" class="btn btn-warning">진행률 랜덤</button>
          </div>
        </div>
      </div>
    `;
    
    main.insertAdjacentHTML('beforeend', rankDemoHTML);
    
    // 등급 칩 생성
    this.createIndividualRankChips();
    
    // 학생 등급 컬렉션 생성
    this.createStudentRankCollection();
    
    // 이벤트 리스너 설정
    this.setupRankDemoEvents();
  }
  
  createIndividualRankChips() {
    const container = document.getElementById('individual-rank-demo');
    if (!container) return;
    
    const ranks = ['sprout', 'leaf', 'tree', 'butterfly', 'eagle', 'star', 'rocket'];
    
    ranks.forEach(rank => {
      const chip = this.createRankChip(rank, true);
      container.appendChild(chip);
    });
  }
  
  createRankChip(rank, showText = false) {
    const rankLevels = {
      sprout: { level: 1, icon: '🌱', name: '새싹', color: '#90EE90' },
      leaf: { level: 2, icon: '🌿', name: '잎사귀', color: '#32CD32' },
      tree: { level: 3, icon: '🌳', name: '나무', color: '#8B4513' },
      butterfly: { level: 4, icon: '🦋', name: '나비', color: 'linear-gradient(45deg, #FF69B4, #FF1493, #FF6347)' },
      eagle: { level: 5, icon: '🦅', name: '독수리', color: '#4169E1' },
      star: { level: 6, icon: '⭐', name: '별', color: '#FFD700' },
      rocket: { level: 7, icon: '🚀', name: '로켓', color: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)' }
    };
    
    const rankInfo = rankLevels[rank];
    if (!rankInfo) return null;
    
    const chip = document.createElement('div');
    chip.className = 'rank-chip';
    chip.setAttribute('data-rank', rank);
    chip.setAttribute('data-level', rankInfo.level);
    
    chip.innerHTML = `
      <div class="rank-chip-icon">
        <span class="rank-icon">${rankInfo.icon}</span>
      </div>
      ${showText ? `
        <div class="rank-chip-text">
          <span class="rank-name">${rankInfo.name}</span>
          <span class="rank-level">Lv.${rankInfo.level}</span>
        </div>
      ` : ''}
      <div class="rank-chip-glow"></div>
    `;
    
    // 클릭 이벤트
    chip.addEventListener('click', () => {
      console.log(`🏆 ${rankInfo.name} 등급 클릭됨!`);
    });
    
    return chip;
  }
  
  createStudentRankCollection() {
    const container = document.getElementById('rank-collection-demo');
    if (!container) return;
    
    // 샘플 학생 데이터
    const sampleStudents = [
      { name: '김영희', rank: 'sprout', progress: 25, totalQuestions: 5 },
      { name: '이민수', rank: 'leaf', progress: 60, totalQuestions: 12 },
      { name: '박지영', rank: 'tree', progress: 80, totalQuestions: 20 },
      { name: '최동현', rank: 'butterfly', progress: 45, totalQuestions: 18 },
      { name: '정수빈', rank: 'eagle', progress: 90, totalQuestions: 35 }
    ];
    
    // 컬렉션 헤더
    const header = document.createElement('div');
    header.className = 'rank-collection-header';
    header.innerHTML = `
      <h3 class="collection-title">학생 등급 현황</h3>
      <div class="collection-stats">
        <span class="total-count">총 ${sampleStudents.length}명</span>
      </div>
    `;
    container.appendChild(header);
    
    // 등급 그리드
    const grid = document.createElement('div');
    grid.className = 'rank-collection-grid';
    
    sampleStudents.forEach(student => {
      const item = this.createStudentRankItem(student);
      grid.appendChild(item);
    });
    
    container.appendChild(grid);
    
    // 등급 범례
    const legend = this.createRankLegend();
    container.appendChild(legend);
  }
  
  createStudentRankItem(student) {
    const rankLevels = {
      sprout: { level: 1, icon: '🌱', name: '새싹', color: '#90EE90' },
      leaf: { level: 2, icon: '🌿', name: '잎사귀', color: '#32CD32' },
      tree: { level: 3, icon: '🌳', name: '나무', color: '#8B4513' },
      butterfly: { level: 4, icon: '🦋', name: '나비', color: 'linear-gradient(45deg, #FF69B4, #FF1493, #FF6347)' },
      eagle: { level: 5, icon: '🦅', name: '독수리', color: '#4169E1' },
      star: { level: 6, icon: '⭐', name: '별', color: '#FFD700' },
      rocket: { level: 7, icon: '🚀', name: '로켓', color: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)' }
    };
    
    const rankInfo = rankLevels[student.rank];
    
    const item = document.createElement('div');
    item.className = 'rank-item rank-item-clickable';
    item.innerHTML = `
      <div class="rank-item-header">
        <div class="rank-chip rank-chip-small" data-rank="${student.rank}">
          <div class="rank-chip-icon">
            <span class="rank-icon">${rankInfo.icon}</span>
          </div>
          <div class="rank-chip-glow"></div>
        </div>
        
        <div class="rank-item-info">
          <h4 class="student-name">${student.name}</h4>
          <span class="rank-name">${rankInfo.name}</span>
          <span class="rank-level">Lv.${rankInfo.level}</span>
        </div>
      </div>
      
      <div class="rank-item-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${student.progress}%"></div>
        </div>
        <div class="progress-info">
          <span class="progress-text">${Math.round(student.progress)}%</span>
          <span class="question-count">${student.totalQuestions}개 질문</span>
        </div>
      </div>
      
      <div class="rank-description">
        <span class="description-text">${rankInfo.name} - ${this.getRankDescription(student.rank)}</span>
      </div>
      
      <div class="rank-item-glow"></div>
    `;
    
    // 클릭 이벤트
    item.addEventListener('click', () => {
      console.log(`👤 ${student.name} (${rankInfo.name}) 클릭됨!`);
    });
    
    return item;
  }
  
  createRankLegend() {
    const legend = document.createElement('div');
    legend.className = 'rank-legend';
    
    const rankLevels = {
      sprout: { level: 1, icon: '🌱', name: '새싹', description: '처음 시작하는 단계' },
      leaf: { level: 2, icon: '🌿', name: '잎사귀', description: '조금씩 자라는 단계' },
      tree: { level: 3, icon: '🌳', name: '나무', description: '잘 자란 단계' },
      butterfly: { level: 4, icon: '🦋', name: '나비', description: '변화하는 단계' },
      eagle: { level: 5, icon: '🦅', name: '독수리', description: '높이 날아오르는 단계' },
      star: { level: 6, icon: '⭐', name: '별', description: '빛나는 단계' },
      rocket: { level: 7, icon: '🚀', name: '로켓', description: '최고 높이로 날아가는 단계' }
    };
    
    legend.innerHTML = `
      <h4>등급 설명</h4>
      <div class="legend-items">
        ${Object.entries(rankLevels).map(([key, rank]) => `
          <div class="legend-item">
            <div class="legend-icon">${rank.icon}</div>
            <div class="legend-info">
              <span class="legend-name">${rank.name}</span>
              <span class="legend-description">${rank.description}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    return legend;
  }
  
  getRankDescription(rank) {
    const descriptions = {
      sprout: '처음 시작하는 단계',
      leaf: '조금씩 자라는 단계',
      tree: '잘 자란 단계',
      butterfly: '변화하는 단계',
      eagle: '높이 날아오르는 단계',
      star: '빛나는 단계',
      rocket: '최고 높이로 날아가는 단계'
    };
    return descriptions[rank] || '알 수 없는 등급';
  }
  
  setupRankDemoEvents() {
    // 업그레이드 버튼
    const upgradeBtn = document.getElementById('upgrade-demo-btn');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', () => {
        console.log('🚀 등급 업그레이드 시뮬레이션');
        // 실제로는 서버 API 호출
      });
    }
    
    // 학생 추가 버튼
    const addStudentBtn = document.getElementById('add-student-btn');
    if (addStudentBtn) {
      addStudentBtn.addEventListener('click', () => {
        const newStudent = {
          name: `학생${Math.floor(Math.random() * 1000)}`,
          rank: 'sprout',
          progress: 0,
          totalQuestions: 0
        };
        
        console.log('👤 새 학생 추가:', newStudent);
        // 실제로는 컬렉션에 추가
      });
    }
    
    // 진행률 랜덤 버튼
    const randomProgressBtn = document.getElementById('random-progress-btn');
    if (randomProgressBtn) {
      randomProgressBtn.addEventListener('click', () => {
        console.log('🎲 진행률 랜덤 업데이트');
        // 실제로는 모든 학생의 진행률을 랜덤하게 업데이트
      });
    }
  }
  
  createMedalDemo() {
    // 메달 데모 섹션 추가
    const main = document.querySelector('.app-main');
    if (!main) return;
    
    // 메달 데모 섹션 HTML 추가
    const medalDemoHTML = `
      <div class="demo-card card">
        <div class="card-header">
          <h4 class="card-title">🏅 메달 시스템 데모</h4>
        </div>
        <div class="card-body">
          <p style="margin-bottom: 1rem; opacity: 0.8;">
            질문 활동에 따라 메달을 모으고 마스터 메달까지 달성해보세요!
          </p>
          
          <div style="margin-bottom: 1.5rem;">
            <h5 style="margin-bottom: 1rem;">개별 메달</h5>
            <div id="individual-medal-demo" style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; justify-content: center;"></div>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <h5 style="margin-bottom: 1rem;">테스트 메달</h5>
            <div id="test-medal-demo" style="display: flex; justify-content: center; margin-bottom: 1rem;"></div>
          </div>
          
          <div style="text-align: center;">
            <button id="add-medal-btn" class="btn btn-success" style="margin-right: 0.5rem;">메달 추가</button>
            <button id="random-progress-medal-btn" class="btn btn-warning" style="margin-right: 0.5rem;">진행률 랜덤</button>
            <button id="reset-medal-btn" class="btn btn-danger" style="margin-right: 0.5rem;">초기화</button>
            <button id="master-medal-btn" class="btn btn-primary">마스터로!</button>
          </div>
        </div>
      </div>
    `;
    
    main.insertAdjacentHTML('beforeend', medalDemoHTML);
    
    // 메달 생성
    this.createIndividualMedals();
    this.createTestMedal();
    
    // 이벤트 리스너 설정
    this.setupMedalDemoEvents();
  }
  
  createIndividualMedals() {
    const container = document.getElementById('individual-medal-demo');
    if (!container) return;
    
    const medals = [
      { medal: 'bronze', count: 1 },
      { medal: 'silver', count: 2 },
      { medal: 'gold', count: 3 },
      { medal: 'platinum', count: 4 },
      { medal: 'master', count: 5 }
    ];
    
    medals.forEach(({ medal, count }) => {
      const medalEl = this.createMedalElement(medal, count, true);
      container.appendChild(medalEl);
    });
  }
  
  createTestMedal() {
    const container = document.getElementById('test-medal-demo');
    if (!container) return;
    
    const medalEl = this.createMedalElement('bronze', 0, true, true);
    medalEl.id = 'test-medal-element';
    container.appendChild(medalEl);
  }
  
  createMedalElement(medal, count, showText = false, showProgress = false) {
    const medalTypes = {
      bronze: { level: 1, icon: '🥉', name: '브론즈', color: 'linear-gradient(135deg, #CD7F32, #8B4513)', description: '첫 번째 메달' },
      silver: { level: 2, icon: '🥈', name: '실버', color: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', description: '두 번째 메달' },
      gold: { level: 3, icon: '🥇', name: '골드', color: 'linear-gradient(135deg, #FFD700, #FFA500)', description: '세 번째 메달' },
      platinum: { level: 4, icon: '💎', name: '플래티넘', color: 'linear-gradient(135deg, #E5E4E2, #9370DB)', description: '네 번째 메달' },
      master: { level: 5, icon: '🏆', name: '마스터', color: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)', description: '모든 메달을 모았습니다!' }
    };
    
    const medalInfo = medalTypes[medal];
    if (!medalInfo) return null;
    
    const medalEl = document.createElement('div');
    medalEl.className = 'medal-container';
    medalEl.setAttribute('data-medal', medal);
    
    const progress = showProgress ? 25 : 0;
    
    medalEl.innerHTML = `
      <div class="medal-icon">
        <span class="medal-symbol">${medalInfo.icon}</span>
        ${count < 5 ? `<span class="medal-number">${count}</span>` : ''}
      </div>
      ${showText ? `
        <div class="medal-text">
          <span class="medal-name">${medalInfo.name}</span>
          <span class="medal-description">${medalInfo.description}</span>
        </div>
      ` : ''}
      ${showProgress && count < 5 ? `
        <div class="medal-progress">
          <div class="progress-ring">
            <svg class="progress-svg" viewBox="0 0 36 36">
              <path class="progress-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
              <path class="progress-fill" 
                    stroke-dasharray="${progress}, 100" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
            </svg>
            <span class="progress-text">${Math.round(progress)}%</span>
          </div>
        </div>
      ` : ''}
      <div class="medal-glow"></div>
    `;
    
    // 클릭 이벤트
    medalEl.addEventListener('click', () => {
      console.log(`🏅 ${medalInfo.name} 메달 클릭됨! (${count}개)`);
    });
    
    return medalEl;
  }
  
  setupMedalDemoEvents() {
    // 메달 추가 버튼
    const addMedalBtn = document.getElementById('add-medal-btn');
    if (addMedalBtn) {
      addMedalBtn.addEventListener('click', () => {
        console.log('🏅 메달 추가 시뮬레이션');
        // 실제로는 메달 개수 증가 로직
      });
    }
    
    // 진행률 랜덤 버튼
    const randomProgressBtn = document.getElementById('random-progress-medal-btn');
    if (randomProgressBtn) {
      randomProgressBtn.addEventListener('click', () => {
        console.log('🎲 메달 진행률 랜덤 업데이트');
        // 실제로는 진행률 랜덤 업데이트
      });
    }
    
    // 초기화 버튼
    const resetBtn = document.getElementById('reset-medal-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        console.log('🔄 메달 초기화');
        // 실제로는 메달 초기화
      });
    }
    
    // 마스터 메달 버튼
    const masterBtn = document.getElementById('master-medal-btn');
    if (masterBtn) {
      masterBtn.addEventListener('click', () => {
        console.log('🚀 마스터 메달로 바로 이동!');
        // 실제로는 마스터 메달로 변경
      });
    }
  }
  
  updateStatus() {
    // Professor G 상태 업데이트
    const professorGStatus = document.getElementById('professor-g-status');
    if (professorGStatus) {
      const toggle = document.querySelector('#professor-g-toggle input[type="checkbox"]');
      professorGStatus.textContent = toggle && toggle.checked ? '활성화' : '비활성화';
    }
    
    // 학습 모드 상태 업데이트
    const modeStatus = document.getElementById('mode-status');
    if (modeStatus) {
      const activeModes = [];
      const toggles = document.querySelectorAll('#mode-toggles input[type="checkbox"]:checked');
      toggles.forEach(toggle => {
        const label = toggle.closest('.toggle-container').querySelector('.toggle-label');
        if (label) {
          activeModes.push(label.textContent);
        }
      });
      modeStatus.textContent = activeModes.length > 0 ? activeModes.join(', ') : '없음';
    }
    
    // API 상태 업데이트
    const apiStatus = document.getElementById('api-status');
    if (apiStatus) {
      apiStatus.textContent = 'API 상태: 확인 중...';
      // 실제 API 확인은 나중에 구현
    }
  }
  
  hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
      spinner.style.display = 'none';
    }
  }
  
  showError(message) {
    console.error('App Error:', message);
    
    const errorBoundary = document.getElementById('error-boundary');
    const errorMessage = document.getElementById('error-message');
    
    if (errorBoundary && errorMessage) {
      errorMessage.textContent = message;
      errorBoundary.style.display = 'flex';
    }
  }
}

/**
 * 앱 시작
 */
const app = new SimpleDemoApp();

// 전역 접근을 위해 window에 할당
window.maicDemoApp = app;

// 새로고침 버튼 이벤트
document.getElementById('reload-button')?.addEventListener('click', () => {
  window.location.reload();
});

export default app;
