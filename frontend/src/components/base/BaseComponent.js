/**
 * BaseComponent - 모든 컴포넌트의 기본 클래스
 * 재사용 가능한 컴포넌트 시스템의 핵심
 */
export class BaseComponent {
  constructor(options = {}) {
    // 기본 옵션 설정
    this.options = {
      id: options.id || this.generateId(),
      className: options.className || '',
      attributes: options.attributes || {},
      events: options.events || {},
      children: options.children || [],
      ...options
    };
    
    // 컴포넌트 상태
    this.state = {};
    this.element = null;
    this.isRendered = false;
    this.isDestroyed = false;
    
    // 이벤트 리스너 관리
    this.eventListeners = new Map();
    
    // 생명주기 훅
    this.onInit = options.onInit || (() => {});
    this.onRender = options.onRender || (() => {});
    this.onMount = options.onMount || (() => {});
    this.onDestroy = options.onDestroy || (() => {});
    
    // 초기화
    this.init();
  }
  
  /**
   * 컴포넌트 초기화
   */
  init() {
    try {
      this.onInit();
      this.setupState();
      this.setupEvents();
    } catch (error) {
      console.error(`Component initialization failed:`, error);
    }
  }
  
  /**
   * 상태 설정
   */
  setupState() {
    // 서브클래스에서 구현
  }
  
  /**
   * 이벤트 설정
   */
  setupEvents() {
    // 기본 이벤트 설정
    Object.entries(this.options.events).forEach(([event, handler]) => {
      this.addEventListener(event, handler);
    });
  }
  
  /**
   * 컴포넌트 렌더링
   */
  render() {
    if (this.isDestroyed) {
      console.warn('Attempting to render destroyed component');
      return null;
    }
    
    try {
      const html = this.renderTemplate();
      this.element = this.createElement(html);
      this.isRendered = true;
      this.onRender();
      return this.element;
    } catch (error) {
      console.error(`Component render failed:`, error);
      return this.renderError(error);
    }
  }
  
  /**
   * 템플릿 렌더링 (서브클래스에서 구현)
   */
  renderTemplate() {
    throw new Error('renderTemplate method must be implemented by subclass');
  }
  
  /**
   * HTML 문자열을 DOM 요소로 변환
   */
  createElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    const element = template.content.firstChild;
    
    // 이벤트 리스너 연결
    this.attachEventListeners(element);
    
    return element;
  }
  
  /**
   * 이벤트 리스너 연결
   */
  attachEventListeners(element) {
    this.eventListeners.forEach((handler, event) => {
      element.addEventListener(event, handler);
    });
  }
  
  /**
   * DOM에 마운트
   */
  mount(container) {
    if (!this.element) {
      this.render();
    }
    
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (container && this.element) {
      container.appendChild(this.element);
      this.onMount();
      return this.element;
    }
    
    throw new Error('Invalid container provided for mounting');
  }
  
  /**
   * DOM에서 언마운트
   */
  unmount() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
  
  /**
   * 컴포넌트 업데이트
   */
  update(newState = {}) {
    if (this.isDestroyed) return;
    
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    // 상태 변경 시 재렌더링
    if (this.shouldUpdate(oldState, this.state)) {
      this.reRender();
    }
  }
  
  /**
   * 업데이트 필요 여부 확인
   */
  shouldUpdate(oldState, newState) {
    return JSON.stringify(oldState) !== JSON.stringify(newState);
  }
  
  /**
   * 재렌더링
   */
  reRender() {
    if (!this.element) return;
    
    const parent = this.element.parentNode;
    const newElement = this.render();
    
    if (parent && newElement) {
      parent.replaceChild(newElement, this.element);
      this.element = newElement;
    }
  }
  
  /**
   * 이벤트 리스너 추가
   */
  addEventListener(event, handler) {
    this.eventListeners.set(event, handler);
    
    if (this.element) {
      this.element.addEventListener(event, handler);
    }
  }
  
  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(event) {
    this.eventListeners.delete(event);
    
    if (this.element) {
      this.element.removeEventListener(event, handler);
    }
  }
  
  /**
   * CSS 클래스 추가
   */
  addClass(className) {
    if (this.element) {
      this.element.classList.add(className);
    }
  }
  
  /**
   * CSS 클래스 제거
   */
  removeClass(className) {
    if (this.element) {
      this.element.classList.remove(className);
    }
  }
  
  /**
   * CSS 클래스 토글
   */
  toggleClass(className) {
    if (this.element) {
      this.element.classList.toggle(className);
    }
  }
  
  /**
   * 속성 설정
   */
  setAttribute(name, value) {
    if (this.element) {
      this.element.setAttribute(name, value);
    }
  }
  
  /**
   * 속성 조회
   */
  getAttribute(name) {
    return this.element ? this.element.getAttribute(name) : null;
  }
  
  /**
   * 스타일 설정
   */
  setStyle(property, value) {
    if (this.element) {
      this.element.style[property] = value;
    }
  }
  
  /**
   * 에러 렌더링
   */
  renderError(error) {
    const errorElement = document.createElement('div');
    errorElement.className = 'component-error';
    errorElement.innerHTML = `
      <div class="error-content">
        <h3>컴포넌트 오류</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">
          닫기
        </button>
      </div>
    `;
    return errorElement;
  }
  
  /**
   * 고유 ID 생성
   */
  generateId() {
    return `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 컴포넌트 파괴
   */
  destroy() {
    if (this.isDestroyed) return;
    
    // 이벤트 리스너 정리
    this.eventListeners.clear();
    
    // DOM에서 제거
    this.unmount();
    
    // 상태 정리
    this.state = {};
    this.element = null;
    this.isRendered = false;
    this.isDestroyed = true;
    
    // 정리 훅 호출
    this.onDestroy();
  }
  
  /**
   * 컴포넌트 정보 조회
   */
  getInfo() {
    return {
      id: this.options.id,
      className: this.constructor.name,
      isRendered: this.isRendered,
      isDestroyed: this.isDestroyed,
      state: this.state,
      eventListeners: Array.from(this.eventListeners.keys())
    };
  }
}

/**
 * 컴포넌트 팩토리 함수
 */
export function createComponent(ComponentClass, options = {}) {
  return new ComponentClass(options);
}

