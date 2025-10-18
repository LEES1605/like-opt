module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // 에러 방지
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-undef': 'error',
    
    // 코드 스타일
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // 모범 사례
    'prefer-const': 'error',
    'no-var': 'error',
    'no-duplicate-imports': 'error',
    'no-useless-return': 'error',
    'no-useless-constructor': 'error',
    'no-useless-escape': 'error',
    
    // 함수 관련
    'func-names': ['error', 'as-needed'],
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    
    // 객체 관련
    'object-shorthand': 'error',
    'prefer-template': 'error',
    
    // 비동기 관련
    'no-async-promise-executor': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // 클래스 관련
    'class-methods-use-this': 'off',
    'no-empty-function': 'off'
  },
  globals: {
    // 브라우저 전역 변수
    'window': 'readonly',
    'document': 'readonly',
    'navigator': 'readonly',
    'fetch': 'readonly',
    'localStorage': 'readonly',
    'sessionStorage': 'readonly',
    
    // 테스트 전역 변수
    'describe': 'readonly',
    'it': 'readonly',
    'test': 'readonly',
    'expect': 'readonly',
    'beforeEach': 'readonly',
    'afterEach': 'readonly',
    'beforeAll': 'readonly',
    'afterAll': 'readonly',
    'jest': 'readonly'
  }
};