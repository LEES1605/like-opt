/**
 * 채팅 컴포넌트 인덱스
 * Like-Opt 프론트엔드 채팅 컴포넌트 모음
 */

// 채팅 컴포넌트들
export { ChatInterface } from './ChatInterface.js';
export { MessageList } from './MessageList.js';
export { MessageInput } from './MessageInput.js';
export { ModeSelector } from './ModeSelector.js';
export { DifficultySelector } from './DifficultySelector.js';
export { AgentSelector } from './AgentSelector.js';

// 채팅 컴포넌트 팩토리
export const ChatComponentFactory = {
  /**
   * 채팅 인터페이스 생성
   */
  createChatInterface: (options = {}) => {
    return new ChatInterface(options);
  },
  
  /**
   * 메시지 리스트 생성
   */
  createMessageList: (options = {}) => {
    return new MessageList(options);
  },
  
  /**
   * 메시지 입력 생성
   */
  createMessageInput: (options = {}) => {
    return new MessageInput(options);
  },
  
  /**
   * 모드 선택기 생성
   */
  createModeSelector: (options = {}) => {
    return new ModeSelector(options);
  },
  
  /**
   * 난이도 선택기 생성
   */
  createDifficultySelector: (options = {}) => {
    return new DifficultySelector(options);
  },

  /**
   * 에이전트 선택기 생성
   */
  createAgentSelector: (options = {}) => {
    return new AgentSelector(options);
  }
};

// 채팅 컴포넌트 매니저
export const ChatComponentManager = {
  instances: new Map(),
  
  /**
   * 채팅 인터페이스 등록
   */
  registerChatInterface: (id, chatInterface) => {
    this.instances.set(`chat-${id}`, chatInterface);
  },
  
  /**
   * 채팅 인터페이스 가져오기
   */
  getChatInterface: (id) => {
    return this.instances.get(`chat-${id}`);
  },
  
  /**
   * 모든 채팅 인터페이스 가져오기
   */
  getAllChatInterfaces: () => {
    const chatInterfaces = [];
    for (const [key, instance] of this.instances) {
      if (key.startsWith('chat-')) {
        chatInterfaces.push(instance);
      }
    }
    return chatInterfaces;
  },
  
  /**
   * 채팅 인터페이스 제거
   */
  removeChatInterface: (id) => {
    const instance = this.instances.get(`chat-${id}`);
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy();
    }
    this.instances.delete(`chat-${id}`);
  },
  
  /**
   * 모든 채팅 컴포넌트 정리
   */
  cleanup: () => {
    for (const [key, instance] of this.instances) {
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
    }
    this.instances.clear();
  }
};

// 기본 export
export default {
  ChatComponentFactory,
  ChatComponentManager
};
