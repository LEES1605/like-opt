/**
 * Button 컴포넌트 테스트
 * Like-Opt 프론트엔드 Button 컴포넌트 테스트
 */

import { Button, ButtonFactory, ButtonManager } from '../common/Button.js';

// DOM 환경 설정
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

describe('Button 컴포넌트', () => {
  let container;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
    ButtonManager.cleanup();
  });
  
  describe('기본 렌더링', () => {
    test('기본 버튼이 올바르게 렌더링되어야 함', () => {
      const button = new Button({
        text: '테스트 버튼',
        type: 'primary'
      });
      
      const element = button.render();
      container.appendChild(element);
      
      expect(element).toBeTruthy();
      expect(element.textContent).toBe('테스트 버튼');
      expect(element.classList.contains('button')).toBe(true);
      expect(element.classList.contains('button-primary')).toBe(true);
    });
    
    test('다양한 타입의 버튼이 올바르게 렌더링되어야 함', () => {
      const types = ['primary', 'secondary', 'danger', 'success', 'warning'];
      
      types.forEach(type => {
        const button = new Button({
          text: `${type} 버튼`,
          type
        });
        
        const element = button.render();
        container.appendChild(element);
        
        expect(element.classList.contains(`button-${type}`)).toBe(true);
      });
    });
    
    test('다양한 크기의 버튼이 올바르게 렌더링되어야 함', () => {
      const sizes = ['small', 'medium', 'large'];
      
      sizes.forEach(size => {
        const button = new Button({
          text: `${size} 버튼`,
          size
        });
        
        const element = button.render();
        container.appendChild(element);
        
        expect(element.classList.contains(`button-${size}`)).toBe(true);
      });
    });
  });
  
  describe('상태 관리', () => {
    test('비활성화 상태가 올바르게 적용되어야 함', () => {
      const button = new Button({
        text: '비활성화 버튼',
        disabled: true
      });
      
      const element = button.render();
      container.appendChild(element);
      
      expect(element.disabled).toBe(true);
      expect(element.classList.contains('disabled')).toBe(true);
    });
    
    test('로딩 상태가 올바르게 적용되어야 함', () => {
      const button = new Button({
        text: '로딩 버튼',
        loading: true
      });
      
      const element = button.render();
      container.appendChild(element);
      
      expect(element.classList.contains('loading')).toBe(true);
      expect(element.disabled).toBe(true);
    });
    
    test('상태 변경이 올바르게 작동해야 함', () => {
      const button = new Button({
        text: '상태 변경 버튼'
      });
      
      const element = button.render();
      container.appendChild(element);
      
      // 초기 상태 확인
      expect(element.disabled).toBe(false);
      expect(element.classList.contains('loading')).toBe(false);
      
      // 비활성화 상태로 변경
      button.setDisabled(true);
      expect(element.disabled).toBe(true);
      
      // 로딩 상태로 변경
      button.setLoading(true);
      expect(element.classList.contains('loading')).toBe(true);
      expect(element.disabled).toBe(true);
    });
  });
  
  describe('이벤트 처리', () => {
    test('클릭 이벤트가 올바르게 처리되어야 함', () => {
      const mockCallback = jest.fn();
      const button = new Button({
        text: '클릭 버튼',
        onClick: mockCallback
      });
      
      const element = button.render();
      container.appendChild(element);
      
      // 클릭 이벤트 발생
      element.click();
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
    
    test('비활성화된 버튼은 클릭 이벤트를 처리하지 않아야 함', () => {
      const mockCallback = jest.fn();
      const button = new Button({
        text: '비활성화 버튼',
        disabled: true,
        onClick: mockCallback
      });
      
      const element = button.render();
      container.appendChild(element);
      
      // 클릭 이벤트 발생
      element.click();
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
    
    test('로딩 중인 버튼은 클릭 이벤트를 처리하지 않아야 함', () => {
      const mockCallback = jest.fn();
      const button = new Button({
        text: '로딩 버튼',
        loading: true,
        onClick: mockCallback
      });
      
      const element = button.render();
      container.appendChild(element);
      
      // 클릭 이벤트 발생
      element.click();
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('아이콘 지원', () => {
    test('아이콘이 있는 버튼이 올바르게 렌더링되어야 함', () => {
      const button = new Button({
        text: '아이콘 버튼',
        icon: '🚀',
        iconPosition: 'left'
      });
      
      const element = button.render();
      container.appendChild(element);
      
      expect(element.querySelector('.button-icon')).toBeTruthy();
      expect(element.querySelector('.button-icon').textContent).toBe('🚀');
    });
    
    test('아이콘만 있는 버튼이 올바르게 렌더링되어야 함', () => {
      const button = new Button({
        icon: '🚀',
        iconOnly: true
      });
      
      const element = button.render();
      container.appendChild(element);
      
      expect(element.classList.contains('button-icon-only')).toBe(true);
      expect(element.querySelector('.button-icon')).toBeTruthy();
    });
  });
  
  describe('ButtonFactory', () => {
    test('팩토리로 버튼이 올바르게 생성되어야 함', () => {
      const button = ButtonFactory.create('primary', '팩토리 버튼');
      
      expect(button).toBeInstanceOf(Button);
      expect(button.state.type).toBe('primary');
      expect(button.state.text).toBe('팩토리 버튼');
    });
    
    test('편의 메서드들이 올바르게 작동해야 함', () => {
      const primaryButton = ButtonFactory.primaryButton('Primary');
      const secondaryButton = ButtonFactory.secondaryButton('Secondary');
      const dangerButton = ButtonFactory.dangerButton('Danger');
      
      expect(primaryButton.state.type).toBe('primary');
      expect(secondaryButton.state.type).toBe('secondary');
      expect(dangerButton.state.type).toBe('danger');
    });
  });
  
  describe('ButtonManager', () => {
    test('버튼이 올바르게 등록되어야 함', () => {
      const button = new Button({ text: '테스트 버튼' });
      ButtonManager.register('test-button', button);
      
      const retrievedButton = ButtonManager.get('test-button');
      expect(retrievedButton).toBe(button);
    });
    
    test('모든 버튼이 올바르게 가져와져야 함', () => {
      const button1 = new Button({ text: '버튼 1' });
      const button2 = new Button({ text: '버튼 2' });
      
      ButtonManager.register('button1', button1);
      ButtonManager.register('button2', button2);
      
      const allButtons = ButtonManager.getAll();
      expect(allButtons).toHaveLength(2);
      expect(allButtons).toContain(button1);
      expect(allButtons).toContain(button2);
    });
    
    test('정리 작업이 올바르게 수행되어야 함', () => {
      const button = new Button({ text: '테스트 버튼' });
      ButtonManager.register('test-button', button);
      
      expect(ButtonManager.getAll()).toHaveLength(1);
      
      ButtonManager.cleanup();
      
      expect(ButtonManager.getAll()).toHaveLength(0);
    });
  });
  
  describe('접근성', () => {
    test('버튼에 적절한 ARIA 속성이 있어야 함', () => {
      const button = new Button({
        text: '접근성 버튼',
        ariaLabel: '접근성 테스트 버튼'
      });
      
      const element = button.render();
      container.appendChild(element);
      
      expect(element.getAttribute('aria-label')).toBe('접근성 테스트 버튼');
    });
    
    test('비활성화된 버튼에 적절한 ARIA 속성이 있어야 함', () => {
      const button = new Button({
        text: '비활성화 버튼',
        disabled: true
      });
      
      const element = button.render();
      container.appendChild(element);
      
      expect(element.getAttribute('aria-disabled')).toBe('true');
    });
  });
  
  describe('에러 처리', () => {
    test('잘못된 타입으로 버튼을 생성해도 에러가 발생하지 않아야 함', () => {
      expect(() => {
        new Button({
          text: '잘못된 타입 버튼',
          type: 'invalid-type'
        });
      }).not.toThrow();
    });
    
    test('잘못된 크기로 버튼을 생성해도 에러가 발생하지 않아야 함', () => {
      expect(() => {
        new Button({
          text: '잘못된 크기 버튼',
          size: 'invalid-size'
        });
      }).not.toThrow();
    });
  });
});