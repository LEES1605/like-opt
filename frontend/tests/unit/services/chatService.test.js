/**
 * 채팅 서비스 단위 테스트
 */

import { ChatService, ChatError } from '../../../src/services/chatService.js';
import { apiClient } from '../../../src/services/api.js';

// API 클라이언트 모킹
jest.mock('../../../src/services/api.js', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    stream: jest.fn(),
    healthCheck: jest.fn(),
  },
}));

describe('ChatService', () => {
  let chatService;

  beforeEach(() => {
    chatService = new ChatService();
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    test('성공적인 메시지 전송', async () => {
      const messageData = {
        message: 'Hello',
        mode: 'grammar',
        difficulty: 'intermediate'
      };
      const mockResponse = { success: true, response: 'Hello! I am Professor G.' };

      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await chatService.sendMessage(messageData);

      expect(apiClient.post).toHaveBeenCalledWith('/chat', {
        ...messageData,
        stream: false
      });
      expect(result).toEqual(mockResponse);
      expect(chatService.conversation).toHaveLength(2);
      expect(chatService.conversation[0].role).toBe('user');
      expect(chatService.conversation[1].role).toBe('assistant');
    });

    test('메시지 전송 실패', async () => {
      const messageData = { message: 'Hello' };
      const error = new Error('Network error');

      apiClient.post.mockRejectedValueOnce(error);

      await expect(chatService.sendMessage(messageData)).rejects.toThrow(ChatError);
      expect(chatService.conversation).toHaveLength(0);
    });
  });

  describe('sendMessageStream', () => {
    test('성공적인 스트림 메시지 전송', async () => {
      const messageData = { message: 'Hello' };
      const onChunk = jest.fn();

      apiClient.stream.mockImplementationOnce(async (endpoint, data, callback) => {
        callback('Hello');
        callback('! I am');
        callback(' Professor G.');
      });

      const result = await chatService.sendMessageStream(messageData, onChunk);

      expect(apiClient.stream).toHaveBeenCalledWith('/chat', {
        ...messageData,
        stream: true
      }, expect.any(Function));
      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(result.response).toBe('Hello! I am Professor G.');
      expect(chatService.conversation).toHaveLength(2);
    });
  });

  describe('getConversation', () => {
    test('대화 기록 조회 성공', async () => {
      const mockConversation = [
        { role: 'user', content: 'Hello', timestamp: new Date() },
        { role: 'assistant', content: 'Hi!', timestamp: new Date() }
      ];

      apiClient.get.mockResolvedValueOnce(mockConversation);

      const result = await chatService.getConversation();

      expect(apiClient.get).toHaveBeenCalledWith('/conversation');
      expect(result).toEqual(mockConversation);
      expect(chatService.conversation).toEqual(mockConversation);
    });

    test('대화 기록 조회 실패 시 로컬 캐시 반환', async () => {
      const localConversation = [{ role: 'user', content: 'Hello' }];
      chatService.conversation = localConversation;

      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await chatService.getConversation();

      expect(result).toEqual(localConversation);
    });
  });

  describe('clearConversation', () => {
    test('대화 기록 초기화 성공', async () => {
      chatService.conversation = [{ role: 'user', content: 'Hello' }];
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await chatService.clearConversation();

      expect(apiClient.delete).toHaveBeenCalledWith('/conversation');
      expect(result).toBe(true);
      expect(chatService.conversation).toHaveLength(0);
    });

    test('대화 기록 초기화 실패', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Server error'));

      await expect(chatService.clearConversation()).rejects.toThrow(ChatError);
    });
  });

  describe('setMode', () => {
    test('모드 설정 성공', async () => {
      apiClient.post.mockResolvedValueOnce({ success: true });

      const result = await chatService.setMode('sentence', 'advanced');

      expect(apiClient.post).toHaveBeenCalledWith('/mode', {
        mode: 'sentence',
        difficulty: 'advanced'
      });
      expect(result).toBe(true);
      expect(chatService.currentMode).toBe('sentence');
      expect(chatService.currentDifficulty).toBe('advanced');
    });
  });

  describe('checkConnection', () => {
    test('연결 상태 확인 성공', async () => {
      apiClient.healthCheck.mockResolvedValueOnce(true);

      const result = await chatService.checkConnection();

      expect(result).toBe(true);
      expect(chatService.connectionStatus).toBe('connected');
    });

    test('연결 상태 확인 실패', async () => {
      apiClient.healthCheck.mockResolvedValueOnce(false);

      const result = await chatService.checkConnection();

      expect(result).toBe(false);
      expect(chatService.connectionStatus).toBe('disconnected');
    });
  });

  describe('getState', () => {
    test('현재 상태 반환', () => {
      chatService.conversation = [{ role: 'user', content: 'Hello' }];
      chatService.currentMode = 'grammar';
      chatService.currentDifficulty = 'intermediate';
      chatService.isLoading = true;
      chatService.connectionStatus = 'connected';

      const state = chatService.getState();

      expect(state).toEqual({
        conversation: [{ role: 'user', content: 'Hello' }],
        currentMode: 'grammar',
        currentDifficulty: 'intermediate',
        isLoading: true,
        connectionStatus: 'connected'
      });
    });
  });
});

describe('ChatError', () => {
  test('ChatError 생성', () => {
    const originalError = new Error('Network error');
    const error = new ChatError('메시지 전송 실패', originalError);

    expect(error.name).toBe('ChatError');
    expect(error.message).toBe('메시지 전송 실패');
    expect(error.originalError).toBe(originalError);
  });
});
