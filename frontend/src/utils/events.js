/**
 * Event Management - 이벤트 버스 시스템
 */

/**
 * 간단한 이벤트 버스 구현
 */
class EventBus {
  constructor() {
    this.events = new Map();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(callback);
  }
  
  /**
   * 이벤트 발생
   */
  emit(eventName, data) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
  
  /**
   * 이벤트 리스너 제거
   */
  off(eventName, callback) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  /**
   * 모든 이벤트 리스너 제거
   */
  clear() {
    this.events.clear();
  }
}

// 전역 이벤트 버스 인스턴스
export const eventBus = new EventBus();

/**
 * 애플리케이션 이벤트 상수
 */
export const AppEvents = {
  // UI 이벤트
  TOGGLE_CHANGE: 'toggle:change',
  BUTTON_CLICK: 'button:click',
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  
  // 앱 이벤트
  APP_READY: 'app:ready',
  APP_ERROR: 'app:error',
  
  // 상태 이벤트
  STATE_CHANGE: 'state:change',
  
  // API 이벤트
  API_REQUEST: 'api:request',
  API_RESPONSE: 'api:response',
  API_ERROR: 'api:error'
};

/**
 * 전역 이벤트 핸들러 설정
 */
export function setupGlobalEventHandlers() {
  console.log('🔗 전역 이벤트 핸들러 설정 중...');
  
  // 전역 클릭 이벤트
  document.addEventListener('click', (event) => {
    const target = event.target;
    
    // 버튼 클릭 이벤트
    if (target.matches('[data-component="button"]')) {
      eventBus.emit(AppEvents.BUTTON_CLICK, {
        target,
        component: 'button',
        type: target.dataset.type
      });
    }
    
    // 토글 변경 이벤트
    if (target.matches('[data-action="toggle"]')) {
      eventBus.emit(AppEvents.TOGGLE_CHANGE, {
        target,
        checked: target.checked
      });
    }
  });
  
  // 전역 키보드 이벤트
  document.addEventListener('keydown', (event) => {
    // ESC 키로 모달 닫기
    if (event.key === 'Escape') {
      eventBus.emit(AppEvents.MODAL_CLOSE, { key: 'escape' });
    }
  });
  
  console.log('✅ 전역 이벤트 핸들러 설정 완료');
}

/**
 * 이벤트 유틸리티 함수들
 */
export const EventUtils = {
  /**
   * 이벤트 위임
   */
  delegate(parent, selector, event, handler) {
    parent.addEventListener(event, (e) => {
      if (e.target.matches(selector)) {
        handler(e);
      }
    });
  },
  
  /**
   * 이벤트 한 번만 실행
   */
  once(element, event, handler) {
    const onceHandler = (e) => {
      handler(e);
      element.removeEventListener(event, onceHandler);
    };
    element.addEventListener(event, onceHandler);
  },
  
  /**
   * 이벤트 방지
   */
  preventDefault(event) {
    event.preventDefault();
  },
  
  /**
   * 이벤트 전파 중지
   */
  stopPropagation(event) {
    event.stopPropagation();
  }
};