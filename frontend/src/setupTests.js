/**
 * Jest 테스트 설정 파일
 * Like-Opt 프론트엔드 테스트 환경 설정
 */

// DOM 환경 설정
import '@testing-library/jest-dom';

// 전역 fetch 모킹
global.fetch = jest.fn();

// 전역 이벤트 모킹
global.Event = jest.fn();
global.CustomEvent = jest.fn();

// localStorage 모킹
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// sessionStorage 모킹
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// console 메서드 모킹 (테스트 중 로그 억제)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// 테스트 후 정리
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// 테스트 타임아웃 설정
jest.setTimeout(10000);