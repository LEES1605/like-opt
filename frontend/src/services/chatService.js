/**
 * Chat Service - 채팅 관련 API 통신
 */

import { apiClient, ApiError } from './api.js';

/**
 * 채팅 서비스 클래스
 */
export class ChatService {
  constructor() {
    this.conversation = [];
    this.currentMode = 'grammar';
    this.currentDifficulty = 'intermediate';
    this.isLoading = false;
    this.connectionStatus = 'disconnected';
  }

  /**
   * 메시지 전송 (일반)
   */
  async sendMessage(messageData) {
    try {
      this.isLoading = true;
      this.connectionStatus = 'connecting';
      
      const response = await apiClient.post('/chat', {
        ...messageData,
        stream: false
      });
      
      // 대화 기록에 추가
      this.conversation.push(
        { 
          role: 'user', 
          content: messageData.message, 
          timestamp: new Date(),
          mode: this.currentMode,
          difficulty: this.currentDifficulty
        },
        { 
          role: 'assistant', 
          content: response.response, 
          timestamp: new Date(),
          mode: this.currentMode,
          difficulty: this.currentDifficulty
        }
      );
      
      this.connectionStatus = 'connected';
      return response;
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      this.connectionStatus = 'error';
      throw new ChatError('메시지 전송에 실패했습니다.', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 메시지 전송 (스트리밍)
   */
  async sendMessageStream(messageData, onChunk) {
    try {
      this.isLoading = true;
      this.connectionStatus = 'connecting';
      let fullResponse = '';
      
      await apiClient.stream('/chat', {
        ...messageData,
        stream: true
      }, (chunk) => {
        fullResponse += chunk;
        onChunk(chunk);
      });
      
      // 대화 기록에 추가
      this.conversation.push(
        { 
          role: 'user', 
          content: messageData.message, 
          timestamp: new Date(),
          mode: this.currentMode,
          difficulty: this.currentDifficulty
        },
        { 
          role: 'assistant', 
          content: fullResponse, 
          timestamp: new Date(),
          mode: this.currentMode,
          difficulty: this.currentDifficulty
        }
      );
      
      this.connectionStatus = 'connected';
      return { success: true, response: fullResponse };
    } catch (error) {
      console.error('스트림 메시지 전송 실패:', error);
      this.connectionStatus = 'error';
      throw new ChatError('메시지 전송에 실패했습니다.', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 대화 기록 조회
   */
  async getConversation() {
    try {
      const response = await apiClient.get('/conversation');
      this.conversation = response;
      return response;
    } catch (error) {
      console.error('대화 기록 조회 실패:', error);
      return this.conversation; // 로컬 캐시 반환
    }
  }

  /**
   * 대화 기록 초기화
   */
  async clearConversation() {
    try {
      await apiClient.delete('/conversation');
      this.conversation = [];
      return true;
    } catch (error) {
      console.error('대화 기록 초기화 실패:', error);
      throw new ChatError('대화 기록 초기화에 실패했습니다.', error);
    }
  }

  /**
   * 학습 모드 설정
   */
  async setMode(mode, difficulty) {
    try {
      await apiClient.post('/mode', { mode, difficulty });
      this.currentMode = mode;
      this.currentDifficulty = difficulty;
      return true;
    } catch (error) {
      console.error('모드 설정 실패:', error);
      throw new ChatError('모드 설정에 실패했습니다.', error);
    }
  }

  /**
   * 연결 상태 확인
   */
  async checkConnection() {
    try {
      const isHealthy = await apiClient.healthCheck();
      this.connectionStatus = isHealthy ? 'connected' : 'disconnected';
      return isHealthy;
    } catch (error) {
      this.connectionStatus = 'error';
      return false;
    }
  }

  /**
   * 현재 상태 반환
   */
  getState() {
    return {
      conversation: this.conversation,
      currentMode: this.currentMode,
      currentDifficulty: this.currentDifficulty,
      isLoading: this.isLoading,
      connectionStatus: this.connectionStatus
    };
  }
}

/**
 * 채팅 에러 클래스
 */
export class ChatError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'ChatError';
    this.originalError = originalError;
  }
}

// 전역 채팅 서비스 인스턴스
export const chatService = new ChatService();