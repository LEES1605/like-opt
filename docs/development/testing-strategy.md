# 🧪 Like-Opt - Testing Strategy

## 📋 개요

**목적**: Like-Opt 시스템의 완전한 테스트 및 검증 전략

**범위**: 백엔드 API, 프론트엔드 UI, 통합 시스템, 성능, 보안
**목표**: 95% 이상 코드 커버리지, 모든 사용자 시나리오 검증

---

## 🎯 테스트 전략 목표

### 1. 품질 보장
- ✅ **기능 정확성**: 모든 기능이 명세대로 작동
- 🔒 **안정성**: 에러 상황에서도 시스템 안정성 유지
- ⚡ **성능**: 응답 시간 및 리소스 사용량 최적화
- 🛡️ **보안**: 인증, 권한, 입력 검증 완벽 구현

### 2. 개발 효율성
- 🚀 **빠른 피드백**: 개발 중 즉시 문제 발견
- 🔄 **자동화**: CI/CD 파이프라인에서 자동 실행
- 📊 **측정 가능**: 정량적 품질 지표 제공
- 🔧 **유지보수**: 테스트 코드 자체의 품질 관리

---

## 🏗️ 테스트 피라미드 구조

### 1. 단위 테스트 (Unit Tests) - 70%
```
백엔드 (Python + pytest)
├── services/
│   ├── chat_service_test.py
│   ├── ai_service_test.py
│   ├── rag_service_test.py
│   ├── indexing_service_test.py
│   └── restore_service_test.py
├── api/
│   ├── chat_api_test.py
│   └── admin_api_test.py
└── utils/
    ├── config_test.py
    └── helpers_test.py

프론트엔드 (JavaScript + Jest)
├── components/
│   ├── Button.test.js
│   ├── Modal.test.js
│   ├── ToggleSwitch.test.js
│   └── ChatInterface.test.js
├── services/
│   ├── api.test.js
│   ├── chatService.test.js
│   └── adminService.test.js
└── utils/
    ├── helpers.test.js
    └── validators.test.js
```

### 2. 통합 테스트 (Integration Tests) - 20%
```
API 통합 테스트
├── chat_flow_test.py
├── admin_flow_test.py
├── rag_integration_test.py
└── backup_restore_test.py

프론트엔드-백엔드 통합
├── api_integration.test.js
├── chat_workflow.test.js
└── admin_workflow.test.js
```

### 3. E2E 테스트 (End-to-End Tests) - 10%
```
사용자 시나리오
├── student_learning_flow.spec.js
├── admin_management_flow.spec.js
├── system_recovery_flow.spec.js
└── performance_scenarios.spec.js
```

---

## 🔧 백엔드 테스트 구현

### 1. 단위 테스트 (pytest)

#### 1.1 Chat Service 테스트
```python
# tests/unit/services/test_chat_service.py
import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from src.backend.services.chat_service import ChatService, ChatMessage

class TestChatService:
    @pytest.fixture
    def chat_service(self):
        with patch('src.backend.services.chat_service.has_request_context', return_value=True):
            with patch('src.backend.services.chat_service.session') as mock_session:
                mock_session.__getitem__ = Mock(return_value=[])
                mock_session.__setitem__ = Mock()
                yield ChatService()

    def test_add_message(self, chat_service):
        """메시지 추가 테스트"""
        chat_service.add_message('user', 'Hello')
        
        # 세션에 메시지가 저장되었는지 확인
        assert chat_service.get_conversation()[0].role == 'user'
        assert chat_service.get_conversation()[0].content == 'Hello'

    def test_get_conversation_for_ai(self, chat_service):
        """AI용 대화 형식 변환 테스트"""
        chat_service.add_message('user', 'Hello')
        chat_service.add_message('assistant', 'Hi there!')
        
        ai_conversation = chat_service.get_conversation_for_ai()
        assert len(ai_conversation) == 2
        assert ai_conversation[0]['role'] == 'user'
        assert ai_conversation[1]['role'] == 'assistant'

    def test_clear_conversation(self, chat_service):
        """대화 기록 초기화 테스트"""
        chat_service.add_message('user', 'Hello')
        assert len(chat_service.get_conversation()) == 1
        
        chat_service.clear_conversation()
        assert len(chat_service.get_conversation()) == 0

    def test_export_import_conversation(self, chat_service):
        """대화 내보내기/가져오기 테스트"""
        chat_service.add_message('user', 'Hello')
        chat_service.add_message('assistant', 'Hi!')
        
        # 내보내기
        exported = chat_service.export_conversation()
        assert exported['message_count'] == 2
        assert len(exported['conversation']) == 2
        
        # 초기화 후 가져오기
        chat_service.clear_conversation()
        assert len(chat_service.get_conversation()) == 0
        
        success = chat_service.import_conversation(exported)
        assert success
        assert len(chat_service.get_conversation()) == 2

class TestChatMessage:
    def test_message_creation(self):
        """메시지 객체 생성 테스트"""
        msg = ChatMessage('user', 'Hello')
        assert msg.role == 'user'
        assert msg.content == 'Hello'
        assert isinstance(msg.timestamp, datetime)

    def test_message_to_dict(self):
        """메시지 딕셔너리 변환 테스트"""
        msg = ChatMessage('user', 'Hello')
        msg_dict = msg.to_dict()
        
        assert msg_dict['role'] == 'user'
        assert msg_dict['content'] == 'Hello'
        assert 'timestamp' in msg_dict

    def test_message_from_dict(self):
        """딕셔너리에서 메시지 생성 테스트"""
        msg_dict = {
            'role': 'user',
            'content': 'Hello',
            'timestamp': '2025-10-17T10:00:00'
        }
        
        msg = ChatMessage.from_dict(msg_dict)
        assert msg.role == 'user'
        assert msg.content == 'Hello'
        assert isinstance(msg.timestamp, datetime)
```

#### 1.2 AI Service 테스트
```python
# tests/unit/services/test_ai_service.py
import pytest
from unittest.mock import Mock, patch
from src.backend.services.ai_service import AIService

class TestAIService:
    @pytest.fixture
    def ai_service(self):
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'}):
            yield AIService()

    @patch('src.backend.services.ai_service.openai.OpenAI')
    def test_openai_client_initialization(self, mock_openai, ai_service):
        """OpenAI 클라이언트 초기화 테스트"""
        assert ai_service.openai_client is not None
        mock_openai.assert_called_once_with(api_key='test-key')

    @patch('src.backend.services.ai_service.openai.OpenAI')
    def test_stream_chat_completion_openai(self, mock_openai, ai_service):
        """OpenAI 스트리밍 채팅 테스트"""
        # Mock OpenAI 응답
        mock_chunk1 = Mock()
        mock_chunk1.choices = [Mock()]
        mock_chunk1.choices[0].delta.content = "Hello"
        
        mock_chunk2 = Mock()
        mock_chunk2.choices = [Mock()]
        mock_chunk2.choices[0].delta.content = " World"
        
        mock_stream = [mock_chunk1, mock_chunk2]
        ai_service.openai_client.chat.completions.create.return_value = mock_stream
        
        messages = [{'role': 'user', 'content': 'Hello'}]
        chunks = list(ai_service.stream_chat_completion(messages, provider='openai'))
        
        assert chunks == ['Hello', ' World']

    @patch('src.backend.services.ai_service.genai')
    def test_stream_chat_completion_gemini(self, mock_genai, ai_service):
        """Gemini 스트리밍 채팅 테스트"""
        # Mock Gemini 응답
        mock_chunk1 = Mock()
        mock_chunk1.text = "Hello"
        
        mock_chunk2 = Mock()
        mock_chunk2.text = " World"
        
        mock_stream = [mock_chunk1, mock_chunk2]
        mock_model = Mock()
        mock_model.generate_content.return_value = mock_stream
        mock_genai.GenerativeModel.return_value = mock_model
        
        messages = [{'role': 'user', 'content': 'Hello'}]
        chunks = list(ai_service.stream_chat_completion(messages, provider='gemini'))
        
        assert chunks == ['Hello', ' World']

    def test_no_provider_available(self, ai_service):
        """AI 제공자가 없는 경우 테스트"""
        ai_service.openai_client = None
        ai_service.gemini_client = None
        
        messages = [{'role': 'user', 'content': 'Hello'}]
        chunks = list(ai_service.stream_chat_completion(messages))
        
        assert chunks == ['죄송합니다. 유효한 AI 제공자가 설정되지 않았습니다.']
```

#### 1.3 API 엔드포인트 테스트
```python
# tests/unit/api/test_chat_api.py
import pytest
from unittest.mock import Mock, patch
from flask import Flask
from src.backend.app import create_app
from src.backend.services.chat_service import chat_service
from src.backend.services.ai_service import ai_service

class TestChatAPI:
    @pytest.fixture
    def app(self):
        app = create_app()
        app.config['TESTING'] = True
        return app

    @pytest.fixture
    def client(self, app):
        return app.test_client()

    @patch('src.backend.services.chat_service.chat_service')
    @patch('src.backend.services.ai_service.ai_service')
    def test_chat_endpoint_success(self, mock_ai_service, mock_chat_service, client):
        """채팅 엔드포인트 성공 테스트"""
        # Mock 설정
        mock_chat_service.add_message = Mock()
        mock_chat_service.get_conversation_for_ai.return_value = [
            {'role': 'user', 'content': 'Hello'}
        ]
        
        mock_ai_service.stream_chat_completion.return_value = ['Hello', ' World']
        
        # API 호출
        response = client.post('/api/v1/chat', json={
            'message': 'Hello',
            'mode': 'grammar',
            'stream': True
        })
        
        assert response.status_code == 200
        assert response.data.decode() == 'Hello World'

    def test_chat_endpoint_no_message(self, client):
        """메시지가 없는 경우 테스트"""
        response = client.post('/api/v1/chat', json={
            'mode': 'grammar'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert '메시지를 입력해주세요' in data['error']

    @patch('src.backend.services.chat_service.chat_service')
    def test_conversation_endpoint(self, mock_chat_service, client):
        """대화 기록 조회 테스트"""
        mock_messages = [
            Mock(role='user', content='Hello', timestamp='2025-10-17T10:00:00'),
            Mock(role='assistant', content='Hi!', timestamp='2025-10-17T10:00:01')
        ]
        mock_chat_service.get_conversation.return_value = mock_messages
        
        response = client.get('/api/v1/conversation')
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 2
        assert data[0]['role'] == 'user'
        assert data[1]['role'] == 'assistant'

    @patch('src.backend.services.chat_service.chat_service')
    def test_clear_conversation_endpoint(self, mock_chat_service, client):
        """대화 기록 초기화 테스트"""
        mock_chat_service.clear_conversation = Mock()
        
        response = client.delete('/api/v1/conversation')
        
        assert response.status_code == 200
        mock_chat_service.clear_conversation.assert_called_once()
```

### 2. 통합 테스트

#### 2.1 전체 채팅 플로우 테스트
```python
# tests/integration/test_chat_flow.py
import pytest
from unittest.mock import patch, Mock
from src.backend.app import create_app
from src.backend.services.chat_service import chat_service
from src.backend.services.ai_service import ai_service

class TestChatFlow:
    @pytest.fixture
    def app(self):
        app = create_app()
        app.config['TESTING'] = True
        return app

    @pytest.fixture
    def client(self, app):
        return app.test_client()

    @patch('src.backend.services.ai_service.ai_service')
    def test_complete_chat_flow(self, mock_ai_service, client):
        """전체 채팅 플로우 테스트"""
        # AI 서비스 Mock 설정
        mock_ai_service.stream_chat_completion.return_value = [
            '안녕하세요! ', '저는 Professor G입니다. ', '영어 학습을 도와드리겠습니다.'
        ]
        
        # 1. 첫 번째 메시지 전송
        response1 = client.post('/api/v1/chat', json={
            'message': '안녕하세요',
            'mode': 'grammar',
            'stream': True
        })
        
        assert response1.status_code == 200
        assert '안녕하세요!' in response1.data.decode()
        
        # 2. 대화 기록 확인
        response2 = client.get('/api/v1/conversation')
        assert response2.status_code == 200
        conversation = response2.get_json()
        assert len(conversation) == 2  # user + assistant
        
        # 3. 두 번째 메시지 전송
        mock_ai_service.stream_chat_completion.return_value = [
            '영어 문법에 대해 ', '질문해주세요!'
        ]
        
        response3 = client.post('/api/v1/chat', json={
            'message': '영어 문법을 배우고 싶습니다',
            'mode': 'grammar',
            'stream': True
        })
        
        assert response3.status_code == 200
        assert '영어 문법' in response3.data.decode()
        
        # 4. 최종 대화 기록 확인
        response4 = client.get('/api/v1/conversation')
        final_conversation = response4.get_json()
        assert len(final_conversation) == 4  # 2개 메시지 쌍

    def test_mode_switching_flow(self, client):
        """모드 전환 플로우 테스트"""
        # 모드 설정
        response = client.post('/api/v1/mode', json={
            'mode': 'sentence',
            'difficulty': 'advanced'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'sentence' in data['message']

    def test_conversation_management_flow(self, client):
        """대화 관리 플로우 테스트"""
        # 대화 기록 초기화
        response = client.delete('/api/v1/conversation')
        assert response.status_code == 200
        
        # 초기화 후 대화 기록 확인
        response = client.get('/api/v1/conversation')
        conversation = response.get_json()
        assert len(conversation) == 0
```

---

## 🎨 프론트엔드 테스트 구현

### 1. 단위 테스트 (Jest)

#### 1.1 컴포넌트 테스트
```javascript
// tests/unit/components/Button.test.js
import { Button } from '../../../frontend/src/components/common/Button.js';

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
      size: 'large',
      disabled: true
    });
    
    const html = button.render();
    expect(html).toContain('Custom Button');
    expect(html).toContain('btn-secondary');
    expect(html).toContain('btn-large');
    expect(html).toContain('disabled');
  });

  test('should attach click event listener', () => {
    const mockCallback = jest.fn();
    const button = new Button({
      text: 'Test Button',
      onClick: mockCallback
    });
    
    const html = button.render();
    const buttonElement = document.createElement('div');
    buttonElement.innerHTML = html;
    
    button.attachEventListeners(buttonElement);
    
    const buttonEl = buttonElement.querySelector('button');
    buttonEl.click();
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
```

#### 1.2 서비스 테스트
```javascript
// tests/unit/services/chatService.test.js
import { ChatService, ChatError } from '../../../frontend/src/services/chatService.js';
import { apiClient } from '../../../frontend/src/services/api.js';

// Mock fetch
global.fetch = jest.fn();

describe('ChatService', () => {
  let chatService;

  beforeEach(() => {
    chatService = new ChatService();
    fetch.mockClear();
  });

  test('should send message successfully', async () => {
    const mockResponse = {
      success: true,
      response: 'Hello! I am Professor G.'
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await chatService.sendMessage({
      message: 'Hello',
      mode: 'grammar'
    });

    expect(result).toEqual(mockResponse);
    expect(chatService.conversation).toHaveLength(2);
    expect(chatService.conversation[0].role).toBe('user');
    expect(chatService.conversation[1].role).toBe('assistant');
  });

  test('should handle API error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(chatService.sendMessage({
      message: 'Hello',
      mode: 'grammar'
    })).rejects.toThrow(ChatError);
  });

  test('should stream message successfully', async () => {
    let receivedChunks = [];
    const mockOnChunk = jest.fn((chunk) => {
      receivedChunks.push(chunk);
    });

    // Mock stream response
    const mockResponse = {
      ok: true,
      body: {
        getReader: jest.fn().mockReturnValue({
          read: jest.fn()
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('Hello') })
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(' World') })
            .mockResolvedValueOnce({ done: true })
        })
      }
    };

    fetch.mockResolvedValueOnce(mockResponse);

    await chatService.sendMessageStream({
      message: 'Hello',
      mode: 'grammar'
    }, mockOnChunk);

    expect(receivedChunks).toEqual(['Hello', ' World']);
    expect(chatService.conversation).toHaveLength(2);
  });

  test('should get conversation from API', async () => {
    const mockConversation = [
      { role: 'user', content: 'Hello', timestamp: '2025-10-17T10:00:00' },
      { role: 'assistant', content: 'Hi!', timestamp: '2025-10-17T10:00:01' }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversation
    });

    const result = await chatService.getConversation();
    
    expect(result).toEqual(mockConversation);
    expect(chatService.conversation).toEqual(mockConversation);
  });

  test('should clear conversation', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Conversation cleared' })
    });

    // 먼저 대화 추가
    chatService.conversation = [
      { role: 'user', content: 'Hello', timestamp: new Date() }
    ];

    const result = await chatService.clearConversation();
    
    expect(result).toBe(true);
    expect(chatService.conversation).toHaveLength(0);
  });
});
```

#### 1.3 API 클라이언트 테스트
```javascript
// tests/unit/services/api.test.js
import { ApiClient, ApiError } from '../../../frontend/src/services/api.js';

global.fetch = jest.fn();

describe('ApiClient', () => {
  let apiClient;

  beforeEach(() => {
    apiClient = new ApiClient('/api/v1');
    fetch.mockClear();
  });

  test('should make GET request successfully', async () => {
    const mockResponse = { data: 'test' };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await apiClient.get('/test');

    expect(fetch).toHaveBeenCalledWith('/api/v1/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      signal: expect.any(AbortSignal)
    });
    expect(result).toEqual(mockResponse);
  });

  test('should make POST request with data', async () => {
    const mockResponse = { success: true };
    const requestData = { message: 'Hello' };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await apiClient.post('/chat', requestData);

    expect(fetch).toHaveBeenCalledWith('/api/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(requestData),
      signal: expect.any(AbortSignal)
    });
    expect(result).toEqual(mockResponse);
  });

  test('should handle API errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad Request' })
    });

    await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
  });

  test('should handle network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(apiClient.get('/test')).rejects.toThrow('Network error');
  });

  test('should handle timeout', async () => {
    const timeoutApiClient = new ApiClient('/api/v1');
    timeoutApiClient.timeout = 100; // 100ms timeout

    fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ data: 'test' })
      }), 200))
    );

    await expect(timeoutApiClient.get('/test')).rejects.toThrow(ApiError);
  });
});
```

### 2. 통합 테스트

#### 2.1 API 통합 테스트
```javascript
// tests/integration/api.test.js
import { chatService } from '../../frontend/src/services/chatService.js';
import { adminService } from '../../frontend/src/services/adminService.js';

describe('API Integration Tests', () => {
  // 실제 백엔드 서버가 실행 중이어야 함
  const TEST_SERVER_URL = 'http://localhost:5000';

  beforeAll(async () => {
    // 테스트 서버 시작 확인
    const healthCheck = await fetch(`${TEST_SERVER_URL}/api/v1/health`);
    if (!healthCheck.ok) {
      throw new Error('Test server is not running');
    }
  });

  describe('Chat API Integration', () => {
    test('should complete chat flow', async () => {
      // 대화 기록 초기화
      await chatService.clearConversation();
      
      // 메시지 전송
      const response = await chatService.sendMessage({
        message: 'Hello, Professor G!',
        mode: 'grammar',
        difficulty: 'intermediate'
      });

      expect(response.success).toBe(true);
      expect(response.response).toContain('Professor G');

      // 대화 기록 확인
      const conversation = await chatService.getConversation();
      expect(conversation).toHaveLength(2);
      expect(conversation[0].role).toBe('user');
      expect(conversation[1].role).toBe('assistant');
    });

    test('should handle mode switching', async () => {
      await chatService.setMode('sentence', 'advanced');
      expect(chatService.currentMode).toBe('sentence');
      expect(chatService.currentDifficulty).toBe('advanced');
    });
  });

  describe('Admin API Integration', () => {
    test('should handle admin login and logout', async () => {
      // 로그인
      const loginResult = await adminService.login('1234');
      expect(loginResult.success).toBe(true);
      expect(adminService.isAuthenticated).toBe(true);

      // 로그아웃
      const logoutResult = await adminService.logout();
      expect(logoutResult.success).toBe(true);
      expect(adminService.isAuthenticated).toBe(false);
    });

    test('should get indexing status', async () => {
      // 먼저 로그인
      await adminService.login('1234');

      const status = await adminService.getIndexingStatus();
      expect(status).toHaveProperty('is_ready');
      expect(status).toHaveProperty('chunks_count');
    });

    test('should list backups', async () => {
      await adminService.login('1234');

      const backups = await adminService.listBackups();
      expect(Array.isArray(backups)).toBe(true);
    });
  });
});
```

---

## 🎭 E2E 테스트 (Playwright)

### 1. 학생 학습 플로우
```javascript
// tests/e2e/student-learning-flow.spec.js
import { test, expect } from '@playwright/test';

test.describe('Student Learning Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full learning session', async ({ page }) => {
    // 1. 메인 페이지 로드 확인
    await expect(page.locator('.chat-interface')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Professor G와 영어 학습');

    // 2. 첫 번째 메시지 전송
    await page.fill('[data-message-input]', '안녕하세요, Professor G!');
    await page.click('[data-send-button]');

    // 3. AI 응답 확인
    await expect(page.locator('.message-ai')).toBeVisible();
    await expect(page.locator('.message-ai .message-content')).toContainText('Professor G');

    // 4. 모드 변경
    await page.click('[data-mode-selector]');
    await page.click('[data-mode="sentence"]');

    // 5. 두 번째 메시지 전송
    await page.fill('[data-message-input]', '이 문장을 분석해주세요: "The quick brown fox jumps over the lazy dog."');
    await page.click('[data-send-button]');

    // 6. 문장 분석 응답 확인
    await expect(page.locator('.message-ai').last()).toBeVisible();
    await expect(page.locator('.message-ai .message-content').last()).toContainText('분석');

    // 7. 대화 기록 확인
    const messages = page.locator('.message');
    await expect(messages).toHaveCount(4); // 2개 메시지 쌍

    // 8. 대화 초기화
    await page.click('[data-clear-conversation]');
    await expect(page.locator('.message')).toHaveCount(0);
  });

  test('should handle different difficulty levels', async ({ page }) => {
    // 난이도 선택기 테스트
    await page.click('[data-difficulty-selector]');
    await page.click('[data-difficulty="beginner"]');

    await page.fill('[data-message-input]', '영어 문법을 배우고 싶습니다');
    await page.click('[data-send-button]');

    await expect(page.locator('.message-ai')).toBeVisible();
    // 초급자용 응답인지 확인 (더 간단한 설명)
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // 네트워크 오류 시뮬레이션
    await page.route('**/api/v1/chat', route => route.abort());

    await page.fill('[data-message-input]', 'Hello');
    await page.click('[data-send-button]');

    // 에러 메시지 확인
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('네트워크 오류');
  });
});
```

### 2. 관리자 관리 플로우
```javascript
// tests/e2e/admin-management-flow.spec.js
import { test, expect } from '@playwright/test';

test.describe('Admin Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete admin login and management', async ({ page }) => {
    // 1. 관리자 로그인 버튼 클릭
    await page.click('[data-admin-login-button]');
    await expect(page.locator('.modal-overlay')).toBeVisible();

    // 2. 로그인 폼 입력
    await page.fill('[data-admin-password]', '1234');
    await page.click('[data-login-submit]');

    // 3. 관리자 패널 표시 확인
    await expect(page.locator('.admin-panel')).toBeVisible();
    await expect(page.locator('.admin-panel h3')).toContainText('관리자 대시보드');

    // 4. 질문모드 관리 카드 확인
    await expect(page.locator('.question-mode-card')).toBeVisible();
    
    // 5. Professor G 토글 테스트
    const professorGToggle = page.locator('[data-professor-g-toggle]');
    await expect(professorGToggle).toBeChecked();
    
    await professorGToggle.click();
    await expect(professorGToggle).not.toBeChecked();

    // 6. 학습 모드 토글 테스트
    const grammarToggle = page.locator('[data-grammar-toggle]');
    await expect(grammarToggle).toBeChecked();
    
    await grammarToggle.click();
    await expect(grammarToggle).not.toBeChecked();

    // 7. 인덱싱 상태 확인
    await expect(page.locator('.indexing-status')).toBeVisible();
    
    // 8. 인덱싱 실행
    await page.click('[data-run-indexing]');
    await expect(page.locator('.indexing-progress')).toBeVisible();

    // 9. 백업 목록 확인
    await expect(page.locator('.backup-list')).toBeVisible();

    // 10. 로그아웃
    await page.click('[data-admin-logout]');
    await expect(page.locator('.admin-panel')).not.toBeVisible();
  });

  test('should handle invalid admin password', async ({ page }) => {
    await page.click('[data-admin-login-button]');
    
    await page.fill('[data-admin-password]', 'wrong-password');
    await page.click('[data-login-submit]');

    // 에러 메시지 확인
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('잘못된 비밀번호');
  });

  test('should create and restore backup', async ({ page }) => {
    // 로그인
    await page.click('[data-admin-login-button]');
    await page.fill('[data-admin-password]', '1234');
    await page.click('[data-login-submit]');

    // 백업 생성
    await page.click('[data-create-backup]');
    await expect(page.locator('.backup-creation-progress')).toBeVisible();
    
    // 백업 완료 확인
    await expect(page.locator('.backup-success')).toBeVisible();

    // 백업 목록 새로고침
    await page.click('[data-refresh-backups]');
    
    // 백업 항목 확인
    await expect(page.locator('.backup-item')).toHaveCount.greaterThan(0);

    // 백업 복원 테스트 (마지막 백업)
    const lastBackup = page.locator('.backup-item').first();
    await lastBackup.locator('[data-restore-backup]').click();
    
    await expect(page.locator('.restore-confirmation')).toBeVisible();
    await page.click('[data-confirm-restore]');
    
    await expect(page.locator('.restore-success')).toBeVisible();
  });
});
```

### 3. 성능 시나리오
```javascript
// tests/e2e/performance-scenarios.spec.js
import { test, expect } from '@playwright/test';

test.describe('Performance Scenarios', () => {
  test('should load page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000); // 2초 이내 로딩
    await expect(page.locator('.chat-interface')).toBeVisible();
  });

  test('should handle multiple rapid messages', async ({ page }) => {
    await page.goto('/');

    const messages = [
      'Hello',
      'How are you?',
      'Can you help me?',
      'What is grammar?',
      'Explain this please'
    ];

    const startTime = Date.now();

    for (const message of messages) {
      await page.fill('[data-message-input]', message);
      await page.click('[data-send-button]');
      
      // 각 메시지 응답 대기
      await expect(page.locator('.message-ai').last()).toBeVisible();
    }

    const totalTime = Date.now() - startTime;
    const averageTime = totalTime / messages.length;

    expect(averageTime).toBeLessThan(3000); // 평균 3초 이내 응답
  });

  test('should maintain performance with long conversation', async ({ page }) => {
    await page.goto('/');

    // 20개 메시지 전송
    for (let i = 1; i <= 20; i++) {
      await page.fill('[data-message-input]', `Message ${i}`);
      await page.click('[data-send-button]');
      
      await expect(page.locator('.message-ai').last()).toBeVisible();
    }

    // 페이지 성능 확인
    const performanceMetrics = await page.evaluate(() => {
      return {
        memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : null,
        domNodes: document.querySelectorAll('*').length,
        messageCount: document.querySelectorAll('.message').length
      };
    });

    expect(performanceMetrics.messageCount).toBe(40); // 20개 메시지 쌍
    expect(performanceMetrics.domNodes).toBeLessThan(1000); // DOM 노드 수 제한
  });
});
```

---

## 🔧 테스트 설정 및 도구

### 1. Jest 설정
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js'
  ],
  collectCoverageFrom: [
    'frontend/src/**/*.js',
    '!frontend/src/main.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1'
  }
};
```

### 2. Playwright 설정
```javascript
// playwright.config.js
module.exports = {
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' }
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' }
    }
  ],
  webServer: {
    command: 'cd backend && python run.py',
    port: 5000,
    reuseExistingServer: !process.env.CI
  }
};
```

### 3. pytest 설정
```python
# pytest.ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --verbose
    --tb=short
    --cov=src
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=90
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
```

---

## 📊 테스트 자동화 및 CI/CD

### 1. GitHub Actions 워크플로우
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run backend tests
      run: |
        cd backend
        pytest tests/ -v --cov=src --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd frontend
        npm install
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm test -- --coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./frontend/coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install Python dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Start backend server
      run: |
        cd backend
        python run.py &
        sleep 10
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm install
    
    - name: Install Playwright
      run: |
        cd frontend
        npx playwright install
    
    - name: Run E2E tests
      run: |
        cd frontend
        npx playwright test
    
    - name: Upload E2E test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: frontend/playwright-report/
```

### 2. 테스트 실행 스크립트
```bash
#!/bin/bash
# scripts/run-tests.sh

echo "🧪 Like-Opt - Test Suite"
echo "====================================="

# 백엔드 테스트
echo "📊 Running Backend Tests..."
cd backend
python -m pytest tests/ -v --cov=src --cov-report=html --cov-report=term
BACKEND_EXIT_CODE=$?

# 프론트엔드 테스트
echo "🎨 Running Frontend Tests..."
cd ../frontend
npm test -- --coverage --watchAll=false
FRONTEND_EXIT_CODE=$?

# E2E 테스트 (백엔드 서버 실행 필요)
echo "🎭 Running E2E Tests..."
cd ../backend
python run.py &
SERVER_PID=$!
sleep 5

cd ../frontend
npx playwright test
E2E_EXIT_CODE=$?

# 서버 종료
kill $SERVER_PID

# 결과 출력
echo "====================================="
echo "📊 Test Results:"
echo "Backend: $([ $BACKEND_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo "Frontend: $([ $FRONTEND_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo "E2E: $([ $E2E_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")"

# 전체 결과
if [ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ] && [ $E2E_EXIT_CODE -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "💥 Some tests failed!"
    exit 1
fi
```

---

## 📈 테스트 메트릭 및 모니터링

### 1. 커버리지 목표
- **전체 코드 커버리지**: > 95%
- **백엔드 커버리지**: > 95%
- **프론트엔드 커버리지**: > 90%
- **API 엔드포인트 커버리지**: 100%

### 2. 성능 목표
- **단위 테스트**: < 10초 (전체)
- **통합 테스트**: < 30초 (전체)
- **E2E 테스트**: < 5분 (전체)
- **페이지 로딩**: < 2초
- **API 응답**: < 500ms

### 3. 품질 메트릭
- **테스트 안정성**: > 99% (재실행 시 동일 결과)
- **버그 발견률**: > 90% (프로덕션 이슈 예방)
- **회귀 테스트**: 100% (주요 기능)
- **접근성 테스트**: WCAG 2.1 AA 준수

---

## 📅 테스트 구현 일정

### Week 1: 백엔드 테스트 구현
- **Day 1**: pytest 설정, 기본 테스트 구조
- **Day 2**: Chat Service 단위 테스트
- **Day 3**: AI Service 단위 테스트
- **Day 4**: API 엔드포인트 테스트
- **Day 5**: 통합 테스트 구현

### Week 2: 프론트엔드 테스트 구현
- **Day 1**: Jest 설정, 컴포넌트 테스트
- **Day 2**: 서비스 테스트, API 클라이언트 테스트
- **Day 3**: 통합 테스트, 상태 관리 테스트
- **Day 4**: E2E 테스트 (Playwright)
- **Day 5**: 테스트 자동화, CI/CD 설정

### Week 3: 테스트 최적화 및 문서화
- **Day 1**: 테스트 성능 최적화
- **Day 2**: 커버리지 향상
- **Day 3**: 테스트 문서화
- **Day 4**: 모니터링 설정
- **Day 5**: 최종 검증 및 릴리스

---

## 🎯 성공 지표

### 기능적 요구사항
- ✅ **테스트 커버리지**: > 95%
- ✅ **테스트 안정성**: > 99%
- ✅ **버그 발견률**: > 90%
- ✅ **자동화**: 100% CI/CD 통합

### 성능 요구사항
- 🚀 **테스트 실행 시간**: < 10분 (전체)
- ⚡ **E2E 테스트**: < 5분
- 💾 **테스트 리소스**: 최적화된 메모리 사용
- 📊 **커버리지 리포트**: 실시간 모니터링

### 품질 요구사항
- 🧪 **테스트 품질**: 명확한 테스트 케이스
- 📚 **문서화**: 100% 테스트 문서화
- 🔧 **유지보수**: 테스트 코드 품질 관리
- 🎯 **목표 달성**: 모든 성공 지표 달성

---

**마지막 업데이트**: 2025-10-17  
**버전**: 1.0.0  
**상태**: 📋 계획 완료, 🚀 구현 준비
