/**
 * 관리자 관리 플로우 E2E 테스트
 * Playwright를 사용한 관리자 기능 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('관리자 관리 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('관리자 로그인 모달', async ({ page }) => {
    // 관리자 버튼 클릭
    await page.locator('[data-admin-button]').click();
    
    // 로그인 모달 확인
    await expect(page.locator('.admin-login-modal')).toBeVisible();
    
    // 모달 제목 확인
    await expect(page.locator('.modal-title')).toContainText('관리자 로그인');
    
    // 비밀번호 입력 필드 확인
    await expect(page.locator('[data-password-input]')).toBeVisible();
    
    // 로그인 버튼 확인
    await expect(page.locator('[data-login-button]')).toBeVisible();
    
    // 취소 버튼 확인
    await expect(page.locator('[data-cancel-button]')).toBeVisible();
  });

  test('관리자 로그인 실패', async ({ page }) => {
    // 관리자 로그인 모달 열기
    await page.locator('[data-admin-button]').click();
    
    // 잘못된 비밀번호 입력
    await page.locator('[data-password-input]').fill('wrong-password');
    await page.locator('[data-login-button]').click();
    
    // 에러 메시지 확인
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('잘못된 비밀번호');
    
    // 모달이 여전히 열려있는지 확인
    await expect(page.locator('.admin-login-modal')).toBeVisible();
  });

  test('관리자 로그인 성공', async ({ page }) => {
    // 관리자 로그인 모달 열기
    await page.locator('[data-admin-button]').click();
    
    // 올바른 비밀번호 입력 (환경변수 또는 테스트 설정에서 가져옴)
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await page.locator('[data-password-input]').fill(adminPassword);
    await page.locator('[data-login-button]').click();
    
    // 관리자 패널 표시 확인
    await expect(page.locator('.admin-panel')).toBeVisible();
    
    // 로그인 모달이 닫혔는지 확인
    await expect(page.locator('.admin-login-modal')).not.toBeVisible();
  });

  test('관리자 패널 기능', async ({ page }) => {
    // 관리자 로그인
    await page.locator('[data-admin-button]').click();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await page.locator('[data-password-input]').fill(adminPassword);
    await page.locator('[data-login-button]').click();
    
    // 관리자 패널 확인
    await expect(page.locator('.admin-panel')).toBeVisible();
    
    // 질문모드 관리 카드 확인
    await expect(page.locator('.question-mode-card')).toBeVisible();
    
    // Professor G 토글 확인
    await expect(page.locator('[data-professor-g-toggle]')).toBeVisible();
    
    // 학습 모드 토글 확인
    await expect(page.locator('[data-learning-mode-toggle]')).toBeVisible();
  });

  test('Professor G 토글 기능', async ({ page }) => {
    // 관리자 로그인
    await page.locator('[data-admin-button]').click();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await page.locator('[data-password-input]').fill(adminPassword);
    await page.locator('[data-login-button]').click();
    
    // Professor G 토글 클릭
    const toggle = page.locator('[data-professor-g-toggle]');
    await toggle.click();
    
    // 토글 상태 변경 확인
    await expect(toggle).toHaveAttribute('data-checked', 'true');
    
    // 다시 클릭하여 비활성화
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-checked', 'false');
  });

  test('학습 모드 토글 기능', async ({ page }) => {
    // 관리자 로그인
    await page.locator('[data-admin-button]').click();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await page.locator('[data-password-input]').fill(adminPassword);
    await page.locator('[data-login-button]').click();
    
    // 학습 모드 토글 클릭
    const toggle = page.locator('[data-learning-mode-toggle]');
    await toggle.click();
    
    // 토글 상태 변경 확인
    await expect(toggle).toHaveAttribute('data-checked', 'true');
  });

  test('인덱싱 실행', async ({ page }) => {
    // 관리자 로그인
    await page.locator('[data-admin-button]').click();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await page.locator('[data-password-input]').fill(adminPassword);
    await page.locator('[data-login-button]').click();
    
    // 인덱싱 실행 버튼 클릭
    await page.locator('[data-run-indexing]').click();
    
    // 확인 모달에서 확인 클릭
    await page.locator('.modal-confirm').click();
    
    // 인덱싱 진행 상태 확인
    await expect(page.locator('.indexing-progress')).toBeVisible();
    
    // 인덱싱 완료 대기 (최대 60초)
    await expect(page.locator('.indexing-complete')).toBeVisible({ timeout: 60000 });
  });

  test('백업 생성', async ({ page }) => {
    // 관리자 로그인
    await page.locator('[data-admin-button]').click();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await page.locator('[data-password-input]').fill(adminPassword);
    await page.locator('[data-login-button]').click();
    
    // 백업 생성 버튼 클릭
    await page.locator('[data-create-backup]').click();
    
    // 백업 생성 진행 상태 확인
    await expect(page.locator('.backup-progress')).toBeVisible();
    
    // 백업 완료 대기 (최대 30초)
    await expect(page.locator('.backup-complete')).toBeVisible({ timeout: 30000 });
    
    // 성공 메시지 확인
    await expect(page.locator('.success-message')).toContainText('백업이 성공적으로 생성되었습니다');
  });

  test('백업 목록 조회', async ({ page }) => {
    // 관리자 로그인
    await page.locator('[data-admin-button]').click();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await page.locator('[data-password-input]').fill(adminPassword);
    await page.locator('[data-login-button]').click();
    
    // 백업 목록 조회 버튼 클릭
    await page.locator('[data-list-backups]').click();
    
    // 백업 목록 표시 확인
    await expect(page.locator('.backup-list')).toBeVisible();
    
    // 백업 항목이 있는지 확인
    const backupItems = page.locator('.backup-item');
    await expect(backupItems.first()).toBeVisible();
  });

  test('백업 복원', async ({ page }) => {
    // 관리자 로그인
    await page.locator('[data-admin-button]').click();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await page.locator('[data-password-input]').fill(adminPassword);
    await page.locator('[data-login-button]').click();
    
    // 백업 목록 조회
    await page.locator('[data-list-backups]').click();
    await expect(page.locator('.backup-list')).toBeVisible();
    
    // 첫 번째 백업 항목의 복원 버튼 클릭
    await page.locator('.backup-item').first().locator('[data-restore-backup]').click();
    
    // 확인 모달에서 확인 클릭
    await page.locator('.modal-confirm').click();
    
    // 복원 진행 상태 확인
    await expect(page.locator('.restore-progress')).toBeVisible();
    
    // 복원 완료 대기 (최대 30초)
    await expect(page.locator('.restore-complete')).toBeVisible({ timeout: 30000 });
  });

  test('관리자 로그아웃', async ({ page }) => {
    // 관리자 로그인
    await page.locator('[data-admin-button]').click();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await page.locator('[data-password-input]').fill(adminPassword);
    await page.locator('[data-login-button]').click();
    
    // 관리자 패널 확인
    await expect(page.locator('.admin-panel')).toBeVisible();
    
    // 로그아웃 버튼 클릭
    await page.locator('[data-admin-logout]').click();
    
    // 확인 모달에서 확인 클릭
    await page.locator('.modal-confirm').click();
    
    // 관리자 패널이 닫혔는지 확인
    await expect(page.locator('.admin-panel')).not.toBeVisible();
    
    // 일반 사용자 인터페이스로 돌아갔는지 확인
    await expect(page.locator('.chat-interface')).toBeVisible();
  });

  test('관리자 권한 검증', async ({ page }) => {
    // 관리자 로그인 없이 관리자 기능 접근 시도
    await page.goto('/admin');
    
    // 로그인 페이지로 리다이렉트되거나 접근 거부 확인
    await expect(page.locator('.admin-login-modal')).toBeVisible();
  });

  test('관리자 세션 만료', async ({ page }) => {
    // 관리자 로그인
    await page.locator('[data-admin-button]').click();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await page.locator('[data-password-input]').fill(adminPassword);
    await page.locator('[data-login-button]').click();
    
    // 관리자 패널 확인
    await expect(page.locator('.admin-panel')).toBeVisible();
    
    // 세션 만료 시뮬레이션 (페이지 새로고침)
    await page.reload();
    
    // 관리자 패널이 닫혔는지 확인
    await expect(page.locator('.admin-panel')).not.toBeVisible();
  });
});