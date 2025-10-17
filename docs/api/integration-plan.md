# 🔌 Like-Opt API Integration Plan

## 📋 개요

**목적**: 백엔드 Flask API와 프론트엔드 JavaScript 간의 완벽한 통합을 위한 상세 계획

**백엔드**: `C:\like-opt\backend\` (Flask RESTful API)
**프론트엔드**: `C:\like-opt\frontend\` (Vanilla JavaScript + AJAX)

---

## 🎯 통합 목표

### 1. 완전한 API 연동
- 🔗 **RESTful API**: 모든 엔드포인트 완전 연동
- ⚡ **실시간 통신**: WebSocket 또는 Server-Sent Events
- 🔄 **상태 동기화**: 프론트엔드-백엔드 상태 일치
- 📡 **에러 처리**: 통합된 에러 핸들링

### 2. 성능 최적화
- 🚀 **응답 속도**: API 응답 < 500ms
- 💾 **캐싱**: 적절한 캐싱 전략
- 🔄 **재시도**: 네트워크 오류 자동 재시도
- 📦 **번들 크기**: HTTP 클라이언트 최적화

---

## 🏗️ API 통합 아키텍처

### 1. 백엔드 API 구조 (기존)

#### 1.1 채팅 API
```python
# backend/app/api/chat.py
@chat_bp.route('/chat', methods=['POST'])
def chat():
    """AI 채팅 메인 엔드포인트"""
    # Request: { message, mode, difficulty, stream }
    # Response: { success, response } 또는 스트림

@chat_bp.route('/conversation', methods=['GET'])
def get_conversation():
    """대화 기록 조회"""
    # Response: [{ role, content, timestamp }]

@chat_bp.route('/conversation', methods=['DELETE'])
def clear_conversation():
    """대화 기록 초기화"""
    # Response: { message }

@chat_bp.route('/mode', methods=['POST'])
def set_mode():
    """학습 모드 설정"""
    # Request: { mode, difficulty }
    # Response: { message }
```

#### 1.2 관리자 API
```python
# backend/app/api/admin.py
@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """관리자 로그인"""
    # Request: { password }
    # Response: { message } 또는 { error }

@admin_bp.route('/logout', methods=['POST'])
def admin_logout():
    """관리자 로그아웃"""
    # Response: { message }

@admin_bp.route('/indexing/run', methods=['POST'])
def run_indexing():
    """인덱싱 실행"""
    # Response: { status, message }

@admin_bp.route('/indexing/status', methods=['GET'])
def get_indexing_status():
    """인덱싱 상태 조회"""
    # Response: { last_scan_time, indexed_file_count, chunks_count, is_ready }

@admin_bp.route('/backup/create', methods=['POST'])
def create_backup():
    """백업 생성"""
    # Request: { tag_name, name, body }
    # Response: { status, message, release_url }

@admin_bp.route('/backup/list', methods=['GET'])
def list_backups():
    """백업 목록 조회"""
    # Response: [{ id, tag_name, name, published_at, assets }]

@admin_bp.route('/backup/restore', methods=['POST'])
def restore_backup():
    """백업 복원"""
    # Request: { release_id, asset_name }
    # Response: { status, message }
```

### 2. 프론트엔드 API 클라이언트 구조

#### 2.1 기본 API 클라이언트
```javascript
// frontend/src/services/api.js
export class ApiClient {
  constructor(baseURL = '/api/v1') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };
    this.timeout = 30000; // 30초
  }

  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        method: 'GET',
        headers: this.defaultHeaders,
        signal: controller.signal,
        ...options
      };

      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(response.status, errorData.error || 'API 요청 실패');
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiError(408, '요청 시간 초과');
      }
      throw error;
    }
  }

  // HTTP 메서드별 래퍼
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // 스트리밍 지원
  async stream(endpoint, data, onChunk) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new ApiError(response.status, '스트림 요청 실패');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        onChunk(chunk);
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// 커스텀 에러 클래스
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const apiClient = new ApiClient();
```

#### 2.2 채팅 서비스
```javascript
// frontend/src/services/chatService.js
import { apiClient, ApiError } from './api.js';

export class ChatService {
  constructor() {
    this.conversation = [];
    this.currentMode = 'grammar';
    this.currentDifficulty = 'intermediate';
  }

  // 일반 채팅 (비스트리밍)
  async sendMessage(messageData) {
    try {
      const response = await apiClient.post('/chat', {
        ...messageData,
        stream: false
      });
      
      // 대화 기록에 추가
      this.conversation.push(
        { role: 'user', content: messageData.message, timestamp: new Date() },
        { role: 'assistant', content: response.response, timestamp: new Date() }
      );
      
      return response;
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      throw new ChatError('메시지 전송에 실패했습니다.', error);
    }
  }

  // 스트리밍 채팅
  async sendMessageStream(messageData, onChunk) {
    try {
      let fullResponse = '';
      
      await apiClient.stream('/chat', {
        ...messageData,
        stream: true
      }, (chunk) => {
        fullResponse += chunk;
        onChunk(chunk);
      });
      
      // 대화 기록에 추가
      this.conversation.push(
        { role: 'user', content: messageData.message, timestamp: new Date() },
        { role: 'assistant', content: fullResponse, timestamp: new Date() }
      );
      
      return { success: true, response: fullResponse };
    } catch (error) {
      console.error('스트림 메시지 전송 실패:', error);
      throw new ChatError('메시지 전송에 실패했습니다.', error);
    }
  }

  // 대화 기록 조회
  async getConversation() {
    try {
      const response = await apiClient.get('/conversation');
      this.conversation = response;
      return response;
    } catch (error) {
      console.error('대화 기록 조회 실패:', error);
      return this.conversation; // 로컬 캐시 반환
    }
  }

  // 대화 기록 초기화
  async clearConversation() {
    try {
      await apiClient.delete('/conversation');
      this.conversation = [];
      return true;
    } catch (error) {
      console.error('대화 기록 초기화 실패:', error);
      throw new ChatError('대화 기록 초기화에 실패했습니다.', error);
    }
  }

  // 학습 모드 설정
  async setMode(mode, difficulty) {
    try {
      await apiClient.post('/mode', { mode, difficulty });
      this.currentMode = mode;
      this.currentDifficulty = difficulty;
      return true;
    } catch (error) {
      console.error('모드 설정 실패:', error);
      throw new ChatError('모드 설정에 실패했습니다.', error);
    }
  }

  // 현재 상태 반환
  getState() {
    return {
      conversation: this.conversation,
      currentMode: this.currentMode,
      currentDifficulty: this.currentDifficulty
    };
  }
}

// 채팅 전용 에러 클래스
export class ChatError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'ChatError';
    this.originalError = originalError;
  }
}

export const chatService = new ChatService();
```

#### 2.3 관리자 서비스
```javascript
// frontend/src/services/adminService.js
import { apiClient, ApiError } from './api.js';

export class AdminService {
  constructor() {
    this.isAuthenticated = false;
    this.indexingStatus = null;
    this.backupList = [];
  }

  // 관리자 로그인
  async login(password) {
    try {
      const response = await apiClient.post('/admin/login', { password });
      this.isAuthenticated = true;
      return { success: true, message: response.message };
    } catch (error) {
      this.isAuthenticated = false;
      if (error.status === 401) {
        return { success: false, error: '잘못된 비밀번호입니다.' };
      }
      throw new AdminError('로그인에 실패했습니다.', error);
    }
  }

  // 관리자 로그아웃
  async logout() {
    try {
      await apiClient.post('/admin/logout');
      this.isAuthenticated = false;
      return { success: true, message: '로그아웃되었습니다.' };
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw new AdminError('로그아웃에 실패했습니다.', error);
    }
  }

  // 인덱싱 실행
  async runIndexing() {
    try {
      const response = await apiClient.post('/admin/indexing/run');
      return response;
    } catch (error) {
      console.error('인덱싱 실행 실패:', error);
      throw new AdminError('인덱싱 실행에 실패했습니다.', error);
    }
  }

  // 인덱싱 상태 조회
  async getIndexingStatus() {
    try {
      const response = await apiClient.get('/admin/indexing/status');
      this.indexingStatus = response;
      return response;
    } catch (error) {
      console.error('인덱싱 상태 조회 실패:', error);
      return this.indexingStatus; // 캐시된 상태 반환
    }
  }

  // 백업 생성
  async createBackup(tagName = null, name = null, body = null) {
    try {
      const response = await apiClient.post('/admin/backup/create', {
        tag_name: tagName || `backup-${Date.now()}`,
        name: name || `Like-Opt Backup ${new Date().toLocaleString()}`,
        body: body || 'Automated backup created from admin panel'
      });
      return response;
    } catch (error) {
      console.error('백업 생성 실패:', error);
      throw new AdminError('백업 생성에 실패했습니다.', error);
    }
  }

  // 백업 목록 조회
  async listBackups() {
    try {
      const response = await apiClient.get('/admin/backup/list');
      this.backupList = response;
      return response;
    } catch (error) {
      console.error('백업 목록 조회 실패:', error);
      return this.backupList; // 캐시된 목록 반환
    }
  }

  // 백업 복원
  async restoreBackup(releaseId, assetName) {
    try {
      const response = await apiClient.post('/admin/backup/restore', {
        release_id: releaseId,
        asset_name: assetName
      });
      return response;
    } catch (error) {
      console.error('백업 복원 실패:', error);
      throw new AdminError('백업 복원에 실패했습니다.', error);
    }
  }

  // 인증 상태 확인
  isLoggedIn() {
    return this.isAuthenticated;
  }

  // 현재 상태 반환
  getState() {
    return {
      isAuthenticated: this.isAuthenticated,
      indexingStatus: this.indexingStatus,
      backupList: this.backupList
    };
  }
}

// 관리자 전용 에러 클래스
export class AdminError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'AdminError';
    this.originalError = originalError;
  }
}

export const adminService = new AdminService();
```

---

## 🔄 상태 관리 통합

### 1. 전역 상태 관리
```javascript
// frontend/src/store/state.js
export class StateManager {
  constructor() {
    this.state = {
      // 사용자 상태
      user: {
        isAuthenticated: false,
        role: null,
        preferences: {}
      },
      
      // 채팅 상태
      chat: {
        conversation: [],
        currentMode: 'grammar',
        currentDifficulty: 'intermediate',
        isLoading: false,
        lastMessage: null
      },
      
      // 관리자 상태
      admin: {
        isLoggedIn: false,
        indexingStatus: null,
        backupList: [],
        systemLogs: []
      },
      
      // UI 상태
      ui: {
        theme: 'dark',
        sidebarOpen: false,
        modalOpen: null,
        notifications: []
      }
    };
    
    this.listeners = [];
  }

  // 상태 조회
  getState(path = null) {
    if (path) {
      return this.getNestedValue(this.state, path);
    }
    return { ...this.state };
  }

  // 상태 업데이트
  setState(path, value) {
    this.setNestedValue(this.state, path, value);
    this.notifyListeners(path, value);
  }

  // 상태 변경 리스너 등록
  subscribe(path, callback) {
    this.listeners.push({ path, callback });
    return () => {
      this.listeners = this.listeners.filter(
        listener => listener.path !== path || listener.callback !== callback
      );
    };
  }

  // 리스너들에게 변경 알림
  notifyListeners(changedPath, value) {
    this.listeners.forEach(({ path, callback }) => {
      if (this.pathMatches(path, changedPath)) {
        callback(this.getNestedValue(this.state, path), changedPath);
      }
    });
  }

  // 중첩된 값 조회
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // 중첩된 값 설정
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  // 경로 매칭 확인
  pathMatches(pattern, path) {
    if (pattern === path) return true;
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return false;
  }
}

export const stateManager = new StateManager();
```

---

## 📅 구현 일정

### Week 1: 기본 API 통합
- **Day 1**: API 클라이언트 기본 구조 구현
- **Day 2**: 채팅 서비스 구현 및 테스트
- **Day 3**: 관리자 서비스 구현 및 테스트
- **Day 4**: 에러 처리 및 재시도 로직 구현
- **Day 5**: 상태 관리 통합

### Week 2: 고급 기능 및 최적화
- **Day 1**: 스트리밍 API 통합
- **Day 2**: WebSocket/SSE 실시간 통신 (선택사항)
- **Day 3**: 캐싱 전략 구현
- **Day 4**: 성능 최적화
- **Day 5**: 통합 테스트 및 버그 수정

---

## 🎯 성공 지표

### 기능적 요구사항
- ✅ **API 연결**: 모든 엔드포인트 정상 작동
- ✅ **에러 처리**: 모든 에러 상황 적절히 처리
- ✅ **상태 동기화**: 프론트엔드-백엔드 상태 일치
- ✅ **재시도 로직**: 네트워크 오류 자동 복구

### 성능 요구사항
- 🚀 **API 응답**: 평균 < 500ms
- 🔄 **재시도 성공률**: > 95%
- 💾 **메모리 사용**: API 클라이언트 < 10MB
- 📡 **실시간 지연**: < 100ms

### 품질 요구사항
- 🧪 **테스트 커버리지**: > 90%
- 🔧 **에러 처리**: 모든 에러 상황 테스트
- 📚 **문서화**: API 사용법 100% 문서화
- 🔒 **보안**: 인증 토큰 안전 관리

---

**마지막 업데이트**: 2025-10-17  
**버전**: 1.0.0  
**상태**: 📋 계획 완료, 🚀 구현 준비
