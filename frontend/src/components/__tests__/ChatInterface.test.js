/**
 * ChatInterface 컴포넌트 테스트
 * Like-Opt 프론트엔드 ChatInterface 컴포넌트 테스트
 */

import { ChatInterface } from '../chat/ChatInterface.js';
import { chatService } from '../../services/chatService.js';

// DOM 환경 설정
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

// chatService 모킹
jest.mock('../../services/chatService.js', () => ({
  chatService: {
    sendMessage: jest.fn(),
    sendMessageStream: jest.fn(),
    getConversation: jest.fn(),
    clearConversation: jest.fn(),
    setMode: jest.fn(),
    getState: jest.fn(() => ({
      messages: [],
      currentMode: 'grammar',
      currentDifficulty: 'intermediate'
    }))
  }
}));

describe('ChatInterface 컴포넌트', () => {
  let container;
  let chatInterface;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // chatService 모킹 초기화
    chatService.sendMessage.mockClear();
    chatService.sendMessageStream.mockClear();
    chatService.getConversation.mockClear();
    chatService.clearConversation.mockClear();
    chatService.setMode.mockClear();
  });
  
  afterEach(() => {
    if (chatInterface) {
      chatInterface.destroy();
    }
    document.body.removeChild(container);
  });
  
  describe('기본 렌더링', () => {
    test('채팅 인터페이스가 올바르게 렌더링되어야 함', () => {
      chatInterface = new ChatInterface({
        initialMode: 'grammar',
        initialDifficulty: 'intermediate'
      });
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      expect(element).toBeTruthy();
      expect(element.classList.contains('chat-interface')).toBe(true);
      expect(element.querySelector('.chat-header')).toBeTruthy();
      expect(element.querySelector('.chat-body')).toBeTruthy();
      expect(element.querySelector('.chat-footer')).toBeTruthy();
    });
    
    test('모드 선택기가 올바르게 렌더링되어야 함', () => {
      chatInterface = new ChatInterface({
        showModeSelector: true
      });
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      const modeSelector = element.querySelector('.mode-selector');
      expect(modeSelector).toBeTruthy();
      
      const modeButtons = modeSelector.querySelectorAll('.mode-button');
      expect(modeButtons).toHaveLength(3); // grammar, sentence, passage
    });
    
    test('난이도 선택기가 올바르게 렌더링되어야 함', () => {
      chatInterface = new ChatInterface({
        showModeSelector: true
      });
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      const difficultySelector = element.querySelector('.difficulty-buttons');
      expect(difficultySelector).toBeTruthy();
      
      const difficultyButtons = difficultySelector.querySelectorAll('.difficulty-button');
      expect(difficultyButtons).toHaveLength(3); // elementary, intermediate, advanced
    });
  });
  
  describe('상태 관리', () => {
    test('초기 모드가 올바르게 설정되어야 함', () => {
      chatInterface = new ChatInterface({
        initialMode: 'sentence',
        initialDifficulty: 'advanced'
      });
      
      expect(chatInterface.state.currentMode).toBe('sentence');
      expect(chatInterface.state.currentDifficulty).toBe('advanced');
    });
    
    test('모드 변경이 올바르게 작동해야 함', () => {
      chatInterface = new ChatInterface({
        initialMode: 'grammar'
      });
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      // 모드 변경
      chatInterface.setMode('sentence');
      
      expect(chatInterface.state.currentMode).toBe('sentence');
      expect(chatService.setMode).toHaveBeenCalledWith('sentence', 'intermediate');
    });
    
    test('난이도 변경이 올바르게 작동해야 함', () => {
      chatInterface = new ChatInterface({
        initialDifficulty: 'intermediate'
      });
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      // 난이도 변경
      chatInterface.setDifficulty('advanced');
      
      expect(chatInterface.state.currentDifficulty).toBe('advanced');
      expect(chatService.setMode).toHaveBeenCalledWith('grammar', 'advanced');
    });
  });
  
  describe('메시지 처리', () => {
    test('메시지가 올바르게 추가되어야 함', () => {
      chatInterface = new ChatInterface();
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      const message = {
        id: '1',
        content: '안녕하세요',
        role: 'user',
        timestamp: new Date()
      };
      
      chatInterface.addMessage(message);
      
      expect(chatInterface.state.messages).toContain(message);
    });
    
    test('시스템 메시지가 올바르게 추가되어야 함', () => {
      chatInterface = new ChatInterface();
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      chatInterface.addSystemMessage('시스템 메시지입니다.');
      
      expect(chatInterface.state.messages).toHaveLength(1);
      expect(chatInterface.state.messages[0].role).toBe('system');
      expect(chatInterface.state.messages[0].content).toBe('시스템 메시지입니다.');
    });
    
    test('대화가 올바르게 지워져야 함', async () => {
      chatInterface = new ChatInterface();
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      // 메시지 추가
      chatInterface.addMessage({
        id: '1',
        content: '테스트 메시지',
        role: 'user',
        timestamp: new Date()
      });
      
      expect(chatInterface.state.messages).toHaveLength(1);
      
      // 대화 지우기
      await chatInterface.clearConversation();
      
      expect(chatInterface.state.messages).toHaveLength(0);
      expect(chatService.clearConversation).toHaveBeenCalled();
    });
  });
  
  describe('메시지 전송', () => {
    test('메시지 전송이 올바르게 작동해야 함', async () => {
      chatInterface = new ChatInterface();
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      // 메시지 전송 모킹
      chatService.sendMessage.mockResolvedValue({
        success: true,
        message: {
          id: '1',
          content: '응답 메시지',
          role: 'assistant',
          timestamp: new Date()
        }
      });
      
      const messageData = {
        content: '안녕하세요',
        role: 'user'
      };
      
      await chatInterface.handleSendMessage({ message: messageData });
      
      expect(chatService.sendMessage).toHaveBeenCalledWith({
        content: '안녕하세요',
        role: 'user',
        mode: 'grammar',
        difficulty: 'intermediate'
      });
    });
    
    test('스트리밍 메시지 전송이 올바르게 작동해야 함', async () => {
      chatInterface = new ChatInterface({
        useStreaming: true
      });
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      // 스트리밍 메시지 전송 모킹
      chatService.sendMessageStream.mockImplementation((messageData, onChunk) => {
        // 스트리밍 응답 시뮬레이션
        setTimeout(() => onChunk('안녕'), 10);
        setTimeout(() => onChunk('하세요'), 20);
        setTimeout(() => onChunk('!'), 30);
        return Promise.resolve({ success: true });
      });
      
      const messageData = {
        content: '안녕하세요',
        role: 'user'
      };
      
      await chatInterface.handleSendMessage({ message: messageData });
      
      expect(chatService.sendMessageStream).toHaveBeenCalled();
    });
  });
  
  describe('이벤트 처리', () => {
    test('모드 변경 이벤트가 올바르게 처리되어야 함', () => {
      chatInterface = new ChatInterface();
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      // 모드 변경 이벤트 발생
      chatInterface.handleModeChange({ mode: 'sentence' });
      
      expect(chatInterface.state.currentMode).toBe('sentence');
      expect(chatService.setMode).toHaveBeenCalledWith('sentence', 'intermediate');
    });
    
    test('난이도 변경 이벤트가 올바르게 처리되어야 함', () => {
      chatInterface = new ChatInterface();
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      // 난이도 변경 이벤트 발생
      chatInterface.handleDifficultyChange({ difficulty: 'advanced' });
      
      expect(chatInterface.state.currentDifficulty).toBe('advanced');
      expect(chatService.setMode).toHaveBeenCalledWith('grammar', 'advanced');
    });
  });
  
  describe('에러 처리', () => {
    test('메시지 전송 실패 시 에러가 올바르게 처리되어야 함', async () => {
      chatInterface = new ChatInterface();
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      // 메시지 전송 실패 모킹
      chatService.sendMessage.mockRejectedValue(new Error('전송 실패'));
      
      const messageData = {
        content: '테스트 메시지',
        role: 'user'
      };
      
      await chatInterface.handleSendMessage({ message: messageData });
      
      // 에러 메시지가 표시되어야 함
      expect(chatInterface.state.error).toBeTruthy();
    });
    
    test('대화 지우기 실패 시 에러가 올바르게 처리되어야 함', async () => {
      chatInterface = new ChatInterface();
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      // 대화 지우기 실패 모킹
      chatService.clearConversation.mockRejectedValue(new Error('지우기 실패'));
      
      await chatInterface.clearConversation();
      
      // 에러 메시지가 표시되어야 함
      expect(chatInterface.state.error).toBeTruthy();
    });
  });
  
  describe('설정 관리', () => {
    test('설정이 올바르게 가져와져야 함', () => {
      chatInterface = new ChatInterface({
        initialMode: 'sentence',
        initialDifficulty: 'advanced'
      });
      
      const settings = chatInterface.getSettings();
      
      expect(settings.mode).toBe('sentence');
      expect(settings.difficulty).toBe('advanced');
    });
    
    test('설정이 올바르게 설정되어야 함', () => {
      chatInterface = new ChatInterface();
      
      const newSettings = {
        mode: 'passage',
        difficulty: 'elementary'
      };
      
      chatInterface.setSettings(newSettings);
      
      expect(chatInterface.state.currentMode).toBe('passage');
      expect(chatInterface.state.currentDifficulty).toBe('elementary');
    });
  });
  
  describe('접근성', () => {
    test('채팅 인터페이스에 적절한 ARIA 속성이 있어야 함', () => {
      chatInterface = new ChatInterface();
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      expect(element.getAttribute('role')).toBe('main');
      expect(element.getAttribute('aria-label')).toBe('AI 채팅 인터페이스');
    });
    
    test('모드 선택기에 적절한 ARIA 속성이 있어야 함', () => {
      chatInterface = new ChatInterface({
        showModeSelector: true
      });
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      const modeSelector = element.querySelector('.mode-selector');
      expect(modeSelector.getAttribute('role')).toBe('tablist');
      expect(modeSelector.getAttribute('aria-label')).toBe('학습 모드 선택');
    });
  });
  
  describe('성능', () => {
    test('많은 메시지가 있어도 성능이 유지되어야 함', () => {
      chatInterface = new ChatInterface({
        maxMessages: 1000
      });
      
      const element = chatInterface.render();
      container.appendChild(element);
      
      // 많은 메시지 추가
      for (let i = 0; i < 1000; i++) {
        chatInterface.addMessage({
          id: i.toString(),
          content: `메시지 ${i}`,
          role: 'user',
          timestamp: new Date()
        });
      }
      
      expect(chatInterface.state.messages).toHaveLength(1000);
      
      // 렌더링 시간 측정
      const startTime = performance.now();
      chatInterface.reRender();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // 100ms 이내
    });
  });
});
