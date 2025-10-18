/**
 * API 통합 테스트
 * 실제 백엔드 서버와의 통신 테스트
 */

import { apiClient } from '../../src/services/api.js';
import { chatService } from '../../src/services/chatService.js';
import { adminService } from '../../src/services/adminService.js';

describe('API 통합 테스트', () => {
  const TEST_BASE_URL = 'http://localhost:5001/api/v1';
  
  beforeAll(() => {
    // 테스트용 API 클라이언트 설정
    apiClient.baseURL = TEST_BASE_URL;
  });

  describe('헬스 체크', () => {
    test('서버 연결 확인', async () => {
      const isHealthy = await apiClient.healthCheck();
      expect(typeof isHealthy).toBe('boolean');
    }, 10000);
  });

  describe('채팅 API 통합', () => {
    test('메시지 전송 테스트', async () => {
      try {
        const response = await chatService.sendMessage({
          message: 'Hello, Professor G!',
          mode: 'grammar',
          difficulty: 'intermediate'
        });

        expect(response).toHaveProperty('success');
        expect(response).toHaveProperty('response');
        expect(typeof response.response).toBe('string');
      } catch (error) {
        // 서버가 실행되지 않은 경우 스킵
        if (error.message.includes('fetch')) {
          console.log('⚠️ 백엔드 서버가 실행되지 않아 테스트를 스킵합니다.');
          return;
        }
        throw error;
      }
    }, 15000);

    test('대화 기록 조회', async () => {
      try {
        const conversation = await chatService.getConversation();
        expect(Array.isArray(conversation)).toBe(true);
      } catch (error) {
        if (error.message.includes('fetch')) {
          console.log('⚠️ 백엔드 서버가 실행되지 않아 테스트를 스킵합니다.');
          return;
        }
        throw error;
      }
    }, 10000);

    test('대화 기록 초기화', async () => {
      try {
        const result = await chatService.clearConversation();
        expect(result).toBe(true);
      } catch (error) {
        if (error.message.includes('fetch')) {
          console.log('⚠️ 백엔드 서버가 실행되지 않아 테스트를 스킵합니다.');
          return;
        }
        throw error;
      }
    }, 10000);

    test('학습 모드 설정', async () => {
      try {
        const result = await chatService.setMode('sentence', 'advanced');
        expect(result).toBe(true);
        expect(chatService.currentMode).toBe('sentence');
        expect(chatService.currentDifficulty).toBe('advanced');
      } catch (error) {
        if (error.message.includes('fetch')) {
          console.log('⚠️ 백엔드 서버가 실행되지 않아 테스트를 스킵합니다.');
          return;
        }
        throw error;
      }
    }, 10000);
  });

  describe('관리자 API 통합', () => {
    test('관리자 로그인 (잘못된 비밀번호)', async () => {
      try {
        const result = await adminService.login('wrong-password');
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      } catch (error) {
        if (error.message.includes('fetch')) {
          console.log('⚠️ 백엔드 서버가 실행되지 않아 테스트를 스킵합니다.');
          return;
        }
        throw error;
      }
    }, 10000);

    test('인덱싱 상태 조회', async () => {
      try {
        const status = await adminService.getIndexingStatus();
        expect(status).toHaveProperty('is_ready');
        expect(status).toHaveProperty('indexed_file_count');
      } catch (error) {
        if (error.message.includes('fetch')) {
          console.log('⚠️ 백엔드 서버가 실행되지 않아 테스트를 스킵합니다.');
          return;
        }
        throw error;
      }
    }, 10000);

    test('백업 목록 조회', async () => {
      try {
        const backups = await adminService.listBackups();
        expect(Array.isArray(backups)).toBe(true);
      } catch (error) {
        if (error.message.includes('fetch')) {
          console.log('⚠️ 백엔드 서버가 실행되지 않아 테스트를 스킵합니다.');
          return;
        }
        throw error;
      }
    }, 10000);
  });

  describe('에러 처리 통합', () => {
    test('존재하지 않는 엔드포인트', async () => {
      try {
        await apiClient.get('/nonexistent');
        fail('404 에러가 발생해야 합니다.');
      } catch (error) {
        expect(error.status).toBe(404);
      }
    }, 10000);

    test('잘못된 요청 데이터', async () => {
      try {
        await apiClient.post('/chat', { invalid: 'data' });
        fail('400 에러가 발생해야 합니다.');
      } catch (error) {
        expect([400, 422]).toContain(error.status);
      }
    }, 10000);
  });

  describe('성능 테스트', () => {
    test('API 응답 시간', async () => {
      const startTime = Date.now();
      
      try {
        await apiClient.healthCheck();
        const responseTime = Date.now() - startTime;
        
        expect(responseTime).toBeLessThan(5000); // 5초 이내
        console.log(`API 응답 시간: ${responseTime}ms`);
      } catch (error) {
        if (error.message.includes('fetch')) {
          console.log('⚠️ 백엔드 서버가 실행되지 않아 테스트를 스킵합니다.');
          return;
        }
        throw error;
      }
    }, 10000);

    test('동시 요청 처리', async () => {
      try {
        const promises = Array(5).fill().map(() => apiClient.healthCheck());
        const results = await Promise.all(promises);
        
        expect(results).toHaveLength(5);
        results.forEach(result => {
          expect(typeof result).toBe('boolean');
        });
      } catch (error) {
        if (error.message.includes('fetch')) {
          console.log('⚠️ 백엔드 서버가 실행되지 않아 테스트를 스킵합니다.');
          return;
        }
        throw error;
      }
    }, 15000);
  });
});
