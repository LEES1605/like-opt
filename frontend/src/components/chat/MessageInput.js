import { BaseComponent } from '../base/BaseComponent.js';
import { Button } from '../common/Button.js';

/**
 * MessageInput - 메시지 입력 컴포넌트
 * 텍스트 입력, 전송 버튼, 모드 선택 지원
 */
export class MessageInput extends BaseComponent {
  constructor(options = {}) {
    super({
      placeholder: '메시지를 입력하세요...',
      maxLength: 1000,
      autoResize: true,
      sendOnEnter: true,
      disabled: false,
      ...options
    });
  }
  
  setupState() {
    this.state = {
      message: '',
      isTyping: false,
      disabled: this.options.disabled
    };
  }
  
  setupEvents() {
    super.setupEvents();
    
    // 입력 이벤트
    this.addEventListener('input', (event) => {
      this.handleInput(event);
    });
    
    // 키보드 이벤트
    this.addEventListener('keydown', (event) => {
      this.handleKeyDown(event);
    });
    
    // 포커스 이벤트
    this.addEventListener('focus', (event) => {
      this.handleFocus(event);
    });
    
    this.addEventListener('blur', (event) => {
      this.handleBlur(event);
    });
  }
  
  renderTemplate() {
    const { placeholder, maxLength, disabled } = this.options;
    const { message, isTyping, disabled: stateDisabled } = this.state;
    
    const isDisabled = disabled || stateDisabled;
    const sendButton = new Button({
      text: '전송',
      type: 'primary',
      size: 'medium',
      disabled: isDisabled || !message.trim(),
      onClick: () => this.sendMessage()
    });
    
    return `
      <div class="message-input" data-component="message-input">
        <div class="input-container">
          <textarea 
            class="message-textarea"
            placeholder="${placeholder}"
            maxlength="${maxLength}"
            rows="1"
            ${isDisabled ? 'disabled' : ''}
            data-message-textarea
          >${message}</textarea>
          <div class="input-actions">
            <div class="input-info">
              <span class="char-count" data-char-count>
                ${message.length}/${maxLength}
              </span>
              ${isTyping ? '<span class="typing-indicator">입력 중...</span>' : ''}
            </div>
            <div class="send-button">
              ${sendButton.render().outerHTML}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  handleInput(event) {
    const textarea = event.target;
    const message = textarea.value;
    
    this.state.message = message;
    this.state.isTyping = true;
    
    // 자동 크기 조정
    if (this.options.autoResize) {
      this.autoResize(textarea);
    }
    
    // 문자 수 업데이트
    this.updateCharCount();
    
    // 전송 버튼 상태 업데이트
    this.updateSendButton();
    
    // 타이핑 상태 리셋 (디바운스)
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.state.isTyping = false;
      this.reRender();
    }, 1000);
  }
  
  handleKeyDown(event) {
    if (event.key === 'Enter') {
      if (this.options.sendOnEnter && !event.shiftKey) {
        event.preventDefault();
        this.sendMessage();
      }
    }
  }
  
  handleFocus(event) {
    this.element?.classList.add('focused');
  }
  
  handleBlur(event) {
    this.element?.classList.remove('focused');
  }
  
  autoResize(textarea) {
    // 높이 초기화
    textarea.style.height = 'auto';
    
    // 스크롤 높이에 맞춰 조정
    const newHeight = Math.min(textarea.scrollHeight, 120); // 최대 120px
    textarea.style.height = newHeight + 'px';
  }
  
  updateCharCount() {
    const charCount = this.element?.querySelector('[data-char-count]');
    if (charCount) {
      const { message } = this.state;
      const { maxLength } = this.options;
      charCount.textContent = `${message.length}/${maxLength}`;
      
      // 문자 수에 따른 스타일 변경
      if (message.length > maxLength * 0.9) {
        charCount.classList.add('warning');
      } else {
        charCount.classList.remove('warning');
      }
    }
  }
  
  updateSendButton() {
    const sendButton = this.element?.querySelector('.send-button button');
    if (sendButton) {
      const { message, disabled } = this.state;
      const isDisabled = disabled || !message.trim();
      
      sendButton.disabled = isDisabled;
      sendButton.classList.toggle('disabled', isDisabled);
    }
  }
  
  /**
   * 메시지 전송
   */
  sendMessage() {
    const { message } = this.state;
    
    if (!message.trim() || this.state.disabled) {
      return;
    }
    
    // 메시지 전송 이벤트 발생
    this.emit('send', {
      message: message.trim(),
      timestamp: new Date()
    });
    
    // 입력 필드 초기화
    this.clearInput();
  }
  
  /**
   * 입력 필드 초기화
   */
  clearInput() {
    this.state.message = '';
    this.state.isTyping = false;
    this.reRender();
    
    // 포커스 유지
    const textarea = this.element?.querySelector('[data-message-textarea]');
    if (textarea) {
      textarea.focus();
    }
  }
  
  /**
   * 입력 필드 비활성화/활성화
   */
  setDisabled(disabled) {
    this.state.disabled = disabled;
    this.reRender();
  }
  
  /**
   * 메시지 설정
   */
  setMessage(message) {
    this.state.message = message;
    this.reRender();
  }
  
  /**
   * 포커스 설정
   */
  focus() {
    const textarea = this.element?.querySelector('[data-message-textarea]');
    if (textarea) {
      textarea.focus();
    }
  }
  
  /**
   * 컴포넌트 마운트 후 실행
   */
  onMount() {
    super.onMount();
    
    // 전송 버튼 이벤트 리스너 설정
    const sendButton = this.element?.querySelector('.send-button button');
    if (sendButton) {
      sendButton.addEventListener('click', () => {
        this.sendMessage();
      });
    }
    
    // 초기 포커스
    this.focus();
  }
  
  /**
   * 컴포넌트 언마운트 시 실행
   */
  onUnmount() {
    super.onUnmount();
    
    // 타이핑 타임아웃 정리
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }
}


