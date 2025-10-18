/**
 * 관리자 컴포넌트 인덱스
 * Like-Opt 프론트엔드 관리자 컴포넌트 모음
 */

// 관리자 컴포넌트들
export { AdminLogin } from './AdminLogin.js';
export { AdminPanel } from './AdminPanel.js';
export { SystemManagement } from './SystemManagement.js';
export { UserManagement } from './UserManagement.js';
export { PerformanceMonitor } from './PerformanceMonitor.js';

// 관리자 컴포넌트 팩토리
export const AdminComponentFactory = {
  /**
   * 관리자 로그인 생성
   */
  createAdminLogin: (options = {}) => {
    return new AdminLogin(options);
  },

  /**
   * 관리자 패널 생성
   */
  createAdminPanel: (options = {}) => {
    return new AdminPanel(options);
  },

  /**
   * 시스템 관리 생성
   */
  createSystemManagement: (options = {}) => {
    return new SystemManagement(options);
  },

  /**
   * 사용자 관리 생성
   */
  createUserManagement: (options = {}) => {
    return new UserManagement(options);
  },

  /**
   * 성능 모니터링 생성
   */
  createPerformanceMonitor: (options = {}) => {
    return new PerformanceMonitor(options);
  }
};

// 관리자 컴포넌트 매니저
export const AdminComponentManager = {
  instances: new Map(),
  
  /**
   * 관리자 컴포넌트 등록
   */
  register: (id, component) => {
    this.instances.set(id, component);
  },
  
  /**
   * 관리자 컴포넌트 가져오기
   */
  get: (id) => {
    return this.instances.get(id);
  },
  
  /**
   * 모든 관리자 컴포넌트 가져오기
   */
  getAll: () => {
    return Array.from(this.instances.values());
  },
  
  /**
   * 관리자 로그인 컴포넌트 가져오기
   */
  getAdminLogin: (id) => {
    return this.instances.get(`admin-login-${id}`);
  },
  
  /**
   * 관리자 패널 컴포넌트 가져오기
   */
  getAdminPanel: (id) => {
    return this.instances.get(`admin-panel-${id}`);
  },
  
  /**
   * 모든 관리자 컴포넌트 정리
   */
  cleanup: () => {
    for (const [key, component] of this.instances) {
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    }
    this.instances.clear();
  }
};

// 기본 export
export default {
  AdminComponentFactory,
  AdminComponentManager
};
