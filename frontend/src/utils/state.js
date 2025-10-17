/**
 * State Management - 전역 상태 관리
 */

// 전역 상태 객체
export const globalState = {
  // 앱 상태
  app: {
    initialized: false,
    theme: 'dark',
    locale: 'ko'
  },
  
  // Professor G 설정
  professorG: {
    enabled: true,
    temperature: 0.7,
    model: 'gpt-4o-mini'
  },
  
  // 학습 모드
  learningModes: {
    grammar: true,
    sentence: true,
    passage: true
  },
  
  // UI 상태
  ui: {
    loading: false,
    modals: {
      open: []
    }
  }
};

/**
 * 상태 초기화
 */
export function initializeState(options = {}) {
  console.log('📊 상태 관리 초기화 중...');
  
  // 기본값 설정
  Object.assign(globalState.app, options);
  
  console.log('✅ 상태 관리 초기화 완료');
  return globalState;
}

/**
 * 상태 업데이트
 */
export function updateState(path, value) {
  const keys = path.split('.');
  let current = globalState;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  console.log(`상태 업데이트: ${path} = ${value}`);
}

/**
 * 상태 조회
 */
export function getState(path) {
  const keys = path.split('.');
  let current = globalState;
  
  for (const key of keys) {
    if (current[key] === undefined) {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

/**
 * 상태 구독
 */
export function subscribeToState(path, callback) {
  // 간단한 구독 시스템 (실제로는 더 복잡한 구현 필요)
  return {
    unsubscribe: () => {
      // 구독 해제 로직
    }
  };
}