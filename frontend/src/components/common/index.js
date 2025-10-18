/**
 * 공통 컴포넌트 인덱스
 * Like-Opt 프론트엔드 공통 컴포넌트 모음
 */

// 기본 컴포넌트
export { BaseComponent } from '../base/BaseComponent.js';

// 공통 컴포넌트들
export { Button, ButtonFactory, ButtonManager } from './Button.js';
export { Modal, ModalFactory, ModalManager, ConfirmModal, AlertModal, LoadingModal } from './Modal.js';
export { ToggleSwitch, ToggleFactory, ToggleManager, ToggleGroup } from './ToggleSwitch.js';

// 컴포넌트 팩토리 (편의 함수들)
export const ComponentFactory = {
  // 버튼 팩토리
  primaryButton: (text, options = {}) => {
    return ButtonFactory.create('primary', text, options);
  },
  
  secondaryButton: (text, options = {}) => {
    return ButtonFactory.create('secondary', text, options);
  },
  
  dangerButton: (text, options = {}) => {
    return ButtonFactory.create('danger', text, options);
  },
  
  // 모달 팩토리
  alertModal: (message, options = {}) => {
    return new AlertModal(message, options);
  },
  
  confirmModal: (message, options = {}) => {
    return new ConfirmModal(message, options);
  },
  
  loadingModal: (message = '로딩 중...', options = {}) => {
    return new LoadingModal(message, options);
  },
  
  // 토글 팩토리
  switch: (label, options = {}) => {
    return ToggleFactory.create('switch', label, options);
  },
  
  checkbox: (label, options = {}) => {
    return ToggleFactory.create('checkbox', label, options);
  }
};

// 컴포넌트 매니저 (전역 관리)
export const ComponentManager = {
  // 버튼 매니저
  button: {
    create: (type, text, options = {}) => {
      return ButtonFactory.create(type, text, options);
    },
    
    getById: (id) => {
      return ButtonManager.getById(id);
    },
    
    getAll: () => {
      return ButtonManager.getAll();
    },
    
    cleanup: () => {
      return ButtonManager.cleanup();
    }
  },
  
  // 모달 매니저
  modal: {
    create: (type, content, options = {}) => {
      return ModalFactory.create(type, content, options);
    },
    
    show: (modal) => {
      if (modal && typeof modal.show === 'function') {
        modal.show();
      }
    },
    
    hide: (modal) => {
      if (modal && typeof modal.hide === 'function') {
        modal.hide();
      }
    },
    
    hideAll: () => {
      return ModalManager.hideAll();
    },
    
    getActive: () => {
      return ModalManager.getActive();
    }
  },
  
  // 토글 매니저
  toggle: {
    create: (type, label, options = {}) => {
      return ToggleFactory.create(type, label, options);
    },
    
    getById: (id) => {
      return ToggleManager.getById(id);
    },
    
    getAll: () => {
      return ToggleManager.getAll();
    },
    
    cleanup: () => {
      return ToggleManager.cleanup();
    }
  },
  
  // 전체 정리
  cleanup: () => {
    ButtonManager.cleanup();
    ModalManager.hideAll();
    ToggleManager.cleanup();
  }
};

// 컴포넌트 초기화 함수
export function initializeComponents(options = {}) {
  console.log('🔧 컴포넌트 시스템 초기화...');
  
  const defaultOptions = {
    theme: 'dark',
    locale: 'ko',
    animations: {
      enabled: true,
      duration: 300
    },
    ...options
  };
  
  // 전역 컴포넌트 옵션 설정
  if (typeof window !== 'undefined') {
    window.ComponentOptions = defaultOptions;
  }
  
  // CSS 변수 설정
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--component-theme', defaultOptions.theme);
    root.style.setProperty('--animation-duration', `${defaultOptions.animations.duration}ms`);
  }
  
  console.log('✅ 컴포넌트 시스템 초기화 완료', defaultOptions);
}

// 기본 export
export default {
  ComponentFactory,
  ComponentManager,
  initializeComponents
};