/**
 * ChatService 테스트
 * Like-Opt 프론트엔드 ChatService 테스트
 */

import { ChatService, ChatError } from '../chatService.js';
import { apiClient } from '../api.js';

// apiClient 모킹
jest.mock('../api.js', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn()
  }
}));

describe('ChatService', () => {
  let chatService;
  
  beforeEach(() => {
    chatService = new ChatService();
    
    // 모킹 초기화
    apiClient.post.mockClear();
    apiClient.get.mockClear();
    apiClient.delete.mockClear();
  });
  
  describe('기본 초기화', () => {
    test('ChatService가 올바르게 초기화되어야 함', () => {
      expect(chatService).toBeInstanceOf(ChatService);
      expect(chatService.getState()).toEqual({
        messages: [],
        currentMode: 'grammar',
        currentDifficulty: 'intermediate',
        isConnected: false,
        conversationId: null
      });
    });
  });
  
  describe('메시지 전송', () => {
    test('일반 메시지 전송이 올바르게 작동해야 함', async () => {
      const messageData = {
        content: '안녕하세요',
        role: 'user',
        mode: 'grammar',
        difficulty: 'intermediate'
      };
      
      const mockResponse = {
        success: true,
        message: {
          id: '1',
          content: '안녕하세요! 무엇을 도와드릴까요?',
          role: 'assistant',
          timestamp: new Date().toISOString()
        }
      };
      
      apiClient.post.mockResolvedValue(mockResponse);
      
      const result = await chatService.sendMessage(messageData);
      
      expect(apiClient.post).toHaveBeenCalledWith('/api/chat', messageData);
      expect(result).toEqual(mockResponse);
    });
    
    test('스트리밍 메시지 전송이 올바르게 작동해야 함', async () => {
      const messageData = {
        content: '안녕하세요',
        role: 'user',
        mode: 'grammar',
        difficulty: 'intermediate'
      };
      
      const mockChunks = [
        '안녕',
        '하세요',
        '!'
      ];
      
      const onChunk = jest.fn();
      
      // 스트리밍 응답 모킹
      apiClient.post.mockImplementation((url, data, options) => {
        if (options?.stream) {
          // 스트리밍 응답 시뮬레이션
          setTimeout(() => onChunk('안녕'), 10);
          setTimeout(() => onChunk('하세요'), 20);
          setTimeout(() => onChunk('!'), 30);
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: true });
      });
      
      const result = await chatService.sendMessageStream(messageData, onChunk);
      
      expect(apiClient.post).toHaveBeenCalledWith('/api/chat', messageData, { stream: true });
      expect(result.success).toBe(true);
    });
    
    test('메시지 전송 실패 시 ChatError가 발생해야 함', async () => {
      const messageData = {
        content: '테스트 메시지',
        role: 'user'
      };
      
      const mockError = new Error('네트워크 오류');
      apiClient.post.mockRejectedValue(mockError);
      
      await expect(chatService.sendMessage(messageData)).rejects.toThrow(ChatError);
    });
    
    test('잘못된 메시지 데이터로 전송 시 ChatError가 발생해야 함', async () => {
      const invalidMessageData = {
        // content가 없음
        role: 'user'
      };
      
      await expect(chatService.sendMessage(invalidMessageData)).rejects.toThrow(ChatError);
    });
  });
  
  describe('대화 관리', () => {
    test('대화 내역을 올바르게 가져와야 함', async () => {
      const mockConversation = {
        success: true,
        messages: [
          {
            id: '1',
            content: '안녕하세요',
            role: 'user',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            content: '안녕하세요! 무엇을 도와드릴까요?',
            role: 'assistant',
            timestamp: new Date().toISOString()
          }
        ]
      };
      
      apiClient.get.mockResolvedValue(mockConversation);
      
      const result = await chatService.getConversation();
      
      expect(apiClient.get).toHaveBeenCalledWith('/api/conversation');
      expect(result).toEqual(mockConversation);
    });
    
    test('대화를 올바르게 지워야 함', async () => {
      const mockResponse = {
        success: true,
        message: '대화가 지워졌습니다.'
      };
      
      apiClient.delete.mockResolvedValue(mockResponse);
      
      const result = await chatService.clearConversation();
      
      expect(apiClient.delete).toHaveBeenCalledWith('/api/conversation');
      expect(result).toEqual(mockResponse);
    });
    
    test('대화 지우기 실패 시 ChatError가 발생해야 함', async () => {
      const mockError = new Error('서버 오류');
      apiClient.delete.mockRejectedValue(mockError);
      
      await expect(chatService.clearConversation()).rejects.toThrow(ChatError);
    });
  });
  
  describe('모드 설정', () => {
    test('학습 모드가 올바르게 설정되어야 함', async () => {
      const modeData = {
        mode: 'sentence',
        difficulty: 'advanced'
      };
      
      const mockResponse = {
        success: true,
        message: '모드가 설정되었습니다.'
      };
      
      apiClient.post.mockResolvedValue(mockResponse);
      
      const result = await chatService.setMode('sentence', 'advanced');
      
      expect(apiClient.post).toHaveBeenCalledWith('/api/mode', modeData);
      expect(result).toEqual(mockResponse);
    });
    
    test('모드 설정 실패 시 ChatError가 발생해야 함', async () => {
      const mockError = new Error('모드 설정 실패');
      apiClient.post.mockRejectedValue(mockError);
      
      await expect(chatService.setMode('invalid', 'invalid')).rejects.toThrow(ChatError);
    });
  });
  
  describe('연결 상태 확인', () => {
    test('연결 상태가 올바르게 확인되어야 함', async () => {
      const mockResponse = {
        success: true,
        status: 'connected',
        timestamp: new Date().toISOString()
      };
      
      apiClient.get.mockResolvedValue(mockResponse);
      
      const result = await chatService.checkConnection();
      
      expect(apiClient.get).toHaveBeenCalledWith('/api/health');
      expect(result).toEqual(mockResponse);
    });
    
    test('연결 실패 시 ChatError가 발생해야 함', async () => {
      const mockError = new Error('연결 실패');
      apiClient.get.mockRejectedValue(mockError);
      
      await expect(chatService.checkConnection()).rejects.toThrow(ChatError);
    });
  });
  
  describe('상태 관리', () => {
    test('현재 상태가 올바르게 반환되어야 함', () => {
      const state = chatService.getState();
      
      expect(state).toHaveProperty('messages');
      expect(state).toHaveProperty('currentMode');
      expect(state).toHaveProperty('currentDifficulty');
      expect(state).toHaveProperty('isConnected');
      expect(state).toHaveProperty('conversationId');
    });
    
    test('상태가 올바르게 업데이트되어야 함', () => {
      const newState = {
        currentMode: 'passage',
        currentDifficulty: 'elementary'
      };
      
      chatService.setState(newState);
      
      const state = chatService.getState();
      expect(state.currentMode).toBe('passage');
      expect(state.currentDifficulty).toBe('elementary');
    });
  });
  
  describe('에러 처리', () => {
    test('ChatError가 올바르게 생성되어야 함', () => {
      const error = new ChatError('테스트 에러', 'TEST_ERROR');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ChatError);
      expect(error.message).toBe('테스트 에러');
      expect(error.code).toBe('TEST_ERROR');
    });
    
    test('ChatError가 올바르게 스택 트레이스를 가져야 함', () => {
      const error = new ChatError('테스트 에러');
      
      expect(error.stack).toBeTruthy();
      expect(error.stack).toContain('ChatError');
    });
  });
  
  describe('타임아웃 처리', () => {
    test('요청 타임아웃이 올바르게 처리되어야 함', async () => {
      const messageData = {
        content: '테스트 메시지',
        role: 'user'
      };
      
      // 타임아웃 시뮬레이션
      apiClient.post.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );
      
      await expect(chatService.sendMessage(messageData)).rejects.toThrow(ChatError);
    });
  });
  
  describe('재시도 로직', () => {
    test('일시적 오류 시 재시도가 올바르게 작동해야 함', async () => {
      const messageData = {
        content: '테스트 메시지',
        role: 'user'
      };
      
      let callCount = 0;
      apiClient.post.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve({ success: true });
      });
      
      const result = await chatService.sendMessage(messageData);
      
      expect(callCount).toBe(3);
      expect(result.success).toBe(true);
    });
  });
  
  describe('데이터 검증', () => {
    test('메시지 데이터가 올바르게 검증되어야 함', async () => {
      const invalidMessageData = {
        content: '', // 빈 내용
        role: 'user'
      };
      
      await expect(chatService.sendMessage(invalidMessageData)).rejects.toThrow(ChatError);
    });
    
    test('모드 데이터가 올바르게 검증되어야 함', async () => {
      await expect(chatService.setMode('invalid_mode', 'invalid_difficulty')).rejects.toThrow(ChatError);
    });
  });
  
  describe('성능', () => {
    test('동시 요청이 올바르게 처리되어야 함', async () => {
      const messageData = {
        content: '테스트 메시지',
        role: 'user'
      };
      
      apiClient.post.mockResolvedValue({ success: true });
      
      const promises = Array(10).fill().map(() => chatService.sendMessage(messageData));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      expect(results.every(result => result.success)).toBe(true);
    });
  });
});
