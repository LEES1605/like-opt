/**
 * API 클라이언트 단위 테스트
 */

import { ApiClient, ApiError, ApiUtils } from '../../src/services/api.js';

describe('ApiClient', () => {
  let apiClient;

  beforeEach(() => {
    apiClient = new ApiClient('/api/v1');
    fetch.mockClear();
  });

  describe('GET 요청', () => {
    test('성공적인 GET 요청', async () => {
      const mockResponse = { success: true, data: 'test' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.get('/test');

      expect(fetch).toHaveBeenCalledWith('/api/v1/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        signal: expect.any(AbortSignal),
      });
      expect(result).toEqual(mockResponse);
    });

    test('GET 요청 실패 (404)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not Found' }),
      });

      await expect(apiClient.get('/notfound')).rejects.toThrow(ApiError);
    });
  });

  describe('POST 요청', () => {
    test('성공적인 POST 요청', async () => {
      const requestData = { message: 'test' };
      const mockResponse = { success: true, response: 'Hello' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.post('/chat', requestData);

      expect(fetch).toHaveBeenCalledWith('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(requestData),
        signal: expect.any(AbortSignal),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('에러 처리', () => {
    test('네트워크 에러', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });

    test('타임아웃 에러', async () => {
      // AbortController를 모킹하여 타임아웃 시뮬레이션
      const originalAbortController = global.AbortController;
      global.AbortController = jest.fn().mockImplementation(() => ({
        abort: jest.fn(),
        signal: { aborted: true }
      }));

      fetch.mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100);
        })
      );

      await expect(apiClient.get('/test')).rejects.toThrow();
      
      global.AbortController = originalAbortController;
    });
  });

  describe('헬스 체크', () => {
    test('헬스 체크 성공', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      const result = await apiClient.healthCheck();
      expect(result).toBe(true);
    });

    test('헬스 체크 실패', async () => {
      fetch.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await apiClient.healthCheck();
      expect(result).toBe(false);
    });
  });
});

describe('ApiError', () => {
  test('ApiError 생성', () => {
    const error = new ApiError(404, 'Not Found');
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not Found');
  });
});

describe('ApiUtils', () => {
  describe('validateResponse', () => {
    test('유효한 응답 검증', () => {
      const response = { success: true, data: 'test' };
      expect(() => ApiUtils.validateResponse(response, ['success'])).not.toThrow();
    });

    test('필수 필드 누락', () => {
      const response = { data: 'test' };
      expect(() => ApiUtils.validateResponse(response, ['success'])).toThrow();
    });
  });

  describe('extractErrorMessage', () => {
    test('ApiError에서 메시지 추출', () => {
      const error = new ApiError(500, 'Server Error');
      expect(ApiUtils.extractErrorMessage(error)).toBe('Server Error');
    });

    test('일반 Error에서 메시지 추출', () => {
      const error = new Error('Network Error');
      expect(ApiUtils.extractErrorMessage(error)).toBe('Network Error');
    });
  });

  describe('retry', () => {
    test('재시도 성공', async () => {
      let attempts = 0;
      const mockFn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary error');
        }
        return 'success';
      });

      const result = await ApiUtils.retry(mockFn, 3, 10);
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('재시도 실패', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(ApiUtils.retry(mockFn, 2, 10)).rejects.toThrow('Persistent error');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});
