# 🎨 Like-Opt - Frontend Implementation Plan

## 📋 개요

**목적**: 기존 MAIC-Flask의 모든 UI/UX를 완전히 새로운 최적화된 시스템에 맞게 완전 재구현

**기존 참고**: `C:\Users\daeha\OneDrive\Desktop\PythonWorkspace\MAIC-Flask\src\frontend\` (절대 수정 금지)
**새 구현**: `C:\like-opt\frontend\` (완전히 새로 구현)

---

## 🎯 구현 목표

### 1. 완전한 UI 재현
- 🎨 **Neumorphism 디자인**: 기존 디자인 100% 재현
- 📱 **반응형 디자인**: 모바일/태블릿/데스크톱 완벽 지원
- ⚡ **성능 최적화**: 로딩 속도 50% 향상
- 🔧 **모듈화**: 재사용 가능한 컴포넌트 구조

### 2. 사용자 경험 향상
- 🚀 **빠른 응답**: AJAX 기반 실시간 업데이트
- 💫 **부드러운 애니메이션**: CSS3 트랜지션
- 🎯 **직관적 인터페이스**: 사용자 친화적 UX
- ♿ **접근성**: WCAG 2.1 AA 준수

---

## 🏗️ 프론트엔드 아키텍처

### 기술 스택 선택
```javascript
// 기본 기술 스택
{
  "framework": "Vanilla JavaScript (ES6+)",
  "bundler": "Webpack 5",
  "css": "CSS3 + CSS Modules",
  "http": "Fetch API + Axios",
  "state": "Custom State Management",
  "testing": "Jest + Playwright",
  "linting": "ESLint + Prettier"
}
```

### 폴더 구조
```
frontend/
├── src/
│   ├── components/              # 재사용 가능한 UI 컴포넌트
│   │   ├── common/             # 공통 컴포넌트
│   │   │   ├── Button.js       # 버튼 컴포넌트
│   │   │   ├── Modal.js        # 모달 컴포넌트
│   │   │   ├── ToggleSwitch.js # 토글 스위치
│   │   │   ├── Card.js         # 카드 컴포넌트
│   │   │   ├── Loading.js      # 로딩 스피너
│   │   │   └── index.js        # 컴포넌트 export
│   │   ├── chat/               # 채팅 관련 컴포넌트
│   │   │   ├── ChatInterface.js    # 메인 채팅 인터페이스
│   │   │   ├── MessageList.js      # 메시지 리스트
│   │   │   ├── MessageInput.js     # 메시지 입력
│   │   │   ├── ModeSelector.js     # 모드 선택기
│   │   │   └── DifficultySelector.js # 난이도 선택기
│   │   ├── admin/              # 관리자 관련 컴포넌트
│   │   │   ├── AdminLogin.js       # 관리자 로그인
│   │   │   ├── AdminPanel.js       # 관리자 패널
│   │   │   ├── QuestionModeCard.js # 질문모드 관리 카드
│   │   │   ├── PromptManager.js    # 프롬프트 관리
│   │   │   ├── DataLogs.js         # 데이터 & 로그
│   │   │   └── IndexingMonitor.js  # 인덱싱 모니터
│   │   └── layout/             # 레이아웃 컴포넌트
│   │       ├── Header.js       # 헤더
│   │       ├── Sidebar.js      # 사이드바
│   │       └── Footer.js       # 푸터
│   ├── pages/                  # 페이지 컴포넌트
│   │   ├── MainPage.js         # 메인 페이지
│   │   ├── ChatPage.js         # 채팅 페이지
│   │   ├── AdminPage.js        # 관리자 페이지
│   │   └── NotFoundPage.js     # 404 페이지
│   ├── services/               # API 서비스
│   │   ├── api.js              # API 클라이언트
│   │   ├── chatService.js      # 채팅 서비스
│   │   ├── adminService.js     # 관리자 서비스
│   │   ├── authService.js      # 인증 서비스
│   │   └── websocketService.js # WebSocket 서비스
│   ├── styles/                 # CSS 스타일
│   │   ├── base/               # 기본 스타일
│   │   │   ├── reset.css       # CSS Reset
│   │   │   ├── variables.css   # CSS 변수
│   │   │   ├── typography.css  # 타이포그래피
│   │   │   └── layout.css      # 기본 레이아웃
│   │   ├── components/         # 컴포넌트 스타일
│   │   │   ├── button.css      # 버튼 스타일
│   │   │   ├── modal.css       # 모달 스타일
│   │   │   ├── toggle.css      # 토글 스위치
│   │   │   ├── card.css        # 카드 스타일
│   │   │   └── chat.css        # 채팅 스타일
│   │   ├── pages/              # 페이지 스타일
│   │   │   ├── main.css        # 메인 페이지
│   │   │   ├── admin.css       # 관리자 페이지
│   │   │   └── chat.css        # 채팅 페이지
│   │   ├── themes/             # 테마
│   │   │   ├── neumorphism.css # Neumorphism 디자인
│   │   │   └── dark.css        # 다크 모드
│   │   └── responsive.css      # 반응형 디자인
│   ├── utils/                  # 유틸리티 함수
│   │   ├── constants.js        # 상수 정의
│   │   ├── helpers.js          # 헬퍼 함수
│   │   ├── validators.js       # 유효성 검사
│   │   ├── formatters.js       # 데이터 포맷터
│   │   └── storage.js          # 로컬 스토리지
│   ├── store/                  # 상태 관리
│   │   ├── state.js            # 전역 상태
│   │   ├── actions.js          # 액션
│   │   ├── mutations.js        # 뮤테이션
│   │   └── modules/            # 모듈별 상태
│   │       ├── chat.js         # 채팅 상태
│   │       ├── admin.js        # 관리자 상태
│   │       └── auth.js         # 인증 상태
│   ├── router/                 # 라우팅
│   │   ├── router.js           # 메인 라우터
│   │   ├── routes.js           # 라우트 정의
│   │   └── guards.js           # 라우트 가드
│   ├── App.js                  # 메인 앱 컴포넌트
│   └── main.js                 # 애플리케이션 진입점
├── public/                     # 정적 파일
│   ├── index.html              # 메인 HTML
│   ├── favicon.ico             # 파비콘
│   ├── manifest.json           # PWA 매니페스트
│   └── images/                 # 이미지 파일
│       ├── logo.png            # 로고
│       └── icons/              # 아이콘
├── tests/                      # 테스트 파일
│   ├── unit/                   # 단위 테스트
│   ├── integration/            # 통합 테스트
│   └── e2e/                    # E2E 테스트
├── package.json                # Node.js 의존성
├── webpack.config.js           # Webpack 설정
├── jest.config.js              # Jest 설정
├── playwright.config.js        # Playwright 설정
└── .eslintrc.js                # ESLint 설정
```

---

## 🎨 UI/UX 구현 계획

### 1. Neumorphism 디자인 시스템

#### 1.1 색상 팔레트
```css
:root {
  /* 메인 색상 */
  --primary-bg: #3a3d5c;
  --secondary-bg: #4a4d6c;
  --accent-bg: #5a5d7c;
  
  /* 텍스트 색상 */
  --text-primary: #c1c3e0;
  --text-secondary: #a1a3c0;
  --text-accent: #ffffff;
  
  /* 그라데이션 */
  --gradient-primary: linear-gradient(135deg, #6366f1, #8b5cf6);
  --gradient-secondary: linear-gradient(135deg, #3a3d5c, #4a4d6c, #5a5d7c);
  
  /* 그림자 */
  --shadow-soft: 8px 8px 16px rgba(0, 0, 0, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.1);
  --shadow-hard: 12px 12px 24px rgba(0, 0, 0, 0.4), -12px -12px 24px rgba(255, 255, 255, 0.05);
  --shadow-inset: inset 4px 4px 8px rgba(0, 0, 0, 0.3), inset -4px -4px 8px rgba(255, 255, 255, 0.1);
}
```

#### 1.2 타이포그래피
```css
/* 폰트 설정 */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

:root {
  --font-primary: 'Poppins', sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
}
```

#### 1.3 컴포넌트 스타일
```css
/* 카드 컴포넌트 */
.card {
  background: rgba(44, 47, 72, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: var(--shadow-soft);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hard);
}

/* 토글 스위치 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(145deg, #4a4d6c, #3a3d5c);
  transition: 0.4s;
  border-radius: 28px;
  box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.3), inset -4px -4px 8px rgba(255, 255, 255, 0.1);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background: linear-gradient(145deg, #6366f1, #8b5cf6);
  transition: 0.4s;
  border-radius: 50%;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

input:checked + .toggle-slider {
  background: linear-gradient(145deg, #6366f1, #8b5cf6);
}

input:checked + .toggle-slider:before {
  transform: translateX(22px);
}
```

### 2. 반응형 디자인

#### 2.1 브레이크포인트
```css
/* 모바일 */
@media (max-width: 768px) {
  .container { padding: 1rem; }
  .card { padding: 1.5rem; }
  .chat-interface { height: calc(100vh - 120px); }
}

/* 태블릿 */
@media (min-width: 769px) and (max-width: 1024px) {
  .container { padding: 2rem; }
  .card { padding: 2rem; }
  .chat-interface { height: calc(100vh - 140px); }
}

/* 데스크톱 */
@media (min-width: 1025px) {
  .container { padding: 3rem; }
  .card { padding: 2.5rem; }
  .chat-interface { height: calc(100vh - 160px); }
}
```

#### 2.2 그리드 시스템
```css
.grid {
  display: grid;
  gap: 2rem;
}

.grid-1 { grid-template-columns: 1fr; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 768px) {
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
}
```

---

## 🚀 컴포넌트 구현 계획

### 1. 기본 컴포넌트 (Week 1, Day 1-2)

#### 1.1 Button 컴포넌트
```javascript
// src/components/common/Button.js
export class Button {
  constructor(options = {}) {
    this.text = options.text || 'Button';
    this.type = options.type || 'primary';
    this.size = options.size || 'medium';
    this.disabled = options.disabled || false;
    this.onClick = options.onClick || (() => {});
  }

  render() {
    return `
      <button 
        class="btn btn-${this.type} btn-${this.size}"
        ${this.disabled ? 'disabled' : ''}
        data-action="${this.onClick.name || 'handleClick'}"
      >
        ${this.text}
      </button>
    `;
  }

  attachEventListeners(element) {
    element.addEventListener('click', this.onClick);
  }
}
```

#### 1.2 Modal 컴포넌트
```javascript
// src/components/common/Modal.js
export class Modal {
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.visible = options.visible || false;
    this.onClose = options.onClose || (() => {});
  }

  render() {
    if (!this.visible) return '';
    
    return `
      <div class="modal-overlay" data-modal-overlay>
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title">${this.title}</h3>
            <button class="modal-close" data-modal-close>&times;</button>
          </div>
          <div class="modal-body">
            ${this.content}
          </div>
        </div>
      </div>
    `;
  }

  show() {
    this.visible = true;
    this.updateDOM();
  }

  hide() {
    this.visible = false;
    this.updateDOM();
  }

  updateDOM() {
    const modalElement = document.querySelector('[data-modal-overlay]');
    if (modalElement) {
      modalElement.outerHTML = this.render();
    }
  }
}
```

#### 1.3 ToggleSwitch 컴포넌트
```javascript
// src/components/common/ToggleSwitch.js
export class ToggleSwitch {
  constructor(options = {}) {
    this.id = options.id || `toggle-${Date.now()}`;
    this.label = options.label || '';
    this.checked = options.checked || false;
    this.onChange = options.onChange || (() => {});
  }

  render() {
    return `
      <div class="toggle-container">
        <label class="toggle-label" for="${this.id}">
          ${this.label}
        </label>
        <label class="toggle-switch">
          <input 
            type="checkbox" 
            id="${this.id}"
            ${this.checked ? 'checked' : ''}
            data-toggle-input
          >
          <span class="toggle-slider"></span>
        </label>
      </div>
    `;
  }

  attachEventListeners(element) {
    const input = element.querySelector('[data-toggle-input]');
    input.addEventListener('change', (e) => {
      this.checked = e.target.checked;
      this.onChange(this.checked);
    });
  }
}
```

### 2. 채팅 컴포넌트 (Week 1, Day 3-4)

#### 2.1 ChatInterface 컴포넌트
```javascript
// src/components/chat/ChatInterface.js
import { MessageList } from './MessageList.js';
import { MessageInput } from './MessageInput.js';
import { ModeSelector } from './ModeSelector.js';
import { chatService } from '../../services/chatService.js';

export class ChatInterface {
  constructor() {
    this.messages = [];
    this.currentMode = 'grammar';
    this.currentDifficulty = 'intermediate';
    this.isLoading = false;
  }

  render() {
    return `
      <div class="chat-interface">
        <div class="chat-header">
          <h2>Professor G와 영어 학습</h2>
          ${new ModeSelector().render()}
        </div>
        <div class="chat-body">
          ${new MessageList(this.messages).render()}
        </div>
        <div class="chat-footer">
          ${new MessageInput().render()}
        </div>
      </div>
    `;
  }

  async sendMessage(content) {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.updateLoadingState();
    
    try {
      const response = await chatService.sendMessage({
        message: content,
        mode: this.currentMode,
        difficulty: this.currentDifficulty
      });
      
      this.messages.push(
        { role: 'user', content, timestamp: new Date() },
        { role: 'assistant', content: response.response, timestamp: new Date() }
      );
      
      this.updateMessageList();
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      this.showError('메시지 전송에 실패했습니다.');
    } finally {
      this.isLoading = false;
      this.updateLoadingState();
    }
  }
}
```

### 3. 관리자 컴포넌트 (Week 1, Day 5-7)

#### 3.1 AdminLogin 컴포넌트
```javascript
// src/components/admin/AdminLogin.js
import { Modal } from '../common/Modal.js';
import { authService } from '../../services/authService.js';

export class AdminLogin {
  constructor() {
    this.modal = new Modal({
      title: '관리자 로그인',
      content: this.renderLoginForm(),
      visible: false
    });
  }

  renderLoginForm() {
    return `
      <form class="admin-login-form" data-admin-login-form>
        <div class="form-group">
          <label for="admin-password">비밀번호</label>
          <input 
            type="password" 
            id="admin-password"
            name="password"
            class="form-input"
            required
            autocomplete="current-password"
          >
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            로그인
          </button>
          <button type="button" class="btn btn-secondary" data-modal-close>
            취소
          </button>
        </div>
      </form>
    `;
  }

  show() {
    this.modal.show();
    this.attachEventListeners();
  }

  hide() {
    this.modal.hide();
  }

  attachEventListeners() {
    const form = document.querySelector('[data-admin-login-form]');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const password = formData.get('password');
        
        try {
          const result = await authService.adminLogin(password);
          if (result.success) {
            this.hide();
            this.onLoginSuccess();
          } else {
            this.showError(result.error);
          }
        } catch (error) {
          this.showError('로그인 중 오류가 발생했습니다.');
        }
      });
    }
  }
}
```

---

## 🔌 API 통합 계획

### 1. API 서비스 구조

#### 1.1 기본 API 클라이언트
```javascript
// src/services/api.js
export class ApiClient {
  constructor() {
    this.baseURL = '/api/v1';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API 요청 실패');
      }

      return data;
    } catch (error) {
      console.error('API 요청 실패:', error);
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

#### 1.2 채팅 서비스
```javascript
// src/services/chatService.js
import { apiClient } from './api.js';

export class ChatService {
  async sendMessage(messageData) {
    return await apiClient.post('/chat', messageData);
  }

  async getConversation() {
    return await apiClient.get('/conversation');
  }

  async clearConversation() {
    return await apiClient.delete('/conversation');
  }

  async setMode(mode, difficulty) {
    return await apiClient.post('/mode', { mode, difficulty });
  }
}

export const chatService = new ChatService();
```

#### 1.3 관리자 서비스
```javascript
// src/services/adminService.js
import { apiClient } from './api.js';

export class AdminService {
  async login(password) {
    return await apiClient.post('/admin/login', { password });
  }

  async logout() {
    return await apiClient.post('/admin/logout');
  }

  async runIndexing() {
    return await apiClient.post('/admin/indexing/run');
  }

  async getIndexingStatus() {
    return await apiClient.get('/admin/indexing/status');
  }

  async createBackup(tagName = null) {
    return await apiClient.post('/admin/backup/create', { tag_name: tagName });
  }

  async listBackups() {
    return await apiClient.get('/admin/backup/list');
  }

  async restoreBackup(tagName, assetName) {
    return await apiClient.post('/admin/backup/restore', {
      tag_name: tagName,
      asset_name: assetName,
    });
  }
}

export const adminService = new AdminService();
```

---

## 🧪 테스트 계획

### 1. 단위 테스트
```javascript
// tests/unit/components/Button.test.js
import { Button } from '../../../src/components/common/Button.js';

describe('Button Component', () => {
  test('should render with default options', () => {
    const button = new Button();
    const html = button.render();
    expect(html).toContain('class="btn btn-primary btn-medium"');
    expect(html).toContain('Button');
  });

  test('should render with custom options', () => {
    const button = new Button({
      text: 'Custom Button',
      type: 'secondary',
      size: 'large'
    });
    const html = button.render();
    expect(html).toContain('Custom Button');
    expect(html).toContain('btn-secondary');
    expect(html).toContain('btn-large');
  });
});
```

### 2. 통합 테스트
```javascript
// tests/integration/ChatInterface.test.js
import { ChatInterface } from '../../src/components/chat/ChatInterface.js';

describe('ChatInterface Integration', () => {
  test('should send message and receive response', async () => {
    const chatInterface = new ChatInterface();
    
    // Mock API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        response: 'Hello! I am Professor G.',
      }),
    });

    await chatInterface.sendMessage('Hello');
    
    expect(chatInterface.messages).toHaveLength(2);
    expect(chatInterface.messages[0].role).toBe('user');
    expect(chatInterface.messages[1].role).toBe('assistant');
  });
});
```

### 3. E2E 테스트
```javascript
// tests/e2e/chat.spec.js
import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test('should allow user to send message and receive AI response', async ({ page }) => {
    await page.goto('/');
    
    // 메시지 입력
    await page.fill('[data-message-input]', '영어 문법을 배우고 싶습니다');
    await page.click('[data-send-button]');
    
    // AI 응답 확인
    await expect(page.locator('.message-ai')).toBeVisible();
    await expect(page.locator('.message-ai .message-content')).toContainText('Professor G');
  });
});
```

---

## 📅 구현 일정

### Week 1: 기본 구조 및 컴포넌트
- **Day 1**: 프로젝트 설정, 기본 컴포넌트 (Button, Modal)
- **Day 2**: 토글 스위치, 카드 컴포넌트, 기본 스타일
- **Day 3**: 채팅 인터페이스 기본 구조
- **Day 4**: 메시지 리스트, 입력 컴포넌트
- **Day 5**: 관리자 로그인, 기본 패널
- **Day 6**: 질문모드 관리 카드
- **Day 7**: 프롬프트 관리, 데이터 로그

### Week 2: API 통합 및 최적화
- **Day 1-2**: API 서비스 구현 및 통합
- **Day 3-4**: 실시간 업데이트, 에러 처리
- **Day 5-6**: 반응형 디자인 완성
- **Day 7**: 성능 최적화, 테스트

---

## 🎯 성공 지표

### 기능적 요구사항
- ✅ **UI 재현**: 기존 UI 100% 재현
- ✅ **반응형**: 모든 디바이스에서 완벽 작동
- ✅ **API 통합**: 백엔드와 완전 연동
- ✅ **사용자 경험**: 부드러운 인터랙션

### 성능 요구사항
- 🚀 **초기 로딩**: < 2초
- ⚡ **컴포넌트 렌더링**: < 100ms
- 💾 **메모리 사용**: < 50MB
- 📱 **모바일 성능**: 60fps 유지

### 품질 요구사항
- 🧪 **테스트 커버리지**: > 90%
- 🔧 **코드 품질**: ESLint 통과
- ♿ **접근성**: WCAG 2.1 AA 준수
- 📚 **문서화**: 모든 컴포넌트 문서화

---

**마지막 업데이트**: 2025-10-17  
**버전**: 1.0.0  
**상태**: 📋 계획 완료, 🚀 구현 준비
