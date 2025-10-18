/**
 * 상태 관리 시스템 단위 테스트
 */

import { StateManager, StateActions } from '../../../src/store/state.js';

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('기본 기능', () => {
    test('초기 상태 확인', () => {
      const state = stateManager.getState();
      
      expect(state.user.isAuthenticated).toBe(false);
      expect(state.chat.currentMode).toBe('grammar');
      expect(state.admin.isLoggedIn).toBe(false);
      expect(state.ui.theme).toBe('dark');
    });

    test('상태 조회 (전체)', () => {
      const state = stateManager.getState();
      expect(typeof state).toBe('object');
      expect(state).toHaveProperty('user');
      expect(state).toHaveProperty('chat');
      expect(state).toHaveProperty('admin');
      expect(state).toHaveProperty('ui');
    });

    test('상태 조회 (경로)', () => {
      const userState = stateManager.getState('user');
      expect(userState.isAuthenticated).toBe(false);
      
      const chatMode = stateManager.getState('chat.currentMode');
      expect(chatMode).toBe('grammar');
    });
  });

  describe('상태 업데이트', () => {
    test('단순 상태 업데이트', () => {
      const result = stateManager.setState('user.isAuthenticated', true);
      
      expect(result).toBe(true);
      expect(stateManager.getState('user.isAuthenticated')).toBe(true);
    });

    test('중첩 상태 업데이트', () => {
      stateManager.setState('chat', {
        currentMode: 'sentence',
        currentDifficulty: 'advanced',
        conversation: []
      });

      expect(stateManager.getState('chat.currentMode')).toBe('sentence');
      expect(stateManager.getState('chat.currentDifficulty')).toBe('advanced');
    });

    test('미들웨어 차단', () => {
      stateManager.addMiddleware(() => false); // 항상 차단
      
      const result = stateManager.setState('user.isAuthenticated', true);
      
      expect(result).toBe(false);
      expect(stateManager.getState('user.isAuthenticated')).toBe(false);
    });
  });

  describe('리스너 시스템', () => {
    test('리스너 등록 및 호출', () => {
      const callback = jest.fn();
      const unsubscribe = stateManager.subscribe('user.isAuthenticated', callback);

      stateManager.setState('user.isAuthenticated', true);

      expect(callback).toHaveBeenCalledWith(true, 'user.isAuthenticated', false);
      
      unsubscribe();
    });

    test('와일드카드 리스너', () => {
      const callback = jest.fn();
      stateManager.subscribe('user.*', callback);

      stateManager.setState('user.isAuthenticated', true);
      stateManager.setState('user.role', 'admin');

      expect(callback).toHaveBeenCalledTimes(2);
    });

    test('리스너 해제', () => {
      const callback = jest.fn();
      const unsubscribe = stateManager.subscribe('user.isAuthenticated', callback);

      unsubscribe();
      stateManager.setState('user.isAuthenticated', true);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('미들웨어', () => {
    test('미들웨어 등록 및 실행', () => {
      const middleware = jest.fn().mockReturnValue(true);
      stateManager.addMiddleware(middleware);

      stateManager.setState('user.isAuthenticated', true);

      expect(middleware).toHaveBeenCalledWith('user.isAuthenticated', true, false);
    });

    test('미들웨어에서 상태 변경 차단', () => {
      const middleware = jest.fn().mockReturnValue(false);
      stateManager.addMiddleware(middleware);

      const result = stateManager.setState('user.isAuthenticated', true);

      expect(result).toBe(false);
      expect(stateManager.getState('user.isAuthenticated')).toBe(false);
    });
  });

  describe('상태 초기화', () => {
    test('상태 리셋', () => {
      stateManager.setState('user.isAuthenticated', true);
      stateManager.setState('chat.currentMode', 'sentence');

      stateManager.reset();

      expect(stateManager.getState('user.isAuthenticated')).toBe(false);
      expect(stateManager.getState('chat.currentMode')).toBe('grammar');
    });
  });

  describe('상태 백업/복원', () => {
    test('상태 백업', () => {
      stateManager.setState('user.isAuthenticated', true);
      const backup = stateManager.backup();

      expect(backup.user.isAuthenticated).toBe(true);
      expect(backup).not.toBe(stateManager.getState()); // 깊은 복사 확인
    });

    test('상태 복원', () => {
      const backupState = {
        user: { isAuthenticated: true, role: 'admin' },
        chat: { currentMode: 'sentence' },
        admin: { isLoggedIn: true },
        ui: { theme: 'light' }
      };

      stateManager.restore(backupState);

      expect(stateManager.getState('user.isAuthenticated')).toBe(true);
      expect(stateManager.getState('chat.currentMode')).toBe('sentence');
    });
  });
});

describe('StateActions', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('사용자 액션', () => {
    test('setUser', () => {
      const user = { isAuthenticated: true, role: 'admin' };
      StateActions.setUser(stateManager, user);

      expect(stateManager.getState('user')).toEqual(user);
    });

    test('setUserAuthenticated', () => {
      StateActions.setUserAuthenticated(stateManager, true);

      expect(stateManager.getState('user.isAuthenticated')).toBe(true);
    });
  });

  describe('채팅 액션', () => {
    test('setChatMode', () => {
      StateActions.setChatMode(stateManager, 'sentence', 'advanced');

      expect(stateManager.getState('chat.currentMode')).toBe('sentence');
      expect(stateManager.getState('chat.currentDifficulty')).toBe('advanced');
    });

    test('addMessage', () => {
      const message = { role: 'user', content: 'Hello' };
      StateActions.addMessage(stateManager, message);

      const conversation = stateManager.getState('chat.conversation');
      expect(conversation).toHaveLength(1);
      expect(conversation[0]).toEqual(message);
      expect(stateManager.getState('chat.lastMessage')).toEqual(message);
    });

    test('clearConversation', () => {
      StateActions.addMessage(stateManager, { role: 'user', content: 'Hello' });
      StateActions.clearConversation(stateManager);

      expect(stateManager.getState('chat.conversation')).toHaveLength(0);
      expect(stateManager.getState('chat.lastMessage')).toBeNull();
    });

    test('setChatLoading', () => {
      StateActions.setChatLoading(stateManager, true);

      expect(stateManager.getState('chat.isLoading')).toBe(true);
    });

    test('setConnectionStatus', () => {
      StateActions.setConnectionStatus(stateManager, 'connected');

      expect(stateManager.getState('chat.connectionStatus')).toBe('connected');
    });
  });

  describe('관리자 액션', () => {
    test('setAdminLoggedIn', () => {
      StateActions.setAdminLoggedIn(stateManager, true);

      expect(stateManager.getState('admin.isLoggedIn')).toBe(true);
    });

    test('setIndexingStatus', () => {
      const status = { isReady: true, lastScanTime: new Date() };
      StateActions.setIndexingStatus(stateManager, status);

      expect(stateManager.getState('admin.indexingStatus')).toEqual(status);
    });

    test('setBackupList', () => {
      const backups = [{ id: 1, name: 'backup1' }];
      StateActions.setBackupList(stateManager, backups);

      expect(stateManager.getState('admin.backupList')).toEqual(backups);
    });
  });

  describe('UI 액션', () => {
    test('setTheme', () => {
      StateActions.setTheme(stateManager, 'light');

      expect(stateManager.getState('ui.theme')).toBe('light');
    });

    test('setSidebarOpen', () => {
      StateActions.setSidebarOpen(stateManager, true);

      expect(stateManager.getState('ui.sidebarOpen')).toBe(true);
    });

    test('setModalOpen', () => {
      StateActions.setModalOpen(stateManager, 'admin-login');

      expect(stateManager.getState('ui.modalOpen')).toBe('admin-login');
    });

    test('addNotification', () => {
      const notification = { id: 1, message: 'Test notification' };
      StateActions.addNotification(stateManager, notification);

      const notifications = stateManager.getState('ui.notifications');
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toEqual(notification);
    });

    test('removeNotification', () => {
      StateActions.addNotification(stateManager, { id: 1, message: 'Test' });
      StateActions.addNotification(stateManager, { id: 2, message: 'Test2' });
      StateActions.removeNotification(stateManager, 1);

      const notifications = stateManager.getState('ui.notifications');
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe(2);
    });

    test('setLoading', () => {
      StateActions.setLoading(stateManager, true);

      expect(stateManager.getState('ui.loading')).toBe(true);
    });
  });
});
