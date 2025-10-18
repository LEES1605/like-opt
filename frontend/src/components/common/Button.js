import { BaseComponent } from '../base/BaseComponent.js';

/**
 * Button - 재사용 가능한 버튼 컴포넌트
 * 다양한 타입, 크기, 상태를 지원
 */
export class Button extends BaseComponent {
  constructor(options = {}) {
    super({
      // 기본 옵션
      type: 'primary',
      size: 'medium',
      disabled: false,
      loading: false,
      text: 'Button',
      icon: null,
      iconPosition: 'left',
      block: false,
      outline: false,
      ghost: false,
      round: false,
      ...options
    });
  }
  
  setupState() {
    this.state = {
      disabled: this.options.disabled,
      loading: this.options.loading,
      text: this.options.text
    };
  }
  
  renderTemplate() {
    const {
      type,
      size,
      icon,
      iconPosition,
      block,
      outline,
      ghost,
      round
    } = this.options;
    
    const {
      disabled,
      loading,
      text
    } = this.state;
    
    // CSS 클래스 생성
    const classes = this.generateClasses({
      type,
      size,
      block,
      outline,
      ghost,
      round,
      disabled: disabled || loading,
      loading
    });
    
    // 아이콘 렌더링
    const iconHtml = this.renderIcon(icon, loading);
    
    // 버튼 텍스트
    const buttonText = loading ? '로딩 중...' : text;
    
    return `
      <button 
        class="${classes}"
        ${disabled || loading ? 'disabled' : ''}
        data-component="button"
        data-type="${type}"
        data-size="${size}"
        ${this.generateAttributes()}
      >
        ${iconPosition === 'left' ? iconHtml : ''}
        <span class="button-text">${buttonText}</span>
        ${iconPosition === 'right' ? iconHtml : ''}
      </button>
    `;
  }
  
  generateClasses(options) {
    const {
      type,
      size,
      block,
      outline,
      ghost,
      round,
      disabled,
      loading
    } = options;
    
    const classes = ['btn'];
    
    // 타입 클래스
    classes.push(`btn-${type}`);
    
    // 크기 클래스
    classes.push(`btn-${size}`);
    
    // 스타일 클래스
    if (block) classes.push('btn-block');
    if (outline) classes.push('btn-outline');
    if (ghost) classes.push('btn-ghost');
    if (round) classes.push('btn-round');
    
    // 상태 클래스
    if (disabled) classes.push('btn-disabled');
    if (loading) classes.push('btn-loading');
    
    // 사용자 정의 클래스
    if (this.options.className) {
      classes.push(this.options.className);
    }
    
    return classes.join(' ');
  }
  
  renderIcon(icon, loading) {
    if (loading) {
      return '<span class="btn-icon btn-icon-loading">⟳</span>';
    }
    
    if (icon) {
      return `<span class="btn-icon">${icon}</span>`;
    }
    
    return '';
  }
  
  generateAttributes() {
    const attributes = { ...this.options.attributes };
    
    // 데이터 속성 추가
    attributes['data-id'] = this.options.id;
    
    return Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
  }
  
  /**
   * 버튼 비활성화
   */
  disable() {
    this.update({ disabled: true });
  }
  
  /**
   * 버튼 활성화
   */
  enable() {
    this.update({ disabled: false });
  }
  
  /**
   * 로딩 상태 설정
   */
  setLoading(loading) {
    this.update({ loading });
  }
  
  /**
   * 텍스트 변경
   */
  setText(text) {
    this.update({ text });
  }
  
  /**
   * 클릭 이벤트 핸들러
   */
  onClick(handler) {
    this.addEventListener('click', (event) => {
      if (this.state.disabled || this.state.loading) {
        event.preventDefault();
        return;
      }
      
      handler(event, this);
    });
    return this;
  }
  
  /**
   * 마우스 오버 이벤트 핸들러
   */
  onHover(handler) {
    this.addEventListener('mouseenter', (event) => {
      handler(event, this);
    });
    return this;
  }
  
  /**
   * 마우스 아웃 이벤트 핸들러
   */
  onLeave(handler) {
    this.addEventListener('mouseleave', (event) => {
      handler(event, this);
    });
    return this;
  }
}

/**
 * 버튼 팩토리 함수들
 */
export const ButtonFactory = {
  /**
   * 기본 버튼 생성
   */
  primary: (text, options = {}) => {
    return new Button({ text, type: 'primary', ...options });
  },
  
  /**
   * 보조 버튼 생성
   */
  secondary: (text, options = {}) => {
    return new Button({ text, type: 'secondary', ...options });
  },
  
  /**
   * 성공 버튼 생성
   */
  success: (text, options = {}) => {
    return new Button({ text, type: 'success', ...options });
  },
  
  /**
   * 경고 버튼 생성
   */
  warning: (text, options = {}) => {
    return new Button({ text, type: 'warning', ...options });
  },
  
  /**
   * 위험 버튼 생성
   */
  danger: (text, options = {}) => {
    return new Button({ text, type: 'danger', ...options });
  },
  
  /**
   * 링크 스타일 버튼 생성
   */
  link: (text, options = {}) => {
    return new Button({ text, type: 'link', ...options });
  },
  
  /**
   * 아이콘 버튼 생성
   */
  icon: (icon, options = {}) => {
    return new Button({ icon, text: '', ...options });
  },
  
  /**
   * 블록 버튼 생성
   */
  block: (text, options = {}) => {
    return new Button({ text, block: true, ...options });
  },
  
  /**
   * 아웃라인 버튼 생성
   */
  outline: (text, options = {}) => {
    return new Button({ text, outline: true, ...options });
  },
  
  /**
   * 고스트 버튼 생성
   */
  ghost: (text, options = {}) => {
    return new Button({ text, ghost: true, ...options });
  }
};

/**
 * 버튼 그룹 컴포넌트
 */
export class ButtonGroup extends BaseComponent {
  constructor(options = {}) {
    super({
      buttons: [],
      vertical: false,
      size: 'medium',
      ...options
    });
  }
  
  renderTemplate() {
    const { vertical, size } = this.options;
    const buttons = this.options.buttons || [];
    
    const classes = [
      'btn-group',
      vertical ? 'btn-group-vertical' : 'btn-group-horizontal',
      `btn-group-${size}`
    ].join(' ');
    
    const buttonsHtml = buttons.map(button => {
      if (typeof button === 'string') {
        return `<button class="btn btn-${size}">${button}</button>`;
      }
      
      if (button instanceof Button) {
        return button.render().outerHTML;
      }
      
      return new Button({ ...button, size }).render().outerHTML;
    }).join('');
    
    return `
      <div class="${classes}" data-component="button-group">
        ${buttonsHtml}
      </div>
    `;
  }
  
  addButton(button) {
    this.options.buttons.push(button);
    this.reRender();
  }
  
  removeButton(index) {
    this.options.buttons.splice(index, 1);
    this.reRender();
  }
}

