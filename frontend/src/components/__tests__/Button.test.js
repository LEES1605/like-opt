/**
 * @fileoverview Button 컴포넌트 테스트
 */

import { Button } from '../common/Button.js';

// Mock DOM 환경 설정
const mockDOM = () => {
  const container = document.createElement('div');
  container.id = 'test-container';
  document.body.appendChild(container);
  return container;
};

describe('Button Component', () => {
  let container;
  let button;

  beforeEach(() => {
    container = mockDOM();
  });

  afterEach(() => {
    if (button) {
      button.destroy();
    }
    if (container) {
      container.remove();
    }
  });

  test('기본 버튼 생성', () => {
    button = new Button({
      text: '테스트 버튼'
    });

    expect(button).toBeDefined();
    expect(button.options.text).toBe('테스트 버튼');
    expect(button.options.type).toBe('primary');
    expect(button.options.disabled).toBe(false);
  });

  test('버튼 렌더링', () => {
    button = new Button({
      text: '렌더링 테스트'
    });

    const html = button.renderTemplate();
    expect(html).toContain('렌더링 테스트');
    expect(html).toContain('btn btn-primary');
  });

  test('버튼 비활성화', () => {
    button = new Button({
      text: '비활성화 버튼',
      disabled: true
    });

    expect(button.options.disabled).toBe(true);
    
    const html = button.renderTemplate();
    expect(html).toContain('disabled');
  });

  test('버튼 텍스트 변경', () => {
    button = new Button({
      text: '원본 텍스트'
    });

    button.setText('변경된 텍스트');
    expect(button.state.text).toBe('변경된 텍스트');
  });

  test('버튼 팩토리 함수', () => {
    const { ButtonFactory } = require('../common/Button.js');
    const primaryButton = ButtonFactory.primary('Primary Button');
    expect(primaryButton.options.type).toBe('primary');
    expect(primaryButton.options.text).toBe('Primary Button');

    const secondaryButton = ButtonFactory.secondary('Secondary Button');
    expect(secondaryButton.options.type).toBe('secondary');
    expect(secondaryButton.options.text).toBe('Secondary Button');
  });

  test('버튼 상태 변경', () => {
    button = new Button({
      text: '상태 테스트'
    });

    button.disable();
    expect(button.state.disabled).toBe(true);

    button.enable();
    expect(button.state.disabled).toBe(false);

    button.setLoading(true);
    expect(button.state.loading).toBe(true);
  });
});
