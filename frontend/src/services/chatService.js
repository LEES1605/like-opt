/**
 * 채팅 서비스 - AI 채팅 관련 API 호출
 */

import { apiClient } from './api.js';

export class ChatService {
  async sendMessage(messageData) {
    return await apiClient.post('/chat', messageData);
  }

  async getConversation() {
    return await apiClient.get('/conversation');
  }

  async clearConversation() {
    return await apiClient.delete('/conversation');
  }

  async setMode(mode, difficulty) {
    return await apiClient.post('/mode', { mode, difficulty });
  }
}

export const chatService = new ChatService();
