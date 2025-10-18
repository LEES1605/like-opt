/**
 * 관리자 로그인 컴포넌트
 * Like-Opt 프론트엔드 관리자 로그인 컴포넌트
 */

import { BaseComponent } from '../base/BaseComponent.js';
import { adminService } from '../../services/adminService.js';
import { eventBus, AppEvents } from '../../utils/events.js';

/**
 * 관리자 로그인 컴포넌트 클래스
 */
export class AdminLogin extends BaseComponent {
  constructor(options = {}) {
    super({
      className: 'admin-login',
      ...options
    });
    
    this.onLoginSuccess = options.onLoginSuccess || (() => {});
    this.onLoginError = options.onLoginError || (() => {});
    this.autoFocus = options.autoFocus !== false;
    this.rememberPassword = options.rememberPassword || false;
  }
  
  /**
   * 상태 설정
   */
  setupState() {
    this.state = {
      password: '',
      isLoading: false,
      error: null,
      showPassword: false,
      rememberPassword: this.rememberPassword,
      isLoggedIn: false
    };
  }
  
  /**
   * 이벤트 설정
   */
  setupEvents() {
    this.events = {
      'submit .admin-login-form': (event) => this.handleSubmit(event),
      'input .password-input': (event) => this.handlePasswordInput(event),
      'click .toggle-password': (event) => this.handleTogglePassword(event),
      'click .login-button': (event) => this.handleLoginClick(event),
      'keydown .password-input': (event) => this.handleKeyDown(event),
      ...this.events
    };
  }
  
  /**
   * 템플릿 렌더링
   */
  renderTemplate() {
    const { password, isLoading, error, showPassword, rememberPassword, isLoggedIn } = this.state;
    
    if (isLoggedIn) {
      return this.renderLoggedInState();
    }
    
    return `
      <div class="admin-login-container">
        <div class="admin-login-header">
          <h2 class="admin-login-title">관리자 로그인</h2>
          <p class="admin-login-subtitle">시스템 관리자 권한이 필요합니다</p>
        </div>
        
        <form class="admin-login-form" novalidate>
          <div class="admin-login-body">
            ${error ? this.renderError(error) : ''}
            
            <div class="form-group">
              <label for="admin-password" class="form-label">관리자 비밀번호</label>
              <div class="password-input-container">
                <input
                  type="${showPassword ? 'text' : 'password'}"
                  id="admin-password"
                  class="password-input"
                  placeholder="비밀번호를 입력하세요"
                  value="${password}"
                  ${isLoading ? 'disabled' : ''}
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  class="toggle-password"
                  ${isLoading ? 'disabled' : ''}
                  title="${showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}"
                >
                  ${showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  class="remember-checkbox"
                  ${rememberPassword ? 'checked' : ''}
                  ${isLoading ? 'disabled' : ''}
                />
                <span class="checkbox-text">비밀번호 기억하기</span>
              </label>
            </div>
          </div>
          
          <div class="admin-login-footer">
            <button
              type="submit"
              class="login-button ${isLoading ? 'loading' : ''}"
              ${isLoading ? 'disabled' : ''}
            >
              ${isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>
        </form>
      </div>
    `;
  }
  
  /**
   * 로그인된 상태 렌더링
   */
  renderLoggedInState() {
    return `
      <div class="admin-login-container logged-in">
        <div class="admin-login-header">
          <h2 class="admin-login-title">관리자 로그인됨</h2>
          <p class="admin-login-subtitle">시스템 관리자 권한으로 접근 중입니다</p>
        </div>
        
        <div class="admin-login-body">
          <div class="login-success">
            <div class="success-icon">✅</div>
            <p class="success-message">관리자 로그인이 완료되었습니다.</p>
          </div>
        </div>
        
        <div class="admin-login-footer">
          <button type="button" class="logout-button">
            로그아웃
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * 에러 렌더링
   */
  renderError(error) {
    return `
      <div class="admin-login-error">
        <div class="error-icon">⚠️</div>
        <div class="error-content">
          <h4 class="error-title">로그인 실패</h4>
          <p class="error-message">${error}</p>
        </div>
      </div>
    `;
  }
  
  /**
   * 폼 제출 이벤트 처리
   */
  async handleSubmit(event) {
    event.preventDefault();
    
    const { password, isLoading } = this.state;
    
    if (isLoading || !password.trim()) {
      return;
    }
    
    await this.performLogin(password);
  }
  
  /**
   * 비밀번호 입력 이벤트 처리
   */
  handlePasswordInput(event) {
    this.setState({ 
      password: event.target.value,
      error: null 
    });
  }
  
  /**
   * 비밀번호 표시/숨기기 토글
   */
  handleTogglePassword(event) {
    event.preventDefault();
    this.setState({ showPassword: !this.state.showPassword });
  }
  
  /**
   * 로그인 버튼 클릭 이벤트 처리
   */
  async handleLoginClick(event) {
    event.preventDefault();
    
    const { password, isLoading } = this.state;
    
    if (isLoading || !password.trim()) {
      return;
    }
    
    await this.performLogin(password);
  }
  
  /**
   * 키보드 이벤트 처리
   */
  handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleSubmit(event);
    }
  }
  
  /**
   * 로그인 수행
   */
  async performLogin(password) {
    this.setState({ isLoading: true, error: null });
    
    try {
      const result = await adminService.login(password);
      
      if (result.success) {
        this.setState({ 
          isLoading: false, 
          isLoggedIn: true,
          error: null 
        });
        
        // 비밀번호 기억하기 처리
        if (this.state.rememberPassword) {
          this.savePassword(password);
        } else {
          this.clearSavedPassword();
        }
        
        // 이벤트 발생
        eventBus.emit(AppEvents.ADMIN_LOGIN, {
          timestamp: new Date(),
          rememberPassword: this.state.rememberPassword
        });
        
        // 성공 콜백 호출
        this.onLoginSuccess(result);
        
        console.log('✅ 관리자 로그인 성공');
        
      } else {
        throw new Error(result.message || '로그인에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('❌ 관리자 로그인 실패:', error);
      
      this.setState({ 
        isLoading: false, 
        error: error.message || '로그인 중 오류가 발생했습니다.' 
      });
      
      // 에러 콜백 호출
      this.onLoginError(error);
      
    }
  }
  
  /**
   * 로그아웃 수행
   */
  async performLogout() {
    try {
      await adminService.logout();
      
      this.setState({ 
        isLoggedIn: false,
        password: '',
        error: null 
      });
      
      // 이벤트 발생
      eventBus.emit(AppEvents.ADMIN_LOGOUT, {
        timestamp: new Date()
      });
      
      console.log('✅ 관리자 로그아웃 성공');
      
    } catch (error) {
      console.error('❌ 관리자 로그아웃 실패:', error);
      
      this.setState({ 
        error: '로그아웃 중 오류가 발생했습니다.' 
      });
    }
  }
  
  /**
   * 비밀번호 저장
   */
  savePassword(password) {
    try {
      localStorage.setItem('admin_password', password);
    } catch (error) {
      console.warn('비밀번호 저장 실패:', error);
    }
  }
  
  /**
   * 저장된 비밀번호 삭제
   */
  clearSavedPassword() {
    try {
      localStorage.removeItem('admin_password');
    } catch (error) {
      console.warn('저장된 비밀번호 삭제 실패:', error);
    }
  }
  
  /**
   * 저장된 비밀번호 가져오기
   */
  getSavedPassword() {
    try {
      return localStorage.getItem('admin_password');
    } catch (error) {
      console.warn('저장된 비밀번호 가져오기 실패:', error);
      return null;
    }
  }
  
  /**
   * 비밀번호 설정
   */
  setPassword(password) {
    this.setState({ password });
  }
  
  /**
   * 에러 설정
   */
  setError(error) {
    this.setState({ error });
  }
  
  /**
   * 로딩 상태 설정
   */
  setLoading(loading) {
    this.setState({ isLoading: loading });
  }
  
  /**
   * 로그인 상태 확인
   */
  async checkLoginStatus() {
    try {
      // 실제 구현에서는 API를 통해 로그인 상태 확인
      const isLoggedIn = await adminService.isLoggedIn();
      this.setState({ isLoggedIn });
      return isLoggedIn;
    } catch (error) {
      console.error('로그인 상태 확인 실패:', error);
      return false;
    }
  }
  
  /**
   * 자동 로그인 시도
   */
  async tryAutoLogin() {
    const savedPassword = this.getSavedPassword();
    
    if (savedPassword && this.state.rememberPassword) {
      await this.performLogin(savedPassword);
    }
  }
  
  /**
   * 컴포넌트 마운트 시 실행
   */
  async onMount() {
    // 자동 포커스
    if (this.autoFocus) {
      const passwordInput = this.element?.querySelector('.password-input');
      if (passwordInput) {
        passwordInput.focus();
      }
    }
    
    // 로그인 상태 확인
    await this.checkLoginStatus();
    
    // 자동 로그인 시도
    await this.tryAutoLogin();
  }
  
  /**
   * 컴포넌트 언마운트 시 실행
   */
  onUnmount() {
    // 정리 작업
  }
}

// 관리자 로그인 팩토리
export class AdminLoginFactory {
  static create(options = {}) {
    return new AdminLogin(options);
  }
  
  static createWithAutoLogin(options = {}) {
    return new AdminLogin({
      rememberPassword: true,
      autoFocus: true,
      ...options
    });
  }
}

// 관리자 로그인 매니저
export class AdminLoginManager {
  static instances = new Map();
  
  static register(id, login) {
    this.instances.set(id, login);
  }
  
  static get(id) {
    return this.instances.get(id);
  }
  
  static getAll() {
    return Array.from(this.instances.values());
  }
  
  static async loginAll(password) {
    const results = await Promise.allSettled(
      this.getAll().map(login => login.performLogin(password))
    );
    return results;
  }
  
  static async logoutAll() {
    const results = await Promise.allSettled(
      this.getAll().map(login => login.performLogout())
    );
    return results;
  }
  
  static cleanup() {
    this.instances.clear();
  }
}

