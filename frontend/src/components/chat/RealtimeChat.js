/**
 * 실시간 채팅 컴포넌트
 * WebSocket을 사용한 실시간 메시지 전송/수신
 */

import { BaseComponent } from '../base/BaseComponent.js';
import { eventBus, AppEvents } from '../../utils/events.js';
import { websocketService } from '../../services/websocketService.js';

export class RealtimeChat extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.room = options.room || 'users';
    this.isTyping = false;
    this.typingTimeout = null;
    this.typingUsers = new Set();
    this.messageHistory = [];
    this.maxHistory = 100;
    
    this.init();
  }

  init() {
    this.createHTML();
    this.bindEvents();
    this.setupWebSocketListeners();
    this.joinRoom();
  }

  createHTML() {
    this.element.innerHTML = `
      <div class="realtime-chat">
        <div class="chat-header">
          <h3>💬 실시간 채팅</h3>
          <div class="connection-status">
            <span class="status-indicator" id="connection-status">연결 중...</span>
            <span class="user-count" id="user-count">0명 온라인</span>
          </div>
        </div>

        <div class="chat-messages" id="chat-messages">
          <div class="welcome-message">
            <p>실시간 채팅에 오신 것을 환영합니다!</p>
            <p>메시지를 입력하여 다른 사용자들과 소통해보세요.</p>
          </div>
        </div>

        <div class="typing-indicator" id="typing-indicator" style="display: none;">
          <span class="typing-text">누군가 타이핑 중...</span>
        </div>

        <div class="chat-input-container">
          <div class="input-wrapper">
            <input 
              type="text" 
              id="message-input" 
              class="message-input" 
              placeholder="메시지를 입력하세요..."
              maxlength="500"
            >
            <button id="send-button" class="send-button" disabled>
              <span class="send-icon">📤</span>
            </button>
          </div>
          <div class="input-actions">
            <button class="action-btn" id="help-button">
              <span class="btn-icon">❓</span>
              도움말
            </button>
            <button class="action-btn" id="clear-button">
              <span class="btn-icon">🗑️</span>
              지우기
            </button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 메시지 입력
    const messageInput = this.element.querySelector('#message-input');
    const sendButton = this.element.querySelector('#send-button');

    messageInput.addEventListener('input', (e) => {
      const hasText = e.target.value.trim().length > 0;
      sendButton.disabled = !hasText;
      
      // 타이핑 상태 관리
      this.handleTyping();
    });

    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // 전송 버튼
    sendButton.addEventListener('click', () => {
      this.sendMessage();
    });

    // 도움말 버튼
    const helpButton = this.element.querySelector('#help-button');
    helpButton.addEventListener('click', () => {
      this.requestHelp();
    });

    // 지우기 버튼
    const clearButton = this.element.querySelector('#clear-button');
    clearButton.addEventListener('click', () => {
      this.clearMessages();
    });
  }

  setupWebSocketListeners() {
    // WebSocket 연결 상태
    eventBus.on(AppEvents.WEBSOCKET_CONNECTED, () => {
      this.updateConnectionStatus('connected', '연결됨');
    });

    eventBus.on(AppEvents.WEBSOCKET_DISCONNECTED, () => {
      this.updateConnectionStatus('disconnected', '연결 해제');
    });

    eventBus.on(AppEvents.WEBSOCKET_ERROR, (data) => {
      this.updateConnectionStatus('error', '연결 오류');
      this.showError('WebSocket 연결 오류가 발생했습니다.');
    });

    // 메시지 수신
    eventBus.on(AppEvents.MESSAGE_RECEIVED, (data) => {
      this.addMessage(data);
    });

    // 타이핑 상태
    eventBus.on(AppEvents.USER_TYPING, (data) => {
      this.showTypingIndicator(data);
    });

    eventBus.on(AppEvents.USER_STOPPED_TYPING, (data) => {
      this.hideTypingIndicator(data);
    });

    // 사용자 연결/해제
    eventBus.on(AppEvents.USER_CONNECTED, (data) => {
      this.showSystemMessage(`${data.username || '사용자'}가 연결되었습니다.`);
    });

    eventBus.on(AppEvents.USER_DISCONNECTED, (data) => {
      this.showSystemMessage(`${data.username || '사용자'}가 연결을 해제했습니다.`);
    });

    // 관리자 브로드캐스트
    eventBus.on(AppEvents.ADMIN_BROADCAST, (data) => {
      this.showAdminMessage(data);
    });

    // 온라인 사용자 수
    eventBus.on(AppEvents.ONLINE_USERS, (data) => {
      this.updateUserCount(data.total_count);
    });
  }

  joinRoom() {
    websocketService.joinRoom(this.room);
  }

  sendMessage() {
    const messageInput = this.element.querySelector('#message-input');
    const message = messageInput.value.trim();
    
    if (!message) return;

    // 메시지 전송
    websocketService.sendMessage(message, this.room, 'chat');
    
    // 입력 필드 초기화
    messageInput.value = '';
    this.element.querySelector('#send-button').disabled = true;
    
    // 타이핑 중지
    this.stopTyping();
  }

  handleTyping() {
    if (!this.isTyping) {
      this.isTyping = true;
      websocketService.sendTypingStart(this.room);
    }

    // 타이핑 중지 타이머 리셋
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 2000);
  }

  stopTyping() {
    if (this.isTyping) {
      this.isTyping = false;
      websocketService.sendTypingStop(this.room);
    }
    clearTimeout(this.typingTimeout);
  }

  addMessage(data) {
    const messagesContainer = this.element.querySelector('#chat-messages');
    const messageElement = this.createMessageElement(data);
    
    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
    
    // 메시지 히스토리에 추가
    this.messageHistory.push(data);
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.shift();
    }
  }

  createMessageElement(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.user_id === 'system' ? 'system-message' : 'user-message'}`;
    
    const timestamp = new Date(data.timestamp).toLocaleTimeString();
    
    if (data.user_id === 'system') {
      messageDiv.innerHTML = `
        <div class="message-content system">
          <span class="message-text">${data.message}</span>
          <span class="message-time">${timestamp}</span>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="message-header">
          <span class="username">${data.username || 'Anonymous'}</span>
          <span class="message-time">${timestamp}</span>
        </div>
        <div class="message-content">
          <span class="message-text">${data.message}</span>
        </div>
      `;
    }
    
    return messageDiv;
  }

  showTypingIndicator(data) {
    if (data.user_id === websocketService.socket?.id) return;
    
    this.typingUsers.add(data.username);
    this.updateTypingIndicator();
  }

  hideTypingIndicator(data) {
    this.typingUsers.delete(data.username);
    this.updateTypingIndicator();
  }

  updateTypingIndicator() {
    const indicator = this.element.querySelector('#typing-indicator');
    const typingText = this.element.querySelector('.typing-text');
    
    if (this.typingUsers.size > 0) {
      const users = Array.from(this.typingUsers);
      if (users.length === 1) {
        typingText.textContent = `${users[0]}님이 타이핑 중...`;
      } else if (users.length === 2) {
        typingText.textContent = `${users[0]}님과 ${users[1]}님이 타이핑 중...`;
      } else {
        typingText.textContent = `${users[0]}님 외 ${users.length - 1}명이 타이핑 중...`;
      }
      indicator.style.display = 'block';
    } else {
      indicator.style.display = 'none';
    }
  }

  showSystemMessage(message) {
    this.addMessage({
      user_id: 'system',
      username: 'System',
      message: message,
      timestamp: new Date().toISOString(),
      type: 'system'
    });
  }

  showAdminMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message admin-message';
    messageDiv.innerHTML = `
      <div class="admin-badge">관리자</div>
      <div class="message-content">
        <span class="message-text">${data.message}</span>
        <span class="message-time">${new Date(data.timestamp).toLocaleTimeString()}</span>
      </div>
    `;
    
    this.element.querySelector('#chat-messages').appendChild(messageDiv);
    this.scrollToBottom();
  }

  updateConnectionStatus(status, text) {
    const statusIndicator = this.element.querySelector('#connection-status');
    statusIndicator.textContent = text;
    statusIndicator.className = `status-indicator ${status}`;
  }

  updateUserCount(count) {
    const userCount = this.element.querySelector('#user-count');
    userCount.textContent = `${count}명 온라인`;
  }

  requestHelp() {
    const helpType = 'general';
    const message = '실시간 채팅 사용법에 대한 도움을 요청합니다.';
    
    websocketService.requestHelp(helpType, message);
    
    this.showSystemMessage('도움말 요청이 전송되었습니다.');
  }

  clearMessages() {
    if (confirm('모든 메시지를 지우시겠습니까?')) {
      const messagesContainer = this.element.querySelector('#chat-messages');
      messagesContainer.innerHTML = `
        <div class="welcome-message">
          <p>메시지가 지워졌습니다.</p>
        </div>
      `;
      
      this.messageHistory = [];
      websocketService.clearMessageHistory();
    }
  }

  scrollToBottom() {
    const messagesContainer = this.element.querySelector('#chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showError(message) {
    console.error(message);
    // TODO: 토스트 알림 구현
  }

  destroy() {
    websocketService.leaveRoom(this.room);
    super.destroy();
  }
}
