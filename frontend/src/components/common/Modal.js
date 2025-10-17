import { BaseComponent } from '../base/BaseComponent.js';
import { Button, ButtonFactory } from './Button.js';

/**
 * Modal - 재사용 가능한 모달 컴포넌트
 * 다양한 크기, 스타일, 동작을 지원
 */
export class Modal extends BaseComponent {
  constructor(options = {}) {
    super({
      title: '',
      content: '',
      size: 'medium',
      closable: true,
      backdrop: true,
      keyboard: true,
      visible: false,
      footer: true,
      footerButtons: [],
      ...options
    });
  }
  
  setupState() {
    this.state = {
      visible: this.options.visible,
      content: this.options.content,
      title: this.options.title
    };
  }
  
  setupEvents() {
    super.setupEvents();
    
    // ESC 키로 닫기
    if (this.options.keyboard) {
      this.addKeyboardListener();
    }
    
    // 백드롭 클릭으로 닫기
    if (this.options.backdrop) {
      this.addEventListener('click', (event) => {
        if (event.target === this.element) {
          this.hide();
        }
      });
    }
  }
  
  renderTemplate() {
    if (!this.state.visible) {
      return '';
    }
    
    const { size, closable, footer } = this.options;
    const { title, content } = this.state;
    
    const modalClasses = this.generateModalClasses(size);
    const dialogClasses = this.generateDialogClasses(size);
    
    return `
      <div class="${modalClasses}" data-component="modal" role="dialog" aria-modal="true">
        <div class="modal-backdrop"></div>
        <div class="modal-dialog ${dialogClasses}">
          <div class="modal-content">
            ${this.renderHeader(title, closable)}
            ${this.renderBody(content)}
            ${footer ? this.renderFooter() : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  generateModalClasses(size) {
    const classes = ['modal'];
    
    if (this.options.className) {
      classes.push(this.options.className);
    }
    
    return classes.join(' ');
  }
  
  generateDialogClasses(size) {
    const classes = ['modal-dialog'];
    
    // 크기별 클래스
    switch (size) {
      case 'small':
        classes.push('modal-sm');
        break;
      case 'large':
        classes.push('modal-lg');
        break;
      case 'extra-large':
        classes.push('modal-xl');
        break;
      case 'fullscreen':
        classes.push('modal-fullscreen');
        break;
      default:
        classes.push('modal-md');
    }
    
    return classes.join(' ');
  }
  
  renderHeader(title, closable) {
    if (!title && !closable) {
      return '';
    }
    
    const closeButton = closable ? `
      <button type="button" class="modal-close" data-action="close" aria-label="닫기">
        <span aria-hidden="true">&times;</span>
      </button>
    ` : '';
    
    return `
      <div class="modal-header">
        ${title ? `<h5 class="modal-title">${title}</h5>` : ''}
        ${closeButton}
      </div>
    `;
  }
  
  renderBody(content) {
    return `
      <div class="modal-body">
        ${content}
      </div>
    `;
  }
  
  renderFooter() {
    const buttons = this.options.footerButtons || [];
    
    if (buttons.length === 0) {
      // 기본 버튼들
      const defaultButtons = [
        ButtonFactory.secondary('취소', { 
          onClick: () => this.hide() 
        }),
        ButtonFactory.primary('확인', { 
          onClick: () => this.confirm() 
        })
      ];
      
      const buttonsHtml = defaultButtons.map(button => 
        button.render().outerHTML
      ).join('');
      
      return `
        <div class="modal-footer">
          ${buttonsHtml}
        </div>
      `;
    }
    
    const buttonsHtml = buttons.map(button => {
      if (typeof button === 'string') {
        return `<button class="btn btn-primary">${button}</button>`;
      }
      
      if (button instanceof Button) {
        return button.render().outerHTML;
      }
      
      return new Button(button).render().outerHTML;
    }).join('');
    
    return `
      <div class="modal-footer">
        ${buttonsHtml}
      </div>
    `;
  }
  
  addKeyboardListener() {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && this.state.visible) {
        this.hide();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // 컴포넌트 파괴 시 리스너 제거
    const originalDestroy = this.destroy.bind(this);
    this.destroy = () => {
      document.removeEventListener('keydown', handleKeyDown);
      originalDestroy();
    };
  }
  
  /**
   * 모달 표시
   */
  show() {
    this.update({ visible: true });
    this.addToBody();
    this.focusFirstInput();
  }
  
  /**
   * 모달 숨기기
   */
  hide() {
    this.update({ visible: false });
    this.removeFromBody();
  }
  
  /**
   * 모달 토글
   */
  toggle() {
    if (this.state.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * body에 모달 추가
   */
  addToBody() {
    if (this.element) {
      document.body.appendChild(this.element);
      document.body.classList.add('modal-open');
    }
  }
  
  /**
   * body에서 모달 제거
   */
  removeFromBody() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      document.body.classList.remove('modal-open');
    }
  }
  
  /**
   * 첫 번째 입력 요소에 포커스
   */
  focusFirstInput() {
    if (this.element) {
      const firstInput = this.element.querySelector('input, textarea, select, button');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }
  
  /**
   * 제목 설정
   */
  setTitle(title) {
    this.update({ title });
  }
  
  /**
   * 내용 설정
   */
  setContent(content) {
    this.update({ content });
  }
  
  /**
   * 확인 버튼 클릭 시 호출
   */
  confirm() {
    // 사용자 정의 확인 핸들러가 있으면 호출
    if (this.options.onConfirm) {
      this.options.onConfirm();
    }
    
    this.hide();
  }
  
  /**
   * 취소 버튼 클릭 시 호출
   */
  cancel() {
    // 사용자 정의 취소 핸들러가 있으면 호출
    if (this.options.onCancel) {
      this.options.onCancel();
    }
    
    this.hide();
  }
}

/**
 * 특화된 모달 컴포넌트들
 */
export class ConfirmModal extends Modal {
  constructor(options = {}) {
    super({
      title: options.title || '확인',
      content: options.message || '정말로 진행하시겠습니까?',
      size: 'small',
      footerButtons: [
        {
          text: '취소',
          type: 'secondary',
          onClick: () => this.cancel()
        },
        {
          text: '확인',
          type: 'primary',
          onClick: () => this.confirm()
        }
      ],
      ...options
    });
  }
}

export class AlertModal extends Modal {
  constructor(options = {}) {
    super({
      title: options.title || '알림',
      content: options.message || '',
      size: 'small',
      footerButtons: [
        {
          text: '확인',
          type: 'primary',
          onClick: () => this.hide()
        }
      ],
      ...options
    });
  }
}

export class LoadingModal extends Modal {
  constructor(options = {}) {
    super({
      title: options.title || '처리 중...',
      content: `
        <div class="loading-content">
          <div class="spinner"></div>
          <p>${options.message || '잠시만 기다려주세요.'}</p>
        </div>
      `,
      size: 'small',
      closable: false,
      backdrop: false,
      keyboard: false,
      footer: false,
      ...options
    });
  }
  
  setMessage(message) {
    this.setContent(`
      <div class="loading-content">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `);
  }
}

/**
 * 모달 팩토리 함수들
 */
export const ModalFactory = {
  /**
   * 기본 모달 생성
   */
  create: (title, content, options = {}) => {
    return new Modal({ title, content, ...options });
  },
  
  /**
   * 확인 모달 생성
   */
  confirm: (message, options = {}) => {
    return new ConfirmModal({ message, ...options });
  },
  
  /**
   * 알림 모달 생성
   */
  alert: (message, options = {}) => {
    return new AlertModal({ message, ...options });
  },
  
  /**
   * 로딩 모달 생성
   */
  loading: (message, options = {}) => {
    return new LoadingModal({ message, ...options });
  }
};

/**
 * 모달 매니저 - 모달 인스턴스 관리
 */
export class ModalManager {
  constructor() {
    this.modals = new Map();
    this.zIndex = 1050; // Bootstrap 기본값
  }
  
  /**
   * 모달 등록
   */
  register(name, modal) {
    this.modals.set(name, modal);
    return modal;
  }
  
  /**
   * 모달 조회
   */
  get(name) {
    return this.modals.get(name);
  }
  
  /**
   * 모달 표시
   */
  show(name) {
    const modal = this.get(name);
    if (modal) {
      modal.element.style.zIndex = ++this.zIndex;
      modal.show();
    }
    return modal;
  }
  
  /**
   * 모달 숨기기
   */
  hide(name) {
    const modal = this.get(name);
    if (modal) {
      modal.hide();
    }
    return modal;
  }
  
  /**
   * 모든 모달 숨기기
   */
  hideAll() {
    this.modals.forEach(modal => modal.hide());
  }
  
  /**
   * 모달 제거
   */
  remove(name) {
    const modal = this.get(name);
    if (modal) {
      modal.destroy();
      this.modals.delete(name);
    }
    return modal;
  }
  
  /**
   * 모든 모달 제거
   */
  removeAll() {
    this.modals.forEach(modal => modal.destroy());
    this.modals.clear();
  }
}

// 전역 모달 매니저
export const modalManager = new ModalManager();

// 컴포넌트 등록
import { componentRegistry } from '../base/BaseComponent.js';
componentRegistry.register('Modal', Modal);
componentRegistry.register('ConfirmModal', ConfirmModal);
componentRegistry.register('AlertModal', AlertModal);
componentRegistry.register('LoadingModal', LoadingModal);
