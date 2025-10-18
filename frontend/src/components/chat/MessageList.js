import { BaseComponent } from '../base/BaseComponent.js';

/**
 * MessageList - 채팅 메시지 리스트 컴포넌트
 * 메시지 표시, 스크롤 관리, 마크다운 렌더링 지원
 */
export class MessageList extends BaseComponent {
  constructor(options = {}) {
    super({
      messages: [],
      autoScroll: true,
      maxHeight: '400px',
      showTimestamps: true,
      markdownSupport: true,
      ...options
    });
  }
  
  setupState() {
    this.state = {
      messages: this.options.messages || [],
      isScrolledToBottom: true
    };
  }
  
  setupEvents() {
    super.setupEvents();
    
    // 스크롤 이벤트 리스너
    this.addEventListener('scroll', (event) => {
      this.handleScroll(event);
    });
  }
  
  renderTemplate() {
    const { maxHeight, showTimestamps } = this.options;
    const { messages } = this.state;
    
    const messagesHtml = messages.map((message, index) => 
      this.renderMessage(message, index)
    ).join('');
    
    return `
      <div class="message-list" 
           data-component="message-list"
           style="max-height: ${maxHeight}; overflow-y: auto;">
        <div class="message-list-container">
          ${messagesHtml}
        </div>
        <div class="scroll-indicator" data-scroll-indicator style="display: none;">
          <button class="scroll-to-bottom-btn" data-scroll-to-bottom>
            ↓ 최신 메시지
          </button>
        </div>
      </div>
    `;
  }
  
  renderMessage(message, index) {
    const { showTimestamps } = this.options;
    const { role, content, timestamp } = message;
    
    const messageClass = role === 'user' ? 'message-user' : 'message-assistant';
    const timestampHtml = showTimestamps && timestamp ? 
      `<div class="message-timestamp">${this.formatTimestamp(timestamp)}</div>` : '';
    
    const contentHtml = this.options.markdownSupport ? 
      this.renderMarkdown(content) : this.escapeHtml(content);
    
    return `
      <div class="message ${messageClass}" data-message-index="${index}">
        <div class="message-avatar">
          ${role === 'user' ? '👤' : '🤖'}
        </div>
        <div class="message-content">
          <div class="message-text">${contentHtml}</div>
          ${timestampHtml}
        </div>
      </div>
    `;
  }
  
  renderMarkdown(text) {
    // 간단한 마크다운 렌더링
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  handleScroll(event) {
    const container = event.target;
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
    
    this.state.isScrolledToBottom = isAtBottom;
    
    // 스크롤 인디케이터 표시/숨김
    const indicator = this.element?.querySelector('[data-scroll-indicator]');
    if (indicator) {
      indicator.style.display = isAtBottom ? 'none' : 'block';
    }
  }
  
  /**
   * 메시지 추가
   */
  addMessage(message) {
    this.state.messages.push(message);
    this.reRender();
    
    if (this.options.autoScroll && this.state.isScrolledToBottom) {
      this.scrollToBottom();
    }
  }
  
  /**
   * 메시지 목록 설정
   */
  setMessages(messages) {
    this.state.messages = [...messages];
    this.reRender();
    
    if (this.options.autoScroll) {
      this.scrollToBottom();
    }
  }
  
  /**
   * 메시지 목록 초기화
   */
  clearMessages() {
    this.state.messages = [];
    this.reRender();
  }
  
  /**
   * 맨 아래로 스크롤
   */
  scrollToBottom() {
    if (this.element) {
      const container = this.element.querySelector('.message-list');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }
  
  /**
   * 스크롤 인디케이터 클릭 핸들러
   */
  setupScrollIndicator() {
    const scrollBtn = this.element?.querySelector('[data-scroll-to-bottom]');
    if (scrollBtn) {
      scrollBtn.addEventListener('click', () => {
        this.scrollToBottom();
      });
    }
  }
  
  /**
   * 컴포넌트 마운트 후 실행
   */
  onMount() {
    super.onMount();
    this.setupScrollIndicator();
    
    // 초기 스크롤 위치 설정
    if (this.options.autoScroll) {
      this.scrollToBottom();
    }
  }
}


