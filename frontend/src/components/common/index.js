/**
 * 공통 컴포넌트 export
 */

// 기본 컴포넌트들
export { Button, ButtonFactory, ButtonGroup } from './Button.js';
export { Modal, ConfirmModal, AlertModal, LoadingModal, ModalFactory, ModalManager } from './Modal.js';
export { ToggleSwitch, ToggleFactory } from './ToggleSwitch.js';

// 컴포넌트 팩토리
export class ComponentFactory {
  /**
   * 기본 버튼 생성
   */
  static primaryButton(text, options = {}) {
    return new Button({ text, type: 'primary', ...options });
  }
  
  /**
   * 보조 버튼 생성
   */
  static secondaryButton(text, options = {}) {
    return new Button({ text, type: 'secondary', ...options });
  }
  
  /**
   * 토글 스위치 생성
   */
  static switch(label, options = {}) {
    return new ToggleSwitch({ label, ...options });
  }
  
  /**
   * 확인 모달 생성
   */
  static confirmModal(title, options = {}) {
    return new ConfirmModal({ title, ...options });
  }
  
  /**
   * 알림 모달 생성
   */
  static alertModal(message, options = {}) {
    return new AlertModal({ message, ...options });
  }
}

// 컴포넌트 매니저
export class ComponentManager {
  constructor() {
    this.components = new Map();
    this.modal = new ModalManager();
  }
  
  /**
   * 컴포넌트 등록
   */
  register(name, component) {
    this.components.set(name, component);
    return component;
  }
  
  /**
   * 컴포넌트 조회
   */
  get(name) {
    return this.components.get(name);
  }
  
  /**
   * 컴포넌트 제거
   */
  remove(name) {
    const component = this.components.get(name);
    if (component && component.destroy) {
      component.destroy();
    }
    return this.components.delete(name);
  }
  
  /**
   * 모든 컴포넌트 정리
   */
  cleanup() {
    this.components.forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
    this.components.clear();
    this.modal.removeAll();
  }
}

// 전역 컴포넌트 매니저
export const componentManager = new ComponentManager();

// 컴포넌트 초기화 함수
export function initializeComponents(options = {}) {
  // 기본 설정
  const defaults = {
    theme: 'dark',
    locale: 'ko',
    animations: {
      enabled: true,
      duration: 300
    }
  };
  
  const config = { ...defaults, ...options };
  
  // 테마 적용
  document.body.className = `theme-${config.theme}`;
  
  // 애니메이션 설정
  if (!config.animations.enabled) {
    document.body.classList.add('no-animations');
  }
  
  console.log('✅ 컴포넌트 시스템 초기화 완료:', config);
}