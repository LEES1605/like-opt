/**
 * Event Bus - 전역 이벤트 시스템
 * Like-Opt 프론트엔드 이벤트 관리
 */

/**
 * 전역 이벤트 버스 클래스
 */
export class EventBus {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
    this.middleware = [];
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event, callback, options = {}) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    const listener = {
      callback,
      once: options.once || false,
      priority: options.priority || 0,
      context: options.context || null
    };
    
    this.events.get(event).push(listener);
    
    // 우선순위별 정렬
    this.events.get(event).sort((a, b) => b.priority - a.priority);
    
    return () => this.off(event, callback);
  }

  /**
   * 일회성 이벤트 리스너 등록
   */
  once(event, callback, options = {}) {
    return this.on(event, callback, { ...options, once: true });
  }

  /**
   * 이벤트 리스너 제거
   */
  off(event, callback) {
    if (!this.events.has(event)) return;
    
    const listeners = this.events.get(event);
    const index = listeners.findIndex(listener => listener.callback === callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    
    if (listeners.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * 이벤트 발생
   */
  emit(event, data = null) {
    // 미들웨어 실행
    for (const middleware of this.middleware) {
      const result = middleware(event, data);
      if (result === false) {
        return false; // 미들웨어에서 이벤트 차단
      }
    }
    
    if (!this.events.has(event)) return;
    
    const listeners = [...this.events.get(event)];
    const toRemove = [];
    
    for (const listener of listeners) {
      try {
        if (listener.context) {
          listener.callback.call(listener.context, data);
        } else {
          listener.callback(data);
        }
        
        if (listener.once) {
          toRemove.push(listener);
        }
      } catch (error) {
        console.error(`이벤트 처리 오류 (${event}):`, error);
      }
    }
    
    // 일회성 리스너 제거
    for (const listener of toRemove) {
      this.off(event, listener.callback);
    }
  }

  /**
   * 미들웨어 등록
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * 모든 이벤트 리스너 제거
   */
  removeAllListeners(event = null) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * 이벤트 리스너 수 조회
   */
  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }

  /**
   * 등록된 이벤트 목록 조회
   */
  eventNames() {
    return Array.from(this.events.keys());
  }
}

/**
 * 애플리케이션 이벤트 상수
 */
export const AppEvents = {
  // 시스템 이벤트
  APP_INIT: 'app:init',
  APP_READY: 'app:ready',
  APP_ERROR: 'app:error',
  
  // 사용자 이벤트
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_AUTH_CHANGED: 'user:auth:changed',
  
  // 채팅 이벤트
  CHAT_MESSAGE_SENT: 'chat:message:sent',
  CHAT_MESSAGE_RECEIVED: 'chat:message:received',
  CHAT_MODE_CHANGED: 'chat:mode:changed',
  CHAT_CONVERSATION_CLEARED: 'chat:conversation:cleared',
  CHAT_CONNECTION_CHANGED: 'chat:connection:changed',
  CHAT_LOADING_CHANGED: 'chat:loading:changed',
  
  // 관리자 이벤트
  ADMIN_LOGIN: 'admin:login',
  ADMIN_LOGOUT: 'admin:logout',
  ADMIN_INDEXING_STARTED: 'admin:indexing:started',
  ADMIN_INDEXING_COMPLETED: 'admin:indexing:completed',
  ADMIN_BACKUP_CREATED: 'admin:backup:created',
  ADMIN_BACKUP_RESTORED: 'admin:backup:restored',
  
  // UI 이벤트
  UI_THEME_CHANGED: 'ui:theme:changed',
  UI_MODAL_OPENED: 'ui:modal:opened',
  UI_MODAL_CLOSED: 'ui:modal:closed',

  // WebSocket 이벤트
  WEBSOCKET_CONNECTED: 'websocket:connected',
  WEBSOCKET_DISCONNECTED: 'websocket:disconnected',
  WEBSOCKET_ERROR: 'websocket:error',
  MESSAGE_RECEIVED: 'message:received',
  USER_TYPING: 'user:typing',
  USER_STOPPED_TYPING: 'user:stopped:typing',
  USER_CONNECTED: 'user:connected',
  USER_DISCONNECTED: 'user:disconnected',
  USER_MESSAGE: 'user:message',
  USER_AGENT_CHANGED: 'user:agent:changed',
  HELP_REQUESTED: 'help:requested',
  ADMIN_BROADCAST: 'admin:broadcast',
  ONLINE_USERS: 'online:users',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  UI_SIDEBAR_TOGGLED: 'ui:sidebar:toggled',
  UI_NOTIFICATION_ADDED: 'ui:notification:added',
  UI_NOTIFICATION_REMOVED: 'ui:notification:removed',
  
  // 네트워크 이벤트
  NETWORK_ONLINE: 'network:online',
  NETWORK_OFFLINE: 'network:offline',
  NETWORK_ERROR: 'network:error',
  
  // 컴포넌트 이벤트
  COMPONENT_MOUNTED: 'component:mounted',
  COMPONENT_UNMOUNTED: 'component:unmounted',
  COMPONENT_ERROR: 'component:error'
};

/**
 * 전역 이벤트 버스 인스턴스
 */
export const eventBus = new EventBus();

/**
 * 전역 이벤트 핸들러 설정
 */
export function setupGlobalEventHandlers() {
  // 네트워크 상태 감지
  window.addEventListener('online', () => {
    eventBus.emit(AppEvents.NETWORK_ONLINE);
  });
  
  window.addEventListener('offline', () => {
    eventBus.emit(AppEvents.NETWORK_OFFLINE);
  });
  
  // 페이지 가시성 변경 감지
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      eventBus.emit('app:visibility:hidden');
    } else {
      eventBus.emit('app:visibility:visible');
    }
  });
  
  // 에러 핸들링
  window.addEventListener('error', (event) => {
    eventBus.emit(AppEvents.APP_ERROR, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });
  
  // Promise rejection 핸들링
  window.addEventListener('unhandledrejection', (event) => {
    eventBus.emit(AppEvents.APP_ERROR, {
      message: 'Unhandled Promise Rejection',
      error: event.reason
    });
  });
  
  console.log('✅ 전역 이벤트 핸들러 설정 완료');
}

/**
 * 이벤트 유틸리티 함수들
 */
export const EventUtils = {
  /**
   * 이벤트 데이터 검증
   */
  validateEventData(data, schema) {
    if (!schema) return true;
    
    for (const [key, type] of Object.entries(schema)) {
      if (!(key in data)) {
        throw new Error(`필수 이벤트 데이터 누락: ${key}`);
      }
      
      if (typeof data[key] !== type) {
        throw new Error(`이벤트 데이터 타입 오류: ${key}는 ${type}이어야 합니다`);
      }
    }
    
    return true;
  },
  
  /**
   * 이벤트 디바운싱
   */
  debounce(event, callback, delay = 300) {
    let timeoutId;
    
    return eventBus.on(event, (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), delay);
    });
  },
  
  /**
   * 이벤트 스로틀링
   */
  throttle(event, callback, delay = 300) {
    let lastCall = 0;
    
    return eventBus.on(event, (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        callback(...args);
      }
    });
  },
  
  /**
   * 이벤트 체이닝
   */
  chain(events, callback) {
    let completed = 0;
    const results = [];
    
    const checkComplete = () => {
      if (++completed === events.length) {
        callback(results);
      }
    };
    
    events.forEach((event, index) => {
      eventBus.once(event, (data) => {
        results[index] = data;
        checkComplete();
      });
    });
  }
};

// 기본 미들웨어 등록
eventBus.addMiddleware((event, data) => {
  // 개발 환경에서 이벤트 로깅
  if (process.env.NODE_ENV === 'development') {
    console.log(`📡 Event: ${event}`, data);
  }
  return true;
});

// 에러 처리 미들웨어
eventBus.addMiddleware((event, data) => {
  if (event === AppEvents.APP_ERROR) {
    console.error('🚨 애플리케이션 오류:', data);
  }
  return true;
});