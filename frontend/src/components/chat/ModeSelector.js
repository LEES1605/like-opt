import { BaseComponent } from '../base/BaseComponent.js';
import { ToggleSwitch } from '../common/ToggleSwitch.js';

/**
 * ModeSelector - 학습 모드 선택 컴포넌트
 * 문법/문장/지문 모드와 난이도 선택 지원
 */
export class ModeSelector extends BaseComponent {
  constructor(options = {}) {
    super({
      currentMode: 'grammar',
      currentDifficulty: 'intermediate',
      showDifficulty: true,
      compact: false,
      ...options
    });
  }
  
  setupState() {
    this.state = {
      mode: this.options.currentMode,
      difficulty: this.options.currentDifficulty
    };
  }
  
  setupEvents() {
    super.setupEvents();
  }
  
  renderTemplate() {
    const { showDifficulty, compact } = this.options;
    const { mode, difficulty } = this.state;
    
    const modeSelector = this.renderModeSelector(mode);
    const difficultySelector = showDifficulty ? this.renderDifficultySelector(difficulty) : '';
    
    const containerClass = compact ? 'mode-selector-compact' : 'mode-selector';
    
    return `
      <div class="${containerClass}" data-component="mode-selector">
        <div class="mode-section">
          <h4 class="mode-title">학습 모드</h4>
          ${modeSelector}
        </div>
        ${showDifficulty ? `
          <div class="difficulty-section">
            <h4 class="difficulty-title">난이도</h4>
            ${difficultySelector}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  renderModeSelector(currentMode) {
    const modes = [
      { value: 'grammar', label: '문법', icon: '📚' },
      { value: 'sentence', label: '문장', icon: '📝' },
      { value: 'passage', label: '지문', icon: '📖' }
    ];
    
    const modeButtons = modes.map(mode => `
      <button 
        class="mode-button ${currentMode === mode.value ? 'active' : ''}"
        data-mode="${mode.value}"
        title="${mode.label} 모드"
      >
        <span class="mode-icon">${mode.icon}</span>
        <span class="mode-label">${mode.label}</span>
      </button>
    `).join('');
    
    return `
      <div class="mode-buttons">
        ${modeButtons}
      </div>
    `;
  }
  
  renderDifficultySelector(currentDifficulty) {
    const difficulties = [
      { value: 'elementary', label: '초급', color: 'green' },
      { value: 'intermediate', label: '중급', color: 'blue' },
      { value: 'advanced', label: '고급', color: 'red' }
    ];
    
    const difficultyButtons = difficulties.map(diff => `
      <button 
        class="difficulty-button ${currentDifficulty === diff.value ? 'active' : ''}"
        data-difficulty="${diff.value}"
        data-color="${diff.color}"
        title="${diff.label} 난이도"
      >
        <span class="difficulty-dot difficulty-${diff.color}"></span>
        <span class="difficulty-label">${diff.label}</span>
      </button>
    `).join('');
    
    return `
      <div class="difficulty-buttons">
        ${difficultyButtons}
      </div>
    `;
  }
  
  /**
   * 모드 변경 이벤트 처리
   */
  handleModeChange(event) {
    const button = event.target.closest('[data-mode]');
    if (!button) return;
    
    const newMode = button.dataset.mode;
    if (newMode === this.state.mode) return;
    
    this.state.mode = newMode;
    this.updateModeButtons();
    
    // 모드 변경 이벤트 발생
    this.emit('modeChange', {
      mode: newMode,
      difficulty: this.state.difficulty
    });
  }
  
  /**
   * 난이도 변경 이벤트 처리
   */
  handleDifficultyChange(event) {
    const button = event.target.closest('[data-difficulty]');
    if (!button) return;
    
    const newDifficulty = button.dataset.difficulty;
    if (newDifficulty === this.state.difficulty) return;
    
    this.state.difficulty = newDifficulty;
    this.updateDifficultyButtons();
    
    // 난이도 변경 이벤트 발생
    this.emit('difficultyChange', {
      mode: this.state.mode,
      difficulty: newDifficulty
    });
  }
  
  /**
   * 모드 버튼 상태 업데이트
   */
  updateModeButtons() {
    const buttons = this.element?.querySelectorAll('[data-mode]');
    if (buttons) {
      buttons.forEach(button => {
        const mode = button.dataset.mode;
        button.classList.toggle('active', mode === this.state.mode);
      });
    }
  }
  
  /**
   * 난이도 버튼 상태 업데이트
   */
  updateDifficultyButtons() {
    const buttons = this.element?.querySelectorAll('[data-difficulty]');
    if (buttons) {
      buttons.forEach(button => {
        const difficulty = button.dataset.difficulty;
        button.classList.toggle('active', difficulty === this.state.difficulty);
      });
    }
  }
  
  /**
   * 모드 설정
   */
  setMode(mode) {
    if (this.state.mode !== mode) {
      this.state.mode = mode;
      this.updateModeButtons();
    }
  }
  
  /**
   * 난이도 설정
   */
  setDifficulty(difficulty) {
    if (this.state.difficulty !== difficulty) {
      this.state.difficulty = difficulty;
      this.updateDifficultyButtons();
    }
  }
  
  /**
   * 현재 설정 반환
   */
  getSettings() {
    return {
      mode: this.state.mode,
      difficulty: this.state.difficulty
    };
  }
  
  /**
   * 설정 적용
   */
  setSettings(settings) {
    if (settings.mode) {
      this.setMode(settings.mode);
    }
    if (settings.difficulty) {
      this.setDifficulty(settings.difficulty);
    }
  }
  
  /**
   * 컴포넌트 마운트 후 실행
   */
  onMount() {
    super.onMount();
    
    // 모드 버튼 이벤트 리스너
    const modeButtons = this.element?.querySelectorAll('[data-mode]');
    if (modeButtons) {
      modeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
          this.handleModeChange(event);
        });
      });
    }
    
    // 난이도 버튼 이벤트 리스너
    const difficultyButtons = this.element?.querySelectorAll('[data-difficulty]');
    if (difficultyButtons) {
      difficultyButtons.forEach(button => {
        button.addEventListener('click', (event) => {
          this.handleDifficultyChange(event);
        });
      });
    }
  }
}


