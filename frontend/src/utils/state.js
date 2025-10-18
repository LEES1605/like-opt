/**
 * 전역 상태 관리 시스템
 * Like-Opt 프론트엔드 상태 관리
 */

/**
 * 전역 상태 객체
 */
const globalState = {
  // 사용자 상태
  user: {
    isAuthenticated: false,
    role: null,
    preferences: {
      theme: 'dark',
      language: 'ko',
      notifications: true
    }
  },
  
  // 채팅 상태
  chat: {
    currentMode: 'grammar',
    currentDifficulty: 'intermediate',
    messages: [],
    isTyping: false,
    isConnected: false,
    conversationId: null,
    settings: {
      autoScroll: true,
      showTimestamps: true,
      maxMessages: 100
    }
  },
  
  // 관리자 상태
  admin: {
    isLoggedIn: false,
    permissions: [],
    indexingStatus: {
      isRunning: false,
      progress: 0,
      currentTask: null
    },
    backups: []
  },
  
  // UI 상태
  ui: {
    isLoading: false,
    activeModal: null,
    notifications: [],
    sidebarOpen: false,
    theme: 'dark'
  },
  
  // 앱 상태
  app: {
    version: '1.0.0',
    isOnline: navigator.onLine,
    lastActivity: Date.now(),
    errors: []
  }
};

/**
 * 상태 변경 리스너들
 */
const stateListeners = new Map();

/**
 * 상태 관리 클래스
 */
class StateManager {
  constructor() {
    this.state = { ...globalState };
    this.listeners = new Map();
    this.middleware = [];
  }
  
  /**
   * 상태 가져오기
   */
  getState(path = null) {
    if (!path) return { ...this.state };
    
    return this.getNestedValue(this.state, path);
  }
  
  /**
   * 상태 설정하기
   */
  setState(path, value, silent = false) {
    const oldState = { ...this.state };
    
    if (typeof path === 'object') {
      // 객체로 전달된 경우 병합
      this.state = this.deepMerge(this.state, path);
    } else {
      // 경로와 값으로 전달된 경우
      this.setNestedValue(this.state, path, value);
    }
    
    if (!silent) {
      this.notifyListeners(path, this.state, oldState);
    }
    
    return this.state;
  }
  
  /**
   * 상태 구독하기
   */
  subscribe(path, callback, options = {}) {
    const listener = {
      id: this.generateId(),
      path,
      callback,
      options: {
        immediate: false,
        deep: false,
        ...options
      }
    };
    
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    
    this.listeners.get(path).add(listener);
    
    // 즉시 실행 옵션이 있으면 현재 값으로 콜백 호출
    if (listener.options.immediate) {
      const currentValue = this.getNestedValue(this.state, path);
      callback(currentValue, this.state);
    }
    
    // 구독 해제 함수 반환
    return () => this.unsubscribe(listener.id, path);
  }
  
  /**
   * 구독 해제하기
   */
  unsubscribe(listenerId, path) {
    if (this.listeners.has(path)) {
      const listeners = this.listeners.get(path);
      for (const listener of listeners) {
        if (listener.id === listenerId) {
          listeners.delete(listener);
          break;
        }
      }
      
      // 리스너가 없으면 경로 삭제
      if (listeners.size === 0) {
        this.listeners.delete(path);
      }
    }
  }
  
  /**
   * 미들웨어 추가
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }
  
  /**
   * 리스너들에게 알림
   */
  notifyListeners(changedPath, newState, oldState) {
    // 미들웨어 실행
    for (const middleware of this.middleware) {
      middleware(changedPath, newState, oldState);
    }
    
    // 경로별 리스너 실행
    for (const [path, listeners] of this.listeners) {
      if (this.isPathAffected(changedPath, path)) {
        const newValue = this.getNestedValue(newState, path);
        const oldValue = this.getNestedValue(oldState, path);
        
        for (const listener of listeners) {
          try {
            listener.callback(newValue, newState, oldValue, oldState);
          } catch (error) {
            console.error('State listener error:', error);
          }
        }
      }
    }
  }
  
  /**
   * 중첩된 값 가져오기
   */
  getNestedValue(obj, path) {
    if (!path) return obj;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
  
  /**
   * 중첩된 값 설정하기
   */
  setNestedValue(obj, path, value) {
    if (!path) return;
    
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }
  
  /**
   * 경로가 영향을 받는지 확인
   */
  isPathAffected(changedPath, listenerPath) {
    if (!changedPath || !listenerPath) return true;
    
    // 정확한 경로 매치
    if (changedPath === listenerPath) return true;
    
    // 부모 경로 매치 (listenerPath가 changedPath의 부모인 경우)
    if (changedPath.startsWith(listenerPath + '.')) return true;
    
    // 자식 경로 매치 (changedPath가 listenerPath의 부모인 경우)
    if (listenerPath.startsWith(changedPath + '.')) return true;
    
    return false;
  }
  
  /**
   * 깊은 병합
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  /**
   * ID 생성
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * 상태 초기화
   */
  reset() {
    this.state = { ...globalState };
    this.listeners.clear();
    this.middleware = [];
  }
  
  /**
   * 상태 백업
   */
  backup() {
    return JSON.parse(JSON.stringify(this.state));
  }
  
  /**
   * 상태 복원
   */
  restore(backup) {
    this.state = JSON.parse(JSON.stringify(backup));
    this.notifyListeners(null, this.state, {});
  }
}

/**
 * 전역 상태 관리자 인스턴스
 */
export const stateManager = new StateManager();

/**
 * 상태 초기화 함수
 */
export function initializeState() {
  console.log('🔧 상태 관리 시스템 초기화...');
  
  // 온라인/오프라인 상태 감지
  window.addEventListener('online', () => {
    stateManager.setState('app.isOnline', true);
  });
  
  window.addEventListener('offline', () => {
    stateManager.setState('app.isOnline', false);
  });
  
  // 활동 감지
  const updateActivity = () => {
    stateManager.setState('app.lastActivity', Date.now());
  };
  
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, updateActivity, true);
  });
  
  // 에러 로깅 미들웨어
  stateManager.addMiddleware((path, newState, oldState) => {
    if (path && path.includes('error')) {
      console.error('State error:', path, newState);
    }
  });
  
  console.log('✅ 상태 관리 시스템 초기화 완료');
}

/**
 * 편의 함수들
 */
export const state = {
  // 사용자 상태
  getUser: () => stateManager.getState('user'),
  setUser: (user) => stateManager.setState('user', user),
  isAuthenticated: () => stateManager.getState('user.isAuthenticated'),
  
  // 채팅 상태
  getChat: () => stateManager.getState('chat'),
  setChat: (chat) => stateManager.setState('chat', chat),
  addMessage: (message) => {
    const messages = stateManager.getState('chat.messages') || [];
    stateManager.setState('chat.messages', [...messages, message]);
  },
  clearMessages: () => stateManager.setState('chat.messages', []),
  
  // UI 상태
  getUI: () => stateManager.getState('ui'),
  setUI: (ui) => stateManager.setState('ui', ui),
  setLoading: (loading) => stateManager.setState('ui.isLoading', loading),
  setModal: (modal) => stateManager.setState('ui.activeModal', modal),
  
  // 관리자 상태
  getAdmin: () => stateManager.getState('admin'),
  setAdmin: (admin) => stateManager.setState('admin', admin),
  setIndexingStatus: (status) => stateManager.setState('admin.indexingStatus', status)
};

// 기본 export
export default stateManager;