import { BaseComponent } from '../base/BaseComponent.js';

/**
 * DifficultySelector - 난이도 선택 컴포넌트
 * 초급/중급/고급 난이도 선택 지원
 */
export class DifficultySelector extends BaseComponent {
  constructor(options = {}) {
    super({
      currentDifficulty: 'intermediate',
      showLabels: true,
      showIcons: true,
      compact: false,
      ...options
    });
  }
  
  setupState() {
    this.state = {
      difficulty: this.options.currentDifficulty
    };
  }
  
  setupEvents() {
    super.setupEvents();
  }
  
  renderTemplate() {
    const { showLabels, showIcons, compact } = this.options;
    const { difficulty } = this.state;
    
    const containerClass = compact ? 'difficulty-selector-compact' : 'difficulty-selector';
    
    return `
      <div class="${containerClass}" data-component="difficulty-selector">
        <div class="difficulty-options">
          ${this.renderDifficultyOptions(difficulty, showLabels, showIcons)}
        </div>
      </div>
    `;
  }
  
  renderDifficultyOptions(currentDifficulty, showLabels, showIcons) {
    const difficulties = [
      { 
        value: 'elementary', 
        label: '초급', 
        icon: '🟢',
        description: '기초적인 내용',
        color: 'green'
      },
      { 
        value: 'intermediate', 
        label: '중급', 
        icon: '🔵',
        description: '중간 수준의 내용',
        color: 'blue'
      },
      { 
        value: 'advanced', 
        label: '고급', 
        icon: '🔴',
        description: '고급 수준의 내용',
        color: 'red'
      }
    ];
    
    return difficulties.map(diff => `
      <button 
        class="difficulty-option ${currentDifficulty === diff.value ? 'active' : ''}"
        data-difficulty="${diff.value}"
        data-color="${diff.color}"
        title="${diff.description}"
      >
        ${showIcons ? `<span class="difficulty-icon">${diff.icon}</span>` : ''}
        ${showLabels ? `<span class="difficulty-label">${diff.label}</span>` : ''}
        <span class="difficulty-indicator difficulty-${diff.color}"></span>
      </button>
    `).join('');
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
      difficulty: newDifficulty
    });
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
   * 난이도 설정
   */
  setDifficulty(difficulty) {
    if (this.state.difficulty !== difficulty) {
      this.state.difficulty = difficulty;
      this.updateDifficultyButtons();
    }
  }
  
  /**
   * 현재 난이도 반환
   */
  getDifficulty() {
    return this.state.difficulty;
  }
  
  /**
   * 컴포넌트 마운트 후 실행
   */
  onMount() {
    super.onMount();
    
    // 난이도 버튼 이벤트 리스너
    const buttons = this.element?.querySelectorAll('[data-difficulty]');
    if (buttons) {
      buttons.forEach(button => {
        button.addEventListener('click', (event) => {
          this.handleDifficultyChange(event);
        });
      });
    }
  }
}


