/**
 * API 클라이언트 - 백엔드 API와의 통신을 담당
 * Like-Opt 프론트엔드 API 통합
 */

/**
 * 기본 API 클라이언트 클래스
 */
export class ApiClient {
  constructor(baseURL = '/api/v1') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };
    this.timeout = 30000; // 30초
    this.retryCount = 3;
    this.retryDelay = 1000;
  }

  /**
   * 기본 HTTP 요청 메서드
   */
  async request(method, endpoint, data = null, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        method,
        headers: { ...this.defaultHeaders, ...options.headers },
        signal: controller.signal,
        ...options
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(response.status, errorData.error || 'API 요청 실패');
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiError(408, '요청 시간 초과');
      }
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
   * 스트리밍 요청
   */
  async stream(endpoint, data, onChunk) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new ApiError(response.status, '스트림 요청 실패');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        onChunk(chunk);
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 헬스 체크
   */
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return response.status === 'ok';
    } catch (error) {
      console.error('헬스 체크 실패:', error);
      return false;
    }
  }

  /**
   * 재시도 로직이 포함된 요청
   */
  async requestWithRetry(method, endpoint, data = null, options = {}) {
    let lastError;
    
    for (let i = 0; i < this.retryCount; i++) {
      try {
        return await this.request(method, endpoint, data, options);
      } catch (error) {
        lastError = error;
        
        // 재시도하지 않을 에러들
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        if (i < this.retryCount - 1) {
          const delay = this.retryDelay * Math.pow(2, i);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * API 유틸리티 함수들
 */
export const ApiUtils = {
  /**
   * 응답 데이터 검증
   */
  validateResponse(response, requiredFields = []) {
    if (!response || typeof response !== 'object') {
      throw new ApiError(400, '유효하지 않은 응답 형식');
    }

    for (const field of requiredFields) {
      if (!(field in response)) {
        throw new ApiError(400, `필수 필드 누락: ${field}`);
      }
    }

    return true;
  },

  /**
   * 에러 메시지 추출
   */
  extractErrorMessage(error) {
    if (error instanceof ApiError) {
      return error.message;
    }
    
    if (error.response && error.response.data && error.response.data.error) {
      return error.response.data.error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return '알 수 없는 오류가 발생했습니다.';
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

// 전역 API 클라이언트 인스턴스
export const apiClient = new ApiClient();