/**
 * API Client - 백엔드 API 통신
 */

/**
 * API 클라이언트 클래스
 */
class ApiClient {
  constructor() {
    this.baseURL = 'http://localhost:5001/api/v1';
    this.timeout = 10000;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }
  
  /**
   * HTTP 요청 기본 메서드
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
      headers: { ...this.headers, ...options.headers },
      timeout: options.timeout || this.timeout,
      ...options
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }
    
    try {
      console.log(`🌐 API 요청: ${method} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ API 응답: ${method} ${url}`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ API 오류: ${method} ${url}`, error);
      throw error;
    }
  }
  
  /**
   * GET 요청
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }
  
  /**
   * POST 요청
   */
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }
  
  /**
   * PUT 요청
   */
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }
  
  /**
   * PATCH 요청
   */
  async patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options);
  }
  
  /**
   * DELETE 요청
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }
  
  /**
   * 헬스 체크
   */
  async healthCheck() {
    return this.get('/health');
  }
  
  /**
   * 채팅 메시지 전송
   */
  async sendMessage(message, options = {}) {
    return this.post('/chat', {
      message,
      ...options
    });
  }
  
  /**
   * 대화 내역 조회
   */
  async getConversation() {
    return this.get('/conversation');
  }
  
  /**
   * 관리자 로그인
   */
  async adminLogin(password) {
    return this.post('/admin/login', { password });
  }
  
  /**
   * 관리자 로그아웃
   */
  async adminLogout() {
    return this.post('/admin/logout');
  }
}

// 전역 API 클라이언트 인스턴스
export const apiClient = new ApiClient();

/**
 * API 유틸리티 함수들
 */
export const ApiUtils = {
  /**
   * API 응답 검증
   */
  validateResponse(response) {
    if (!response || typeof response !== 'object') {
      throw new Error('유효하지 않은 API 응답입니다.');
    }
    return response;
  },
  
  /**
   * 에러 메시지 추출
   */
  extractErrorMessage(error) {
    if (error.response && error.response.data) {
      return error.response.data.message || error.response.data.error;
    }
    return error.message || '알 수 없는 오류가 발생했습니다.';
  },
  
  /**
   * 재시도 로직
   */
  async retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }
};