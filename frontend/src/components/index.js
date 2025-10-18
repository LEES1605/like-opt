/**
 * 컴포넌트 인덱스
 * Like-Opt 프론트엔드 모든 컴포넌트 모음
 */

// 기본 컴포넌트
export * from './base/BaseComponent.js';

// 공통 컴포넌트
export * from './common/index.js';

// 채팅 컴포넌트
export * from './chat/index.js';

// 관리자 컴포넌트
export * from './admin/index.js';

// 메달 컴포넌트
export * from './medals/Medal.js';

// 랭킹 컴포넌트
export * from './ranking/RankChip.js';
export * from './ranking/RankCollection.js';

// 상태 컴포넌트
export * from './status/StatusIndicator.js';

// 기본 export
export default {
  // 모든 컴포넌트를 포함하는 객체
  BaseComponent,
  Button,
  Modal,
  ToggleSwitch,
  ChatInterface,
  MessageList,
  MessageInput,
  ModeSelector,
  DifficultySelector,
  Medal,
  RankChip,
  RankCollection,
  StatusIndicator
};