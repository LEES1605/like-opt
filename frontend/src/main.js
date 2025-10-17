/**
 * MAIC Flask Optimized - Demo Application
 * 재사용 가능한 컴포넌트 시스템 데모
 */

// 컴포넌트 임포트
import { 
  Button, 
  Modal, 
  ToggleSwitch, 
  ComponentFactory,
  ComponentManager,
  initializeComponents 
} from './components/common/index.js';

// 유틸리티 임포트
import { globalState, initializeState } from './utils/state.js';
import { eventBus, AppEvents, setupGlobalEventHandlers } from './utils/events.js';
import { apiClient } from './services/api.js';

/**
 * 데모 애플리케이션 클래스
 */
class MAICDemoApp {
  constructor() {
    // 컴포넌트 인스턴스들
    this.components = new Map();
    
    // 앱 상태
    this.isInitialized = false;
    
    // 초기화
    this.init();
  }
  
  /**
   * 데모 애플리케이션 초기화
   */
  async init() {
    try {
      console.log('🚀 MAIC Flask Optimized 데모 초기화 시작...');
      
      // 컴포넌트 시스템 초기화
      initializeComponents({
        theme: 'dark',
        locale: 'ko',
        animations: {
          enabled: true,
          duration: 300
        }
      });
      
      // 상태 관리 초기화
      initializeState();
      
      // 전역 이벤트 핸들러 설정
      setupGlobalEventHandlers();
      
      // 이벤트 리스너 설정
      this.setupEventListeners();
      
      // 데모 컴포넌트 생성
      await this.createDemoComponents();
      
      // API 상태 확인
      this.checkApiStatus();
      
      this.isInitialized = true;
      console.log('✅ MAIC Flask Optimized 데모 초기화 완료');
      
      // 로딩 숨기기
      this.hideLoading();
      
    } catch (error) {
      console.error('❌ 데모 초기화 실패:', error);
      this.showError('데모를 초기화하는 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 전역 이벤트
    eventBus.on(AppEvents.TOGGLE_CHANGE, (data) => this.handleToggleChange(data));
    eventBus.on(AppEvents.BUTTON_CLICK, (data) => this.handleButtonClick(data));
    
    // 키보드 단축키
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardShortcuts(event);
    });
    
    // 윈도우 이벤트
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }
  
  /**
   * 데모 컴포넌트 생성
   */
  async createDemoComponents() {
    // 버튼 데모 생성
    this.createButtonDemo();
    
    // 토글 스위치 데모 생성
    this.createToggleDemo();
    
    // 모달 데모 생성
    this.createModalDemo();
    
    // 앱 표시
    document.getElementById('app').style.display = 'block';
  }
  
  /**
   * 버튼 데모 생성
   */
  createButtonDemo() {
    const buttonDemo = document.getElementById('button-demo');
    const buttonStateDemo = document.getElementById('button-state-demo');
    
    // 기본 버튼들
    const primaryBtn = ComponentFactory.primaryButton('Primary Button', {
      onClick: () => this.showAlert('Primary Button 클릭됨!')
    });
    
    const secondaryBtn = ComponentFactory.secondaryButton('Secondary Button', {
      onClick: () => this.showAlert('Secondary Button 클릭됨!')
    });
    
    buttonDemo.appendChild(primaryBtn.render());
    buttonDemo.appendChild(secondaryBtn.render());
    
    // 상태 버튼들
    const disabledBtn = ComponentFactory.primaryButton('Disabled Button', {
      disabled: true
    });
    
    const loadingBtn = ComponentFactory.primaryButton('Loading Button', {
      loading: true
    });
    
    buttonStateDemo.appendChild(disabledBtn.render());
    buttonStateDemo.appendChild(loadingBtn.render());
  }
  
  /**
   * 토글 스위치 데모 생성
   */
  createToggleDemo() {
    const professorGToggle = document.getElementById('professor-g-toggle');
    const modeToggles = document.getElementById('mode-toggles');
    
    // Professor G 토글
    const profToggle = ComponentFactory.switch('Professor G 활성화', {
      checked: true,
      onChange: (checked) => this.handleProfessorGToggle(checked)
    });
    
    professorGToggle.appendChild(profToggle.render());
    
    // 학습 모드 토글들
    const grammarToggle = ComponentFactory.switch('문법 학습', {
      checked: true,
      onChange: (checked) => this.handleModeToggle('grammar', checked)
    });
    
    const sentenceToggle = ComponentFactory.switch('문장분석', {
      checked: true,
      onChange: (checked) => this.handleModeToggle('sentence', checked)
    });
    
    const passageToggle = ComponentFactory.switch('지문설명', {
      checked: true,
      onChange: (checked) => this.handleModeToggle('passage', checked)
    });
    
    modeToggles.appendChild(grammarToggle.render());
    modeToggles.appendChild(sentenceToggle.render());
    modeToggles.appendChild(passageToggle.render());
  }
  
  /**
   * 모달 데모 생성
   */
  createModalDemo() {
    const modalDemo = document.getElementById('modal-demo');
    
    // 알림 모달 버튼
    const alertBtn = ComponentFactory.primaryButton('알림 모달', {
      onClick: () => this.showAlertModal()
    });
    
    // 확인 모달 버튼
    const confirmBtn = ComponentFactory.secondaryButton('확인 모달', {
      onClick: () => this.showConfirmModal()
    });
    
    modalDemo.appendChild(alertBtn.render());
    modalDemo.appendChild(confirmBtn.render());
  }
  
  /**
   * Professor G 토글 처리
   */
  handleProfessorGToggle(enabled) {
    console.log('Professor G:', enabled ? '활성화' : '비활성화');
    
    const statusElement = document.getElementById('professor-g-status');
    if (statusElement) {
      statusElement.textContent = `Professor G: ${enabled ? '활성화' : '비활성화'}`;
    }
  }
  
  /**
   * 모드 토글 처리
   */
  handleModeToggle(mode, enabled) {
    console.log(`${mode} 모드:`, enabled ? '활성화' : '비활성화');
    
    // 활성화된 모드들 계산
    const activeModes = [];
    const toggles = document.querySelectorAll('#mode-toggles input[type="checkbox"]:checked');
    toggles.forEach(toggle => {
      const label = toggle.parentElement.parentElement.querySelector('label');
      if (label) {
        activeModes.push(label.textContent);
      }
    });
    
    const statusElement = document.getElementById('mode-status');
    if (statusElement) {
      statusElement.textContent = `학습 모드: ${activeModes.length > 0 ? activeModes.join(', ') : '없음'}`;
    }
  }
  
  /**
   * 알림 모달 표시
   */
  showAlertModal() {
    const modal = ComponentFactory.alertModal('이것은 알림 모달입니다!', {
      title: '알림'
    });
    modal.show();
  }
  
  /**
   * 확인 모달 표시
   */
  showConfirmModal() {
    const modal = ComponentFactory.confirmModal('정말로 진행하시겠습니까?', {
      title: '확인',
      onConfirm: () => this.showAlert('확인되었습니다!'),
      onCancel: () => this.showAlert('취소되었습니다.')
    });
    modal.show();
  }
  
  /**
   * 간단한 알림 표시
   */
  showAlert(message) {
    alert(message);
  }
  
  /**
   * API 상태 확인
   */
  async checkApiStatus() {
    try {
      const response = await apiClient.get('/health');
      const statusElement = document.getElementById('api-status');
      if (statusElement) {
        statusElement.textContent = 'API 상태: 연결됨';
        statusElement.style.background = 'rgba(16, 185, 129, 0.2)';
        statusElement.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        statusElement.style.color = '#10b981';
      }
    } catch (error) {
      const statusElement = document.getElementById('api-status');
      if (statusElement) {
        statusElement.textContent = 'API 상태: 연결 실패';
        statusElement.style.background = 'rgba(239, 68, 68, 0.2)';
        statusElement.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        statusElement.style.color = '#ef4444';
      }
    }
  }

  /**
   * 로딩 표시
   */
  showLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
      spinner.style.display = 'block';
    }
  }
  
  /**
   * 로딩 숨기기
   */
  hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
      spinner.style.display = 'none';
    }
  }
  
  /**
   * 에러 표시
   */
  showError(message) {
    console.error('App Error:', message);
    
    const errorBoundary = document.getElementById('error-boundary');
    const errorMessage = document.getElementById('error-message');
    
    if (errorBoundary && errorMessage) {
      errorMessage.textContent = message;
      errorBoundary.style.display = 'block';
    }
  }
  
  /**
   * 키보드 단축키 처리
   */
  handleKeyboardShortcuts(event) {
    // ESC: 모든 모달 닫기
    if (event.key === 'Escape') {
      componentManager.modal.hideAll();
    }
  }
  
  /**
   * 토글 변경 처리
   */
  handleToggleChange(data) {
    console.log('Toggle changed:', data);
  }
  
  /**
   * 버튼 클릭 처리
   */
  handleButtonClick(data) {
    console.log('Button clicked:', data);
  }
  
  /**
   * 정리 작업
   */
  cleanup() {
    console.log('🧹 앱 정리 중...');
    componentManager.cleanup();
    console.log('✅ 앱 정리 완료');
  }
}

/**
 * 앱 시작
 */
document.addEventListener('DOMContentLoaded', () => {
  // 전역 앱 인스턴스
  window.maicDemoApp = new MAICDemoApp();
});

/**
 * 에러 핸들링
 */
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  const errorBoundary = document.getElementById('error-boundary');
  const errorMessage = document.getElementById('error-message');
  
  if (errorBoundary && errorMessage) {
    errorMessage.textContent = event.error.message || '알 수 없는 오류가 발생했습니다.';
    errorBoundary.style.display = 'block';
  }
});

/**
 * 페이지 새로고침 버튼
 */
document.getElementById('reload-button')?.addEventListener('click', () => {
  window.location.reload();
});

// 기본 export
export default MAICDemoApp;