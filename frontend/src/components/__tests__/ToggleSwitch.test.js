/**
 * @fileoverview ToggleSwitch 컴포넌트 테스트
 */

import { ToggleSwitch } from '../common/ToggleSwitch.js';

// Mock DOM 환경 설정
const mockDOM = () => {
  const container = document.createElement('div');
  container.id = 'test-container';
  document.body.appendChild(container);
  return container;
};

describe('ToggleSwitch Component', () => {
  let container;
  let toggleSwitch;

  beforeEach(() => {
    container = mockDOM();
  });

  afterEach(() => {
    if (toggleSwitch) {
      toggleSwitch.destroy();
    }
    if (container) {
      container.remove();
    }
  });

  test('기본 토글 스위치 생성', () => {
    toggleSwitch = new ToggleSwitch({
      label: '테스트 토글'
    });

    expect(toggleSwitch).toBeDefined();
    expect(toggleSwitch.options.label).toBe('테스트 토글');
    expect(toggleSwitch.state.checked).toBe(false);
  });

  test('토글 스위치 렌더링', () => {
    toggleSwitch = new ToggleSwitch({
      label: '렌더링 테스트',
      checked: true
    });

    const html = toggleSwitch.renderTemplate();
    expect(html).toContain('렌더링 테스트');
    expect(html).toContain('toggle-switch');
    expect(html).toContain('checked');
  });

  test('토글 체크 상태 설정', () => {
    toggleSwitch = new ToggleSwitch({
      label: '체크 상태 설정 테스트',
      checked: true
    });

    expect(toggleSwitch.options.checked).toBe(true);
    expect(toggleSwitch.state.checked).toBe(true);
  });

  test('토글 비활성화', () => {
    toggleSwitch = new ToggleSwitch({
      label: '비활성화 테스트',
      disabled: true
    });

    expect(toggleSwitch.options.disabled).toBe(true);
    expect(toggleSwitch.state.disabled).toBe(true);
  });

  test('토글 상태 변경', () => {
    toggleSwitch = new ToggleSwitch({
      label: '상태 변경 테스트'
    });

    expect(toggleSwitch.state.checked).toBe(false);
    
    toggleSwitch.setChecked(true);
    expect(toggleSwitch.state.checked).toBe(true);
    
    toggleSwitch.setChecked(false);
    expect(toggleSwitch.state.checked).toBe(false);
  });

  test('토글 토글 기능', () => {
    toggleSwitch = new ToggleSwitch({
      label: '토글 기능 테스트'
    });

    expect(toggleSwitch.state.checked).toBe(false);
    
    toggleSwitch.toggle();
    expect(toggleSwitch.state.checked).toBe(true);
    
    toggleSwitch.toggle();
    expect(toggleSwitch.state.checked).toBe(false);
  });

  test('토글 크기 설정', () => {
    const smallToggle = new ToggleSwitch({
      label: '작은 토글',
      size: 'small'
    });

    const largeToggle = new ToggleSwitch({
      label: '큰 토글',
      size: 'large'
    });

    expect(smallToggle.options.size).toBe('small');
    expect(largeToggle.options.size).toBe('large');
  });

  test('토글 색상 설정', () => {
    const successToggle = new ToggleSwitch({
      label: '성공 토글',
      color: 'success'
    });

    const dangerToggle = new ToggleSwitch({
      label: '위험 토글',
      color: 'danger'
    });

    expect(successToggle.options.color).toBe('success');
    expect(dangerToggle.options.color).toBe('danger');
  });
});
