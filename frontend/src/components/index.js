// src/components/index.js
// 모든 컴포넌트를 한 곳에서 export

// Base Component
export { BaseComponent, componentRegistry, ComponentManager, initializeComponents } from './base/BaseComponent.js';

// Common Components
export { Button, ButtonFactory, ButtonGroup } from './common/Button.js';
export { Modal, ModalFactory, ModalManager } from './common/Modal.js';
export { ToggleSwitch } from './common/ToggleSwitch.js';

// Medal Components
export { Medal } from './medals/Medal.js';

// 통합 팩토리
export const ComponentFactory = {
  // Button 팩토리 함수들
  primaryButton: (text, options = {}) => new Button({ text, type: 'primary', ...options }),
  secondaryButton: (text, options = {}) => new Button({ text, type: 'secondary', ...options }),
  successButton: (text, options = {}) => new Button({ text, type: 'success', ...options }),
  warningButton: (text, options = {}) => new Button({ text, type: 'warning', ...options }),
  dangerButton: (text, options = {}) => new Button({ text, type: 'danger', ...options }),
  linkButton: (text, options = {}) => new Button({ text, type: 'link', ...options }),
  iconButton: (icon, options = {}) => new Button({ icon, text: '', ...options }),
  blockButton: (text, options = {}) => new Button({ text, block: true, ...options }),
  outlineButton: (text, options = {}) => new Button({ text, outline: true, ...options }),
  ghostButton: (text, options = {}) => new Button({ text, ghost: true, ...options }),

  // Modal 팩토리 함수들
  createModal: (title, content, options = {}) => new Modal({ title, content, ...options }),
  confirmModal: (message, options = {}) => ModalFactory.confirm(message, options),
  alertModal: (message, options = {}) => ModalFactory.alert(message, options),
  loadingModal: (message, options = {}) => ModalFactory.loading(message, options),

  // ToggleSwitch 팩토리 함수
  switch: (label, options = {}) => new ToggleSwitch({ label, ...options }),
  
  // Medal 팩토리 함수
  medal: (containerId, options = {}) => new Medal(containerId, options),
};

// 컴포넌트 등록 및 초기화
export function initializeAllComponents() {
  // 모든 컴포넌트를 자동으로 등록
  ComponentManager.initialize();
  
  console.log('🚀 모든 컴포넌트가 초기화되었습니다!');
  console.log('📦 사용 가능한 컴포넌트:', {
    Button: 'Button, ButtonFactory, ButtonGroup',
    Modal: 'Modal, ModalFactory, ModalManager',
    ToggleSwitch: 'ToggleSwitch',
    Medal: 'Medal',
    ComponentFactory: '통합 팩토리 함수들'
  });
}

// 기본 export
export default {
  BaseComponent,
  Button,
  Modal,
  ToggleSwitch,
  Medal,
  ComponentFactory,
  componentRegistry,
  ComponentManager,
  initializeAllComponents
};
