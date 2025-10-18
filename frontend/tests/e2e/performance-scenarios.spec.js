/**
 * 성능 시나리오 E2E 테스트
 * Playwright를 사용한 성능 및 부하 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('성능 시나리오', () => {
  test('페이지 로딩 성능', async ({ page }) => {
    // 페이지 로드 시간 측정
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // 로딩 시간 검증 (3초 이내)
    expect(loadTime).toBeLessThan(3000);
    console.log(`페이지 로딩 시간: ${loadTime}ms`);
    
    // Core Web Vitals 측정
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              vitals.fid = entry.processingStart - entry.startTime;
            }
            if (entry.entryType === 'layout-shift') {
              vitals.cls = entry.value;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // 5초 후 결과 반환
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    console.log('Core Web Vitals:', metrics);
  });

  test('빠른 연속 메시지 처리', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const messages = [
      '첫 번째 메시지',
      '두 번째 메시지',
      '세 번째 메시지',
      '네 번째 메시지',
      '다섯 번째 메시지'
    ];
    
    const startTime = Date.now();
    
    // 연속으로 메시지 전송
    for (const message of messages) {
      await page.locator('[data-message-input]').fill(message);
      await page.locator('[data-send-button]').click();
      
      // AI 응답 대기
      await expect(page.locator('.message-ai')).toBeVisible({ timeout: 30000 });
      
      // 다음 메시지 전송 전 잠시 대기
      await page.waitForTimeout(100);
    }
    
    const totalTime = Date.now() - startTime;
    const averageTime = totalTime / messages.length;
    
    console.log(`총 처리 시간: ${totalTime}ms`);
    console.log(`평균 응답 시간: ${averageTime}ms`);
    
    // 평균 응답 시간이 10초 이내인지 확인
    expect(averageTime).toBeLessThan(10000);
    
    // 모든 메시지가 올바르게 표시되었는지 확인
    const messageElements = page.locator('.message');
    await expect(messageElements).toHaveCount(messages.length * 2); // 사용자 + AI 응답
  });

  test('긴 대화 메모리 사용량', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 초기 메모리 사용량 측정
    const initialMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // 20개의 메시지 전송
    for (let i = 1; i <= 20; i++) {
      await page.locator('[data-message-input]').fill(`긴 대화 테스트 메시지 ${i}`);
      await page.locator('[data-send-button]').click();
      await expect(page.locator('.message-ai')).toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(100);
    }
    
    // 최종 메모리 사용량 측정
    const finalMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
    
    console.log(`메모리 증가량: ${memoryIncreaseMB.toFixed(2)}MB`);
    
    // 메모리 증가량이 100MB 이내인지 확인
    expect(memoryIncreaseMB).toBeLessThan(100);
  });

  test('동시 사용자 시뮬레이션', async ({ browser }) => {
    // 5개의 동시 브라우저 컨텍스트 생성
    const contexts = await Promise.all(
      Array(5).fill().map(() => browser.newContext())
    );
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );
    
    try {
      // 모든 페이지에서 동시에 메시지 전송
      const startTime = Date.now();
      
      await Promise.all(
        pages.map(async (page, index) => {
          await page.goto('/');
          await page.waitForLoadState('networkidle');
          
          await page.locator('[data-message-input]').fill(`동시 사용자 ${index + 1} 메시지`);
          await page.locator('[data-send-button]').click();
          
          await expect(page.locator('.message-ai')).toBeVisible({ timeout: 30000 });
        })
      );
      
      const totalTime = Date.now() - startTime;
      console.log(`동시 사용자 처리 시간: ${totalTime}ms`);
      
      // 모든 요청이 30초 이내에 완료되었는지 확인
      expect(totalTime).toBeLessThan(30000);
      
    } finally {
      // 리소스 정리
      await Promise.all(contexts.map(context => context.close()));
    }
  });

  test('네트워크 지연 시나리오', async ({ page, context }) => {
    // 네트워크 지연 시뮬레이션
    await context.route('**/api/**', async (route) => {
      // 2초 지연 추가
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    
    // 메시지 전송
    await page.locator('[data-message-input]').fill('지연 테스트 메시지');
    await page.locator('[data-send-button]').click();
    
    // 로딩 상태 확인
    await expect(page.locator('.loading-indicator')).toBeVisible();
    
    // AI 응답 대기
    await expect(page.locator('.message-ai')).toBeVisible({ timeout: 30000 });
    
    const responseTime = Date.now() - startTime;
    console.log(`지연 환경 응답 시간: ${responseTime}ms`);
    
    // 지연이 있어도 30초 이내에 응답하는지 확인
    expect(responseTime).toBeLessThan(30000);
  });

  test('메모리 누수 검사', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 가비지 컬렉션 강제 실행
    await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });
    
    // 초기 메모리 측정
    const initialMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // 여러 번의 메시지 전송 및 대화 초기화 반복
    for (let cycle = 0; cycle < 5; cycle++) {
      // 메시지 전송
      for (let i = 0; i < 3; i++) {
        await page.locator('[data-message-input]').fill(`사이클 ${cycle} 메시지 ${i}`);
        await page.locator('[data-send-button]').click();
        await expect(page.locator('.message-ai')).toBeVisible({ timeout: 30000 });
      }
      
      // 대화 초기화
      await page.locator('[data-clear-conversation]').click();
      await page.locator('.modal-confirm').click();
      
      // 가비지 컬렉션
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });
      
      await page.waitForTimeout(1000);
    }
    
    // 최종 메모리 측정
    const finalMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
    
    console.log(`메모리 누수 검사 - 증가량: ${memoryIncreaseMB.toFixed(2)}MB`);
    
    // 메모리 증가량이 50MB 이내인지 확인 (메모리 누수 없음)
    expect(memoryIncreaseMB).toBeLessThan(50);
  });

  test('대용량 데이터 처리', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 긴 텍스트 메시지 전송
    const longMessage = 'A'.repeat(10000); // 10KB 텍스트
    
    const startTime = Date.now();
    
    await page.locator('[data-message-input]').fill(longMessage);
    await page.locator('[data-send-button]').click();
    
    // AI 응답 대기
    await expect(page.locator('.message-ai')).toBeVisible({ timeout: 30000 });
    
    const responseTime = Date.now() - startTime;
    console.log(`대용량 데이터 처리 시간: ${responseTime}ms`);
    
    // 대용량 데이터도 30초 이내에 처리되는지 확인
    expect(responseTime).toBeLessThan(30000);
    
    // 메시지가 올바르게 표시되었는지 확인
    const messageContent = await page.locator('.message-user .message-content').textContent();
    expect(messageContent).toContain('A'.repeat(100));
  });

  test('브라우저 호환성', async ({ page }) => {
    // 다양한 브라우저 기능 테스트
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // WebSocket 연결 테스트 (스트리밍)
    const wsSupported = await page.evaluate(() => {
      return typeof WebSocket !== 'undefined';
    });
    expect(wsSupported).toBe(true);
    
    // Fetch API 지원 테스트
    const fetchSupported = await page.evaluate(() => {
      return typeof fetch !== 'undefined';
    });
    expect(fetchSupported).toBe(true);
    
    // ES6+ 기능 지원 테스트
    const es6Supported = await page.evaluate(() => {
      try {
        const test = () => {};
        const obj = { ...{ a: 1 } };
        return true;
      } catch (e) {
        return false;
      }
    });
    expect(es6Supported).toBe(true);
  });
});