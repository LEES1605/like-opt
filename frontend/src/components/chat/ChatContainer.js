/**
 * ChatContainer - 재사용 가능한 채팅 컨테이너 컴포넌트
 * 메시지 표시, 입력, 스크롤 관리 기능 제공
 */
export class ChatContainer {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      placeholder: '질문을 입력하세요...',
      sendButtonText: '▶',
      maxMessages: 100,
      autoScroll: true,
      enableTyping: true,
      ...options
    };
    
    this.messages = [];
    this.isTyping = false;
    this.messageId = 0;
    
    this.init();
  }
  
  /**
   * 채팅 컨테이너 초기화
   */
  init() {
    this.render();
    this.setupEventListeners();
    this.addWelcomeMessage();
  }
  
  /**
   * 채팅 컨테이너 HTML 렌더링
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with id '${this.containerId}' not found`);
      return;
    }
    
    container.innerHTML = `
      <div class="chat-container neumorphic-card">
        <div class="chat-header">
          <h3 class="chat-title">Professor G와의 대화</h3>
          <div class="chat-status" id="chat-status">
            <div class="status-pulse green" data-status="ready"></div>
            <span class="status-text">준비완료</span>
          </div>
        </div>
        
        <div class="chat-messages" id="chat-messages">
          <!-- 메시지들이 여기에 추가됩니다 -->
        </div>
        
        <div class="chat-input-container">
          <div class="input-group">
            <textarea 
              id="chat-input" 
              class="chat-input neumorphic-input" 
              placeholder="${this.options.placeholder}"
              rows="1"
            ></textarea>
            <button 
              id="chat-send-btn" 
              class="send-button neumorphic-button"
              title="전송 (Enter)"
            >
              ${this.options.sendButtonText}
            </button>
          </div>
          
          <div class="typing-indicator" id="typing-indicator" style="display: none;">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="typing-text">Professor G가 답변을 준비하고 있습니다...</span>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    
    if (!input || !sendBtn) return;
    
    // 전송 버튼 클릭
    sendBtn.addEventListener('click', () => this.handleSend());
    
    // Enter 키로 전송 (Shift+Enter는 줄바꿈)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    
    // 입력창 자동 높이 조절
    input.addEventListener('input', () => this.autoResizeInput(input));
  }
  
  /**
   * 환영 메시지 추가
   */
  addWelcomeMessage() {
    const welcomeMessage = {
      id: this.generateMessageId(),
      type: 'ai',
      content: '👋 안녕~ 라이크이스턴영어학원의 Professor G야! 궁금한 것이 있으면 언제든 물어봐!',
      timestamp: new Date(),
      avatar: '🎓'
    };
    
    this.addMessage(welcomeMessage);
  }
  
  /**
   * 메시지 추가
   */
  addMessage(messageData) {
    const message = {
      id: messageData.id || this.generateMessageId(),
      type: messageData.type || 'user', // 'user' 또는 'ai'
      content: messageData.content || '',
      timestamp: messageData.timestamp || new Date(),
      avatar: messageData.avatar || (messageData.type === 'ai' ? '🎓' : '👤'),
      ...messageData
    };
    
    this.messages.push(message);
    
    // 최대 메시지 수 제한
    if (this.messages.length > this.options.maxMessages) {
      this.messages.shift();
    }
    
    this.renderMessage(message);
    this.updateStatus();
    
    if (this.options.autoScroll) {
      this.scrollToBottom();
    }
  }
  
  /**
   * 개별 메시지 렌더링
   */
  renderMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${message.type}`;
    messageElement.setAttribute('data-message-id', message.id);
    
    const timeString = message.timestamp.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    messageElement.innerHTML = `
      <div class="message-avatar ${message.type}">${message.avatar}</div>
      <div class="message-content">
        <div class="message-bubble ${message.type}">
          <div class="message-text">${this.formatMessage(message.content)}</div>
          <div class="message-time">${timeString}</div>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(messageElement);
  }
  
  /**
   * 메시지 포맷팅 (마크다운, 링크 등)
   */
  formatMessage(content) {
    // 간단한 마크다운 포맷팅
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }
  
  /**
   * 타이핑 인디케이터 표시/숨김
   */
  showTyping() {
    if (!this.options.enableTyping) return;
    
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.style.display = 'flex';
      this.isTyping = true;
      this.updateStatus('typing');
    }
  }
  
  hideTyping() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.style.display = 'none';
      this.isTyping = false;
      this.updateStatus('ready');
    }
  }
  
  /**
   * 메시지 전송 처리
   */
  handleSend() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    
    const content = input.value.trim();
    if (!content) return;
    
    // 사용자 메시지 추가
    this.addMessage({
      type: 'user',
      content: content
    });
    
    // 입력창 초기화
    input.value = '';
    this.autoResizeInput(input);
    
    // 타이핑 인디케이터 표시
    this.showTyping();
    
    // AI 응답 시뮬레이션 (실제로는 API 호출)
    setTimeout(() => {
      this.hideTyping();
      this.addMessage({
        type: 'ai',
        content: `"${content}"에 대한 답변을 준비하고 있습니다. 실제 구현에서는 API를 통해 AI 응답을 받아올 예정입니다.`,
        avatar: '🎓'
      });
    }, 1500);
  }
  
  /**
   * 입력창 자동 높이 조절
   */
  autoResizeInput(input) {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }
  
  /**
   * 스크롤을 맨 아래로
   */
  scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
  
  /**
   * 채팅 상태 업데이트
   */
  updateStatus(status = 'ready') {
    const statusElement = document.getElementById('chat-status');
    if (!statusElement) return;
    
    const pulse = statusElement.querySelector('.status-pulse');
    const text = statusElement.querySelector('.status-text');
    
    if (pulse && text) {
      // 기존 상태 클래스 제거
      pulse.className = 'status-pulse';
      
      switch (status) {
        case 'ready':
          pulse.classList.add('green');
          text.textContent = '준비완료';
          break;
        case 'typing':
          pulse.classList.add('yellow');
          text.textContent = '답변 준비중';
          break;
        case 'error':
          pulse.classList.add('red');
          text.textContent = '연결 오류';
          break;
      }
    }
  }
  
  /**
   * 메시지 ID 생성
   */
  generateMessageId() {
    return `msg-${Date.now()}-${++this.messageId}`;
  }
  
  /**
   * 채팅 기록 초기화
   */
  clearMessages() {
    this.messages = [];
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    this.addWelcomeMessage();
  }
  
  /**
   * 채팅 기록 가져오기
   */
  getMessages() {
    return [...this.messages];
  }
  
  /**
   * 특정 메시지 삭제
   */
  removeMessage(messageId) {
    this.messages = this.messages.filter(msg => msg.id !== messageId);
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.remove();
    }
  }
}
