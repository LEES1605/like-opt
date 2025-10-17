import { BaseComponent } from '../base/BaseComponent.js';

/**
 * ToggleSwitch - 재사용 가능한 토글 스위치 컴포넌트
 * 다양한 크기, 색상, 상태를 지원
 */
export class ToggleSwitch extends BaseComponent {
  constructor(options = {}) {
    super({
      label: '',
      labelPosition: 'right',
      size: 'medium',
      color: 'primary',
      disabled: false,
      checked: false,
      value: true,
      uncheckedValue: false,
      ...options
    });
  }
  
  setupState() {
    this.state = {
      checked: this.options.checked,
      disabled: this.options.disabled
    };
  }
  
  setupEvents() {
    super.setupEvents();
    
    // 기본 변경 이벤트
    this.addEventListener('change', (event) => {
      this.handleChange(event);
    });
  }
  
  renderTemplate() {
    const { label, labelPosition, size, color, value, uncheckedValue } = this.options;
    const { checked, disabled } = this.state;
    
    const containerClasses = this.generateContainerClasses(size, labelPosition);
    const switchClasses = this.generateSwitchClasses(size, color, checked, disabled);
    const sliderClasses = this.generateSliderClasses(size);
    
    const labelHtml = label ? `
      <label class="toggle-label" for="${this.options.id}">
        ${label}
      </label>
    ` : '';
    
    return `
      <div class="${containerClasses}" data-component="toggle-switch">
        ${labelPosition === 'left' ? labelHtml : ''}
        <label class="toggle-switch-container ${switchClasses}">
          <input 
            type="checkbox" 
            id="${this.options.id}"
            class="toggle-input"
            ${checked ? 'checked' : ''}
            ${disabled ? 'disabled' : ''}
            value="${checked ? value : uncheckedValue}"
            ${this.generateAttributes()}
          >
          <span class="toggle-slider ${sliderClasses}">
            <span class="toggle-handle"></span>
          </span>
        </label>
        ${labelPosition === 'right' ? labelHtml : ''}
      </div>
    `;
  }
  
  generateContainerClasses(size, labelPosition) {
    const classes = ['toggle-container'];
    
    classes.push(`toggle-${size}`);
    classes.push(`toggle-label-${labelPosition}`);
    
    if (this.options.className) {
      classes.push(this.options.className);
    }
    
    return classes.join(' ');
  }
  
  generateSwitchClasses(size, color, checked, disabled) {
    const classes = ['toggle-switch'];
    
    classes.push(`toggle-switch-${size}`);
    classes.push(`toggle-switch-${color}`);
    
    if (checked) classes.push('toggle-switch-checked');
    if (disabled) classes.push('toggle-switch-disabled');
    
    return classes.join(' ');
  }
  
  generateSliderClasses(size) {
    return `toggle-slider-${size}`;
  }
  
  generateAttributes() {
    const attributes = { ...this.options.attributes };
    
    // 데이터 속성 추가
    attributes['data-id'] = this.options.id;
    attributes['data-value'] = this.options.value;
    attributes['data-unchecked-value'] = this.options.uncheckedValue;
    
    return Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
  }
  
  handleChange(event) {
    if (this.state.disabled) {
      event.preventDefault();
      return;
    }
    
    const checked = event.target.checked;
    this.update({ checked });
    
    // 값 업데이트
    event.target.value = checked ? this.options.value : this.options.uncheckedValue;
    
    // 변경 이벤트 발생
    this.emit('change', {
      checked,
      value: event.target.value,
      originalEvent: event
    });
  }
  
  /**
   * 토글 상태 변경
   */
  toggle() {
    if (!this.state.disabled) {
      this.update({ checked: !this.state.checked });
      this.emitChange();
    }
  }
  
  /**
   * 체크 상태 설정
   */
  setChecked(checked) {
    this.update({ checked });
    this.emitChange();
  }
  
  /**
   * 체크 상태 반환
   */
  isChecked() {
    return this.state.checked;
  }
  
  /**
   * 현재 값 반환
   */
  getValue() {
    return this.state.checked ? this.options.value : this.options.uncheckedValue;
  }
  
  /**
   * 비활성화
   */
  disable() {
    this.update({ disabled: true });
  }
  
  /**
   * 활성화
   */
  enable() {
    this.update({ disabled: false });
  }
  
  /**
   * 변경 이벤트 발생
   */
  emitChange() {
    if (this.element) {
      const input = this.element.querySelector('.toggle-input');
      if (input) {
        input.value = this.getValue();
        input.checked = this.state.checked;
        
        // 커스텀 이벤트 발생
        const changeEvent = new CustomEvent('change', {
          detail: {
            checked: this.state.checked,
            value: this.getValue()
          }
        });
        input.dispatchEvent(changeEvent);
      }
    }
  }
  
  /**
   * 변경 이벤트 리스너
   */
  onChange(handler) {
    this.addEventListener('change', handler);
    return this;
  }
  
  /**
   * 포커스 이벤트 리스너
   */
  onFocus(handler) {
    this.addEventListener('focus', handler);
    return this;
  }
  
  /**
   * 블러 이벤트 리스너
   */
  onBlur(handler) {
    this.addEventListener('blur', handler);
    return this;
  }
}

/**
 * 토글 그룹 컴포넌트
 */
export class ToggleGroup extends BaseComponent {
  constructor(options = {}) {
    super({
      toggles: [],
      multiple: false,
      value: null,
      ...options
    });
  }
  
  setupState() {
    this.state = {
      value: this.options.value,
      selectedToggles: new Set()
    };
  }
  
  renderTemplate() {
    const { toggles, multiple } = this.options;
    
    const togglesHtml = toggles.map((toggleOptions, index) => {
      const toggle = new ToggleSwitch({
        ...toggleOptions,
        id: `${this.options.id}-toggle-${index}`,
        onChange: (event) => this.handleToggleChange(event, index)
      });
      
      return toggle.render().outerHTML;
    }).join('');
    
    return `
      <div class="toggle-group" data-component="toggle-group" data-multiple="${multiple}">
        ${togglesHtml}
      </div>
    `;
  }
  
  handleToggleChange(event, index) {
    const { multiple } = this.options;
    const { checked, value } = event.detail;
    
    if (multiple) {
      // 다중 선택
      if (checked) {
        this.state.selectedToggles.add(index);
      } else {
        this.state.selectedToggles.delete(index);
      }
      
      this.state.value = Array.from(this.state.selectedToggles);
    } else {
      // 단일 선택
      if (checked) {
        this.state.selectedToggles.clear();
        this.state.selectedToggles.add(index);
        this.state.value = value;
      } else {
        this.state.selectedToggles.clear();
        this.state.value = null;
      }
    }
    
    this.emit('change', {
      value: this.state.value,
      selectedToggles: Array.from(this.state.selectedToggles)
    });
  }
  
  /**
   * 값 설정
   */
  setValue(value) {
    this.update({ value });
  }
  
  /**
   * 값 반환
   */
  getValue() {
    return this.state.value;
  }
}

/**
 * 토글 팩토리 함수들
 */
export const ToggleFactory = {
  /**
   * 기본 토글 생성
   */
  create: (label, options = {}) => {
    return new ToggleSwitch({ label, ...options });
  },
  
  /**
   * 작은 토글 생성
   */
  small: (label, options = {}) => {
    return new ToggleSwitch({ label, size: 'small', ...options });
  },
  
  /**
   * 큰 토글 생성
   */
  large: (label, options = {}) => {
    return new ToggleSwitch({ label, size: 'large', ...options });
  },
  
  /**
   * 성공 색상 토글 생성
   */
  success: (label, options = {}) => {
    return new ToggleSwitch({ label, color: 'success', ...options });
  },
  
  /**
   * 경고 색상 토글 생성
   */
  warning: (label, options = {}) => {
    return new ToggleSwitch({ label, color: 'warning', ...options });
  },
  
  /**
   * 위험 색상 토글 생성
   */
  danger: (label, options = {}) => {
    return new ToggleSwitch({ label, color: 'danger', ...options });
  },
  
  /**
   * 비활성화된 토글 생성
   */
  disabled: (label, options = {}) => {
    return new ToggleSwitch({ label, disabled: true, ...options });
  }
};

/**
 * 토글 매니저 - 토글 상태 관리
 */
export class ToggleManager {
  constructor() {
    this.toggles = new Map();
  }
  
  /**
   * 토글 등록
   */
  register(name, toggle) {
    this.toggles.set(name, toggle);
    return toggle;
  }
  
  /**
   * 토글 조회
   */
  get(name) {
    return this.toggles.get(name);
  }
  
  /**
   * 모든 토글 상태 설정
   */
  setAll(checked) {
    this.toggles.forEach(toggle => toggle.setChecked(checked));
  }
  
  /**
   * 모든 토글 비활성화
   */
  disableAll() {
    this.toggles.forEach(toggle => toggle.disable());
  }
  
  /**
   * 모든 토글 활성화
   */
  enableAll() {
    this.toggles.forEach(toggle => toggle.enable());
  }
  
  /**
   * 체크된 토글들 반환
   */
  getChecked() {
    const checked = [];
    this.toggles.forEach((toggle, name) => {
      if (toggle.isChecked()) {
        checked.push({ name, toggle });
      }
    });
    return checked;
  }
  
  /**
   * 모든 토글 제거
   */
  removeAll() {
    this.toggles.forEach(toggle => toggle.destroy());
    this.toggles.clear();
  }
}

// 전역 토글 매니저
export const toggleManager = new ToggleManager();

// 컴포넌트 등록
import { componentRegistry } from '../base/BaseComponent.js';
componentRegistry.register('ToggleSwitch', ToggleSwitch);
componentRegistry.register('ToggleGroup', ToggleGroup);
