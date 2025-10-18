/**
 * State Manager - 전역 상태 관리 시스템
 * Like-Opt 프론트엔드 상태 관리
 */

/**
 * 전역 상태 관리자 클래스
 */
export class StateManager {
  constructor() {
    this.state = {
      // 사용자 상태
      user: {
        isAuthenticated: false,
        role: null,
        preferences: {}
      },
      
      // 채팅 상태
      chat: {
        conversation: [],
        currentMode: 'grammar',
        currentDifficulty: 'intermediate',
        isLoading: false,
        connectionStatus: 'disconnected',
        lastMessage: null
      },
      
      // 관리자 상태
      admin: {
        isLoggedIn: false,
        indexingStatus: null,
        backupList: [],
        systemLogs: []
      },
      
      // UI 상태
      ui: {
        theme: 'dark',
        sidebarOpen: false,
        modalOpen: null,
        notifications: [],
        loading: false
      }
    };
    
    this.listeners = [];
    this.middleware = [];
  }

  /**
   * 상태 조회
   */
  getState(path = null) {
    if (path) {
      return this.getNestedValue(this.state, path);
    }
    return { ...this.state };
  }

  /**
   * 상태 업데이트
   */
  setState(path, value) {
    const oldValue = this.getNestedValue(this.state, path);
    
    // 미들웨어 실행
    for (const middleware of this.middleware) {
      const result = middleware(path, value, oldValue);
      if (result === false) {
        return false; // 미들웨어에서 업데이트 차단
      }
    }
    
    this.setNestedValue(this.state, path, value);
    this.notifyListeners(path, value, oldValue);
    return true;
  }

  /**
   * 상태 변경 리스너 등록
   */
  subscribe(path, callback) {
    const listener = { path, callback };
    this.listeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(
        l => l.path !== path || l.callback !== callback
      );
    };
  }

  /**
   * 미들웨어 등록
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * 리스너들에게 변경 알림
   */
  notifyListeners(changedPath, newValue, oldValue) {
    this.listeners.forEach(({ path, callback }) => {
      if (this.pathMatches(path, changedPath)) {
        callback(this.getNestedValue(this.state, path), changedPath, oldValue);
      }
    });
  }

  /**
   * 중첩된 값 조회
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 중첩된 값 설정
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * 경로 매칭 확인
   */
  pathMatches(pattern, path) {
    if (pattern === path) return true;
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return false;
  }

  /**
   * 상태 초기화
   */
  reset() {
    this.state = {
      user: {
        isAuthenticated: false,
        role: null,
        preferences: {}
      },
      chat: {
        conversation: [],
        currentMode: 'grammar',
        currentDifficulty: 'intermediate',
        isLoading: false,
        connectionStatus: 'disconnected',
        lastMessage: null
      },
      admin: {
        isLoggedIn: false,
        indexingStatus: null,
        backupList: [],
        systemLogs: []
      },
      ui: {
        theme: 'dark',
        sidebarOpen: false,
        modalOpen: null,
        notifications: [],
        loading: false
      }
    };
    
    this.notifyListeners('*', this.state, null);
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
  restore(backupState) {
    this.state = JSON.parse(JSON.stringify(backupState));
    this.notifyListeners('*', this.state, null);
  }
}

/**
 * 상태 액션들
 */
export const StateActions = {
  // 사용자 액션
  setUser: (stateManager, user) => {
    stateManager.setState('user', user);
  },
  
  setUserAuthenticated: (stateManager, isAuthenticated) => {
    stateManager.setState('user.isAuthenticated', isAuthenticated);
  },
  
  // 채팅 액션
  setChatMode: (stateManager, mode, difficulty) => {
    stateManager.setState('chat.currentMode', mode);
    stateManager.setState('chat.currentDifficulty', difficulty);
  },
  
  addMessage: (stateManager, message) => {
    const conversation = stateManager.getState('chat.conversation');
    stateManager.setState('chat.conversation', [...conversation, message]);
    stateManager.setState('chat.lastMessage', message);
  },
  
  clearConversation: (stateManager) => {
    stateManager.setState('chat.conversation', []);
    stateManager.setState('chat.lastMessage', null);
  },
  
  setChatLoading: (stateManager, isLoading) => {
    stateManager.setState('chat.isLoading', isLoading);
  },
  
  setConnectionStatus: (stateManager, status) => {
    stateManager.setState('chat.connectionStatus', status);
  },
  
  // 관리자 액션
  setAdminLoggedIn: (stateManager, isLoggedIn) => {
    stateManager.setState('admin.isLoggedIn', isLoggedIn);
  },
  
  setIndexingStatus: (stateManager, status) => {
    stateManager.setState('admin.indexingStatus', status);
  },
  
  setBackupList: (stateManager, backups) => {
    stateManager.setState('admin.backupList', backups);
  },
  
  // UI 액션
  setTheme: (stateManager, theme) => {
    stateManager.setState('ui.theme', theme);
  },
  
  setSidebarOpen: (stateManager, isOpen) => {
    stateManager.setState('ui.sidebarOpen', isOpen);
  },
  
  setModalOpen: (stateManager, modalName) => {
    stateManager.setState('ui.modalOpen', modalName);
  },
  
  addNotification: (stateManager, notification) => {
    const notifications = stateManager.getState('ui.notifications');
    stateManager.setState('ui.notifications', [...notifications, notification]);
  },
  
  removeNotification: (stateManager, id) => {
    const notifications = stateManager.getState('ui.notifications');
    stateManager.setState('ui.notifications', notifications.filter(n => n.id !== id));
  },
  
  setLoading: (stateManager, loading) => {
    stateManager.setState('ui.loading', loading);
  }
};

// 전역 상태 관리자 인스턴스
export const stateManager = new StateManager();

// 기본 미들웨어 등록
stateManager.addMiddleware((path, value, oldValue) => {
  // 로깅 미들웨어
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 State Change: ${path}`, { oldValue, newValue: value });
  }
  return true;
});

// 상태 변경 감지 미들웨어
stateManager.addMiddleware((path, value, oldValue) => {
  // 특정 상태 변경 시 추가 작업
  if (path === 'chat.conversation') {
    // 대화 기록이 변경되면 로컬 스토리지에 저장
    localStorage.setItem('like-opt-conversation', JSON.stringify(value));
  }
  
  if (path === 'user.isAuthenticated') {
    // 인증 상태 변경 시 관련 상태 초기화
    if (!value) {
      stateManager.setState('admin.isLoggedIn', false);
    }
  }
  
  return true;
});

// 초기화 함수
export function initializeState() {
  // 로컬 스토리지에서 대화 기록 복원
  try {
    const savedConversation = localStorage.getItem('like-opt-conversation');
    if (savedConversation) {
      const conversation = JSON.parse(savedConversation);
      stateManager.setState('chat.conversation', conversation);
    }
  } catch (error) {
    console.error('대화 기록 복원 실패:', error);
  }
  
  // 테마 설정 복원
  const savedTheme = localStorage.getItem('like-opt-theme');
  if (savedTheme) {
    stateManager.setState('ui.theme', savedTheme);
  }
  
  console.log('✅ 상태 관리 시스템 초기화 완료');
}

// 전역 상태 객체 (하위 호환성)
export const globalState = {
  get: (path) => stateManager.getState(path),
  set: (path, value) => stateManager.setState(path, value),
  subscribe: (path, callback) => stateManager.subscribe(path, callback)
};
