/**
 * 에이전트 서비스
 * 에이전트 선택, 프롬프트 관리, 통계 조회 기능
 */

import { apiClient, ApiError } from './api.js';

export class AgentService {
  constructor() {
    this.currentAgent = null;
    this.agents = {};
    this.agentStats = {};
  }

  /**
   * 모든 에이전트 정보 조회
   * @returns {Promise<Object>} 에이전트 정보
   */
  async getAgents() {
    try {
      const response = await apiClient.get('/agents');
      
      if (response.success) {
        this.agents = response.agents;
        this.currentAgent = response.current_agent;
        return response;
      } else {
        throw new ApiError(500, response.error || '에이전트 조회 실패');
      }
    } catch (error) {
      throw new ApiError(error.status || 500, `에이전트 조회 실패: ${error.message}`);
    }
  }

  /**
   * 특정 에이전트 정보 조회
   * @param {string} agentId - 에이전트 ID
   * @returns {Promise<Object>} 에이전트 정보
   */
  async getAgent(agentId) {
    try {
      const response = await apiClient.get(`/agents/${agentId}`);
      
      if (response.success) {
        return response;
      } else {
        throw new ApiError(500, response.error || '에이전트 조회 실패');
      }
    } catch (error) {
      throw new ApiError(error.status || 500, `에이전트 조회 실패: ${error.message}`);
    }
  }

  /**
   * 현재 선택된 에이전트 조회
   * @returns {Promise<Object>} 현재 에이전트 정보
   */
  async getCurrentAgent() {
    try {
      const response = await apiClient.get('/agents/current');
      
      if (response.success) {
        this.currentAgent = response.current_agent;
        return response;
      } else {
        throw new ApiError(500, response.error || '현재 에이전트 조회 실패');
      }
    } catch (error) {
      throw new ApiError(error.status || 500, `현재 에이전트 조회 실패: ${error.message}`);
    }
  }

  /**
   * 현재 에이전트 설정
   * @param {string} agentId - 에이전트 ID
   * @returns {Promise<Object>} 설정 결과
   */
  async setCurrentAgent(agentId) {
    try {
      const response = await apiClient.post('/agents/current', {
        agent_id: agentId
      });
      
      if (response.success) {
        this.currentAgent = agentId;
        return response;
      } else {
        throw new ApiError(500, response.error || '에이전트 설정 실패');
      }
    } catch (error) {
      throw new ApiError(error.status || 500, `에이전트 설정 실패: ${error.message}`);
    }
  }

  /**
   * 에이전트별 시스템 프롬프트 조회
   * @param {string} agentId - 에이전트 ID
   * @param {string} mode - 학습 모드
   * @param {string} difficulty - 난이도
   * @returns {Promise<Object>} 프롬프트 정보
   */
  async getAgentPrompt(agentId, mode = 'grammar', difficulty = 'intermediate') {
    try {
      const response = await apiClient.get(`/agents/${agentId}/prompt`, {
        mode: mode,
        difficulty: difficulty
      });
      
      if (response.success) {
        return response;
      } else {
        throw new ApiError(500, response.error || '프롬프트 조회 실패');
      }
    } catch (error) {
      throw new ApiError(error.status || 500, `프롬프트 조회 실패: ${error.message}`);
    }
  }

  /**
   * 에이전트별 인사말 조회
   * @param {string} agentId - 에이전트 ID
   * @returns {Promise<Object>} 인사말 정보
   */
  async getAgentGreeting(agentId) {
    try {
      const response = await apiClient.get(`/agents/${agentId}/greeting`);
      
      if (response.success) {
        return response;
      } else {
        throw new ApiError(500, response.error || '인사말 조회 실패');
      }
    } catch (error) {
      throw new ApiError(error.status || 500, `인사말 조회 실패: ${error.message}`);
    }
  }

  /**
   * 커스텀 에이전트 생성
   * @param {Object} agentData - 에이전트 데이터
   * @returns {Promise<Object>} 생성 결과
   */
  async createAgent(agentData) {
    try {
      const response = await apiClient.post('/agents', agentData);
      
      if (response.success) {
        // 로컬 에이전트 목록 업데이트
        await this.getAgents();
        return response;
      } else {
        throw new ApiError(500, response.error || '에이전트 생성 실패');
      }
    } catch (error) {
      throw new ApiError(error.status || 500, `에이전트 생성 실패: ${error.message}`);
    }
  }

  /**
   * 에이전트 정보 업데이트
   * @param {string} agentId - 에이전트 ID
   * @param {Object} updates - 업데이트 데이터
   * @returns {Promise<Object>} 업데이트 결과
   */
  async updateAgent(agentId, updates) {
    try {
      const response = await apiClient.put(`/agents/${agentId}`, updates);
      
      if (response.success) {
        // 로컬 에이전트 목록 업데이트
        await this.getAgents();
        return response;
      } else {
        throw new ApiError(500, response.error || '에이전트 업데이트 실패');
      }
    } catch (error) {
      throw new ApiError(error.status || 500, `에이전트 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 에이전트 삭제
   * @param {string} agentId - 에이전트 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteAgent(agentId) {
    try {
      const response = await apiClient.delete(`/agents/${agentId}`);
      
      if (response.success) {
        // 로컬 에이전트 목록 업데이트
        await this.getAgents();
        return response;
      } else {
        throw new ApiError(500, response.error || '에이전트 삭제 실패');
      }
    } catch (error) {
      throw new ApiError(error.status || 500, `에이전트 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 에이전트 통계 정보 조회
   * @returns {Promise<Object>} 통계 정보
   */
  async getAgentStatistics() {
    try {
      const response = await apiClient.get('/agents/statistics');
      
      if (response.success) {
        this.agentStats = response.statistics;
        return response;
      } else {
        throw new ApiError(500, response.error || '통계 조회 실패');
      }
    } catch (error) {
      throw new ApiError(error.status || 500, `통계 조회 실패: ${error.message}`);
    }
  }

  /**
   * 에이전트별 응답 템플릿 조회
   * @param {string} agentId - 에이전트 ID
   * @param {string} templateType - 템플릿 타입
   * @returns {string} 응답 템플릿
   */
  getResponseTemplate(agentId, templateType) {
    const agent = this.agents[agentId];
    if (!agent || !agent.response_templates) {
      return '';
    }
    
    return agent.response_templates[templateType] || '';
  }

  /**
   * 에이전트별 인사말 조회 (로컬)
   * @param {string} agentId - 에이전트 ID
   * @returns {string} 인사말
   */
  getGreeting(agentId) {
    const agent = this.agents[agentId];
    return agent ? agent.greeting : '안녕하세요! 오늘은 어떤 문법을 함께 공부해볼까요?';
  }

  /**
   * 에이전트별 성격 조회 (로컬)
   * @param {string} agentId - 에이전트 ID
   * @returns {string} 성격 설명
   */
  getPersonality(agentId) {
    const agent = this.agents[agentId];
    return agent ? agent.personality : '';
  }

  /**
   * 에이전트별 스타일 조회 (로컬)
   * @param {string} agentId - 에이전트 ID
   * @returns {string} 스타일
   */
  getStyle(agentId) {
    const agent = this.agents[agentId];
    return agent ? agent.style : 'formal';
  }

  /**
   * 현재 에이전트 정보 조회 (로컬)
   * @returns {Object|null} 현재 에이전트 정보
   */
  getCurrentAgentInfo() {
    if (!this.currentAgent || !this.agents[this.currentAgent]) {
      return null;
    }
    
    return this.agents[this.currentAgent];
  }

  /**
   * 에이전트 목록 필터링
   * @param {string} style - 스타일 필터
   * @returns {Array} 필터링된 에이전트 목록
   */
  filterAgentsByStyle(style) {
    return Object.values(this.agents).filter(agent => agent.style === style);
  }

  /**
   * 에이전트 검색
   * @param {string} query - 검색 쿼리
   * @returns {Array} 검색 결과
   */
  searchAgents(query) {
    const lowerQuery = query.toLowerCase();
    return Object.values(this.agents).filter(agent => 
      agent.name.toLowerCase().includes(lowerQuery) ||
      agent.description.toLowerCase().includes(lowerQuery) ||
      agent.personality.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 에이전트 사용 통계 기록
   * @param {string} agentId - 에이전트 ID
   */
  recordUsage(agentId) {
    if (!this.agentStats.usage_stats) {
      this.agentStats.usage_stats = {};
    }
    
    if (!this.agentStats.usage_stats[agentId]) {
      this.agentStats.usage_stats[agentId] = 0;
    }
    
    this.agentStats.usage_stats[agentId]++;
  }

  /**
   * 에이전트 설정 로드 (로컬 스토리지)
   */
  loadSettings() {
    try {
      const savedAgentId = localStorage.getItem('selectedAgent');
      if (savedAgentId && this.agents[savedAgentId]) {
        this.currentAgent = savedAgentId;
      }
    } catch (error) {
      console.error('에이전트 설정 로드 실패:', error);
    }
  }

  /**
   * 에이전트 설정 저장 (로컬 스토리지)
   */
  saveSettings() {
    try {
      if (this.currentAgent) {
        localStorage.setItem('selectedAgent', this.currentAgent);
      }
    } catch (error) {
      console.error('에이전트 설정 저장 실패:', error);
    }
  }

  /**
   * 에이전트 초기화
   */
  async initialize() {
    try {
      await this.getAgents();
      this.loadSettings();
      return true;
    } catch (error) {
      console.error('에이전트 서비스 초기화 실패:', error);
      return false;
    }
  }
}

export class AgentError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'AgentError';
    this.status = status;
  }
}

// 전역 인스턴스
export const agentService = new AgentService();
