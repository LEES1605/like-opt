import { BaseComponent } from '../base/BaseComponent.js';
import { MessageList } from './MessageList.js';
import { MessageInput } from './MessageInput.js';
import { ModeSelector } from './ModeSelector.js';
import { chatService } from '../../services/chatService.js';

/**
 * ChatInterface - 메인 채팅 인터페이스 컴포넌트
 * 전체 채팅 UI를 관리하고 AI와의 대화를 처리
 */
export class ChatInterface extends BaseComponent {
  constructor(options = {}) {
    super({
      initialMode: 'grammar',
      initialDifficulty: 'intermediate',
      autoScroll: true,
      showModeSelector: true,
      maxMessages: 100,
      ...options
    });
  }
  
  setupState() {
    this.state = {
      messages: [],
      currentMode: this.options.initialMode,
      currentDifficulty: this.options.initialDifficulty,
      isLoading: false,
      isConnected: true,
      error: null
    };
  }
  
  setupEvents() {
    super.setupEvents();
    
    // 메시지 입력 이벤트
    this.addEventListener('send', (event) => {
      this.handleSendMessage(event.detail);
    });
    
    // 모드 변경 이벤트
    this.addEventListener('modeChange', (event) => {
      this.handleModeChange(event.detail);
    });
    
    // 난이도 변경 이벤트
    this.addEventListener('difficultyChange', (event) => {
      this.handleDifficultyChange(event.detail);
    });
  }
  
  renderTemplate() {
    const { showModeSelector } = this.options;
    const { isLoading, error } = this.state;
    
    const modeSelector = showModeSelector ? this.renderModeSelector() : '';
    const messageList = this.renderMessageList();
    const messageInput = this.renderMessageInput();
    const loadingIndicator = isLoading ? this.renderLoadingIndicator() : '';
    const errorMessage = error ? this.renderErrorMessage(error) : '';
    
    return `
      <div class="chat-interface" data-component="chat-interface">
        <div class="chat-header">
          <h2 class="chat-title">Professor G와 영어 학습</h2>
          ${modeSelector}
        </div>
        
        <div class="chat-body">
          ${messageList}
          ${loadingIndicator}
          ${errorMessage}
        </div>
        
        <div class="chat-footer">
          ${messageInput}
        </div>
      </div>
    `;
  }
  
  renderModeSelector() {
    const { currentMode, currentDifficulty } = this.state;
    
    const modeSelector = new ModeSelector({
      currentMode,
      currentDifficulty,
      showDifficulty: true,
      compact: false
    });
    
    return modeSelector.render();
  }
  
  renderMessageList() {
    const { messages, maxMessages } = this.options;
    
    const messageList = new MessageList({
      messages: this.state.messages,
      autoScroll: this.options.autoScroll,
      maxHeight: '400px',
      showTimestamps: true,
      markdownSupport: true
    });
    
    return messageList.render();
  }
  
  renderMessageInput() {
    const { isLoading } = this.state;
    
    const messageInput = new MessageInput({
      placeholder: '영어 학습에 대해 질문해보세요...',
      maxLength: 1000,
      autoResize: true,
      sendOnEnter: true,
      disabled: isLoading
    });
    
    return messageInput.render();
  }
  
  renderLoadingIndicator() {
    return `
      <div class="loading-indicator">
        <div class="loading-spinner"></div>
        <span class="loading-text">Professor G가 답변을 준비하고 있습니다...</span>
      </div>
    `;
  }
  
  renderErrorMessage(error) {
    return `
      <div class="error-message">
        <div class="error-icon">⚠️</div>
        <div class="error-content">
          <h4>오류가 발생했습니다</h4>
          <p>${error}</p>
          <button class="retry-button" data-retry-button>다시 시도</button>
        </div>
      </div>
    `;
  }
  
  /**
   * 메시지 전송 처리
   */
  async handleSendMessage(eventData) {
    const { message } = eventData;
    
    if (!message.trim() || this.state.isLoading) {
      return;
    }
    
    // 사용자 메시지 추가
    this.addMessage({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // 로딩 상태 시작
    this.setState('isLoading', true);
    this.setState('error', null);
    
    try {
      // AI에게 메시지 전송
      const response = await chatService.sendMessage({
        message,
        mode: this.state.currentMode,
        difficulty: this.state.currentDifficulty
      });
      
      // AI 응답 추가
      this.addMessage({
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      
      // 에러 메시지 추가
      this.setState('error', error.message || '메시지 전송에 실패했습니다.');
      
    } finally {
      // 로딩 상태 종료
      this.setState('isLoading', false);
    }
  }
  
  /**
   * 모드 변경 처리
   */
  handleModeChange(eventData) {
    const { mode, difficulty } = eventData;
    
    this.setState('currentMode', mode);
    this.setState('currentDifficulty', difficulty);
    
    // 모드 변경 알림 메시지 추가
    this.addSystemMessage(`학습 모드가 ${this.getModeLabel(mode)}로 변경되었습니다.`);
  }
  
  /**
   * 난이도 변경 처리
   */
  handleDifficultyChange(eventData) {
    const { difficulty } = eventData;
    
    this.setState('currentDifficulty', difficulty);
    
    // 난이도 변경 알림 메시지 추가
    this.addSystemMessage(`난이도가 ${this.getDifficultyLabel(difficulty)}로 변경되었습니다.`);
  }
  
  /**
   * 메시지 추가
   */
  addMessage(message) {
    const { messages } = this.state;
    const { maxMessages } = this.options;
    
    // 최대 메시지 수 제한
    if (messages.length >= maxMessages) {
      messages.shift(); // 가장 오래된 메시지 제거
    }
    
    messages.push(message);
    this.setState('messages', [...messages]);
  }
  
  /**
   * 시스템 메시지 추가
   */
  addSystemMessage(content) {
    this.addMessage({
      role: 'system',
      content,
      timestamp: new Date()
    });
  }
  
  /**
   * 대화 기록 초기화
   */
  async clearConversation() {
    try {
      await chatService.clearConversation();
      this.setState('messages', []);
      this.addSystemMessage('대화 기록이 초기화되었습니다.');
    } catch (error) {
      console.error('대화 기록 초기화 실패:', error);
      this.setState('error', '대화 기록 초기화에 실패했습니다.');
    }
  }
  
  /**
   * 모드 라벨 반환
   */
  getModeLabel(mode) {
    const labels = {
      grammar: '문법',
      sentence: '문장',
      passage: '지문'
    };
    return labels[mode] || mode;
  }
  
  /**
   * 난이도 라벨 반환
   */
  getDifficultyLabel(difficulty) {
    const labels = {
      elementary: '초급',
      intermediate: '중급',
      advanced: '고급'
    };
    return labels[difficulty] || difficulty;
  }
  
  /**
   * 현재 설정 반환
   */
  getSettings() {
    return {
      mode: this.state.currentMode,
      difficulty: this.state.currentDifficulty,
      messageCount: this.state.messages.length
    };
  }
  
  /**
   * 설정 적용
   */
  setSettings(settings) {
    if (settings.mode) {
      this.setState('currentMode', settings.mode);
    }
    if (settings.difficulty) {
      this.setState('currentDifficulty', settings.difficulty);
    }
  }
  
  /**
   * 컴포넌트 마운트 후 실행
   */
  async onMount() {
    super.onMount();
    
    // 대화 기록 로드
    try {
      const conversation = await chatService.getConversation();
      if (conversation && conversation.length > 0) {
        this.setState('messages', conversation);
      }
    } catch (error) {
      console.error('대화 기록 로드 실패:', error);
    }
    
    // 재시도 버튼 이벤트 리스너
    const retryButton = this.element?.querySelector('[data-retry-button]');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        this.setState('error', null);
      });
    }
  }
}


