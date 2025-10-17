/**
 * Jest 테스트 환경 설정
 */

// DOM 환경 모킹
import 'jest-environment-jsdom';

// 전역 테스트 유틸리티
global.createMockElement = (tagName = 'div', attributes = {}) => {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

global.createMockContainer = () => {
  const container = document.createElement('div');
  container.id = 'test-container';
  document.body.appendChild(container);
  return container;
};

// 테스트 정리 유틸리티
global.cleanupTestEnvironment = () => {
  const testContainer = document.getElementById('test-container');
  if (testContainer) {
    testContainer.remove();
  }
  
  // 모든 이벤트 리스너 제거
  document.body.innerHTML = '';
};

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// 각 테스트 후 정리
afterEach(() => {
  cleanupTestEnvironment();
  jest.clearAllMocks();
});
