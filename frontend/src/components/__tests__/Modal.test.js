/**
 * @fileoverview Modal 컴포넌트 테스트
 */

import { Modal } from '../common/Modal.js';

// Mock DOM 환경 설정
const mockDOM = () => {
  const container = document.createElement('div');
  container.id = 'test-container';
  document.body.appendChild(container);
  return container;
};

describe('Modal Component', () => {
  let container;
  let modal;

  beforeEach(() => {
    container = mockDOM();
  });

  afterEach(() => {
    if (modal) {
      modal.destroy();
    }
    if (container) {
      container.remove();
    }
  });

  test('기본 모달 생성', () => {
    modal = new Modal({
      title: '테스트 모달',
      content: '테스트 내용'
    });

    expect(modal).toBeDefined();
    expect(modal.options.title).toBe('테스트 모달');
    expect(modal.options.content).toBe('테스트 내용');
    expect(modal.state.visible).toBe(false);
  });

  test('모달 열기/닫기', () => {
    modal = new Modal({
      title: '열기/닫기 테스트',
      content: '테스트 내용'
    });

    // 열기
    modal.show();
    expect(modal.state.visible).toBe(true);

    // 닫기
    modal.hide();
    expect(modal.state.visible).toBe(false);
  });

  test('모달 렌더링', () => {
    modal = new Modal({
      title: '렌더링 테스트',
      content: '테스트 내용',
      visible: true
    });

    const html = modal.renderTemplate();
    expect(html).toContain('렌더링 테스트');
    expect(html).toContain('테스트 내용');
    expect(html).toContain('modal');
  });

  test('모달 내용 업데이트', () => {
    modal = new Modal({
      title: '내용 업데이트 테스트',
      content: '원본 내용'
    });

    modal.setContent('업데이트된 내용');
    expect(modal.state.content).toBe('업데이트된 내용');
  });

  test('모달 제목 업데이트', () => {
    modal = new Modal({
      title: '원본 제목',
      content: '테스트 내용'
    });

    modal.setTitle('업데이트된 제목');
    expect(modal.state.title).toBe('업데이트된 제목');
  });

  test('모달 토글', () => {
    modal = new Modal({
      title: '토글 테스트',
      content: '테스트 내용'
    });

    expect(modal.state.visible).toBe(false);
    
    modal.toggle();
    expect(modal.state.visible).toBe(true);
    
    modal.toggle();
    expect(modal.state.visible).toBe(false);
  });
});
