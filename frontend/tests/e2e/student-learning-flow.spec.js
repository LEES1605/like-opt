/**
 * 학생 학습 플로우 E2E 테스트
 * Playwright를 사용한 전체 사용자 시나리오 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('학생 학습 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 페이지로 이동
    await page.goto('/');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
  });

  test('기본 채팅 인터페이스 로딩', async ({ page }) => {
    // 헤더 확인
    await expect(page.locator('h1')).toContainText('Like-Opt');
    
    // 채팅 인터페이스 확인
    await expect(page.locator('.chat-interface')).toBeVisible();
    
    // 메시지 입력 필드 확인
    await expect(page.locator('[data-message-input]')).toBeVisible();
    
    // 전송 버튼 확인
    await expect(page.locator('[data-send-button]')).toBeVisible();
  });

  test('메시지 전송 및 AI 응답', async ({ page }) => {
    // 메시지 입력
    const messageInput = page.locator('[data-message-input]');
    await messageInput.fill('영어 문법을 배우고 싶습니다');
    
    // 전송 버튼 클릭
    await page.locator('[data-send-button]').click();
    
    // 로딩 상태 확인
    await expect(page.locator('.loading-indicator')).toBeVisible();
    
    // AI 응답 대기 (최대 30초)
    await expect(page.locator('.message-ai')).toBeVisible({ timeout: 30000 });
    
    // AI 응답 내용 확인
    const aiResponse = page.locator('.message-ai .message-content');
    await expect(aiResponse).toContainText('Professor G');
  });

  test('학습 모드 변경', async ({ page }) => {
    // 모드 선택기 확인
    await expect(page.locator('.mode-selector')).toBeVisible();
    
    // 문장 분석 모드로 변경
    await page.locator('[data-mode="sentence"]').click();
    
    // 모드 변경 확인
    await expect(page.locator('[data-mode="sentence"]')).toHaveClass(/active/);
    
    // 난이도 변경
    await page.locator('[data-difficulty="advanced"]').click();
    
    // 난이도 변경 확인
    await expect(page.locator('[data-difficulty="advanced"]')).toHaveClass(/active/);
  });

  test('대화 기록 관리', async ({ page }) => {
    // 첫 번째 메시지 전송
    await page.locator('[data-message-input]').fill('첫 번째 메시지');
    await page.locator('[data-send-button]').click();
    await expect(page.locator('.message-ai')).toBeVisible({ timeout: 30000 });
    
    // 두 번째 메시지 전송
    await page.locator('[data-message-input]').fill('두 번째 메시지');
    await page.locator('[data-send-button]').click();
    await expect(page.locator('.message-ai')).toBeVisible({ timeout: 30000 });
    
    // 대화 기록 확인
    const messages = page.locator('.message');
    await expect(messages).toHaveCount(4); // 사용자 2개 + AI 2개
    
    // 대화 초기화 버튼 클릭
    await page.locator('[data-clear-conversation]').click();
    
    // 확인 모달에서 확인 클릭
    await page.locator('.modal-confirm').click();
    
    // 대화 기록 초기화 확인
    await expect(messages).toHaveCount(0);
  });

  test('반응형 디자인', async ({ page }) => {
    // 데스크톱 뷰포트
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.chat-interface')).toBeVisible();
    
    // 태블릿 뷰포트
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.chat-interface')).toBeVisible();
    
    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.chat-interface')).toBeVisible();
    
    // 모바일에서 사이드바 토글 확인
    await expect(page.locator('.mobile-menu-toggle')).toBeVisible();
  });

  test('키보드 단축키', async ({ page }) => {
    // 메시지 입력 필드에 포커스
    await page.locator('[data-message-input]').focus();
    
    // 메시지 입력
    await page.locator('[data-message-input]').fill('키보드 테스트');
    
    // Enter 키로 전송
    await page.keyboard.press('Enter');
    
    // AI 응답 대기
    await expect(page.locator('.message-ai')).toBeVisible({ timeout: 30000 });
  });

  test('에러 처리', async ({ page }) => {
    // 네트워크 오프라인 시뮬레이션
    await page.context().setOffline(true);
    
    // 메시지 전송 시도
    await page.locator('[data-message-input]').fill('오프라인 테스트');
    await page.locator('[data-send-button]').click();
    
    // 에러 메시지 확인
    await expect(page.locator('.error-message')).toBeVisible();
    
    // 네트워크 복구
    await page.context().setOffline(false);
    
    // 재시도 버튼 클릭
    await page.locator('[data-retry-button]').click();
    
    // 정상 응답 확인
    await expect(page.locator('.message-ai')).toBeVisible({ timeout: 30000 });
  });

  test('접근성', async ({ page }) => {
    // 키보드 네비게이션 테스트
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-message-input]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-send-button]')).toBeFocused();
    
    // ARIA 레이블 확인
    await expect(page.locator('[data-message-input]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-send-button]')).toHaveAttribute('aria-label');
    
    // 스크린 리더 지원 확인
    await expect(page.locator('.chat-interface')).toHaveAttribute('role', 'main');
  });

  test('성능 메트릭', async ({ page }) => {
    // 페이지 로드 시간 측정
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // 3초 이내
    
    // 메모리 사용량 확인 (개발자 도구 필요)
    const metrics = await page.evaluate(() => {
      return {
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize
        } : null
      };
    });
    
    if (metrics.memory) {
      expect(metrics.memory.used).toBeLessThan(50 * 1024 * 1024); // 50MB 이내
    }
  });
});