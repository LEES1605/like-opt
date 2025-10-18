/**
 * 시스템 관리 컴포넌트
 * 환경 변수, 보안 설정, 성능 관리 기능
 */

import { BaseComponent } from '../base/BaseComponent.js';
import { eventBus, AppEvents } from '../../utils/events.js';

export class SystemManagement extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.systemInfo = {};
    this.environmentSettings = {};
    this.securitySettings = {};
    this.performanceSettings = {};
    
    this.init();
  }

  init() {
    this.createHTML();
    this.bindEvents();
    this.loadSystemInfo();
  }

  createHTML() {
    this.element.innerHTML = `
      <div class="system-management">
        <div class="admin-header">
          <h2>⚙️ 시스템 관리</h2>
          <div class="system-status">
            <span class="status-indicator" id="system-status">연결 중...</span>
          </div>
        </div>

        <div class="system-grid">
          <!-- 시스템 정보 -->
          <div class="system-card">
            <div class="card-header">
              <h3>📊 시스템 정보</h3>
              <button class="refresh-btn" id="refresh-system-info">새로고침</button>
            </div>
            <div class="card-content">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">서버 상태:</span>
                  <span class="info-value" id="server-status">-</span>
                </div>
                <div class="info-item">
                  <span class="info-label">메모리 사용량:</span>
                  <span class="info-value" id="memory-usage">-</span>
                </div>
                <div class="info-item">
                  <span class="info-label">CPU 사용률:</span>
                  <span class="info-value" id="cpu-usage">-</span>
                </div>
                <div class="info-item">
                  <span class="info-label">디스크 사용량:</span>
                  <span class="info-value" id="disk-usage">-</span>
                </div>
                <div class="info-item">
                  <span class="info-label">업타임:</span>
                  <span class="info-value" id="uptime">-</span>
                </div>
                <div class="info-item">
                  <span class="info-label">버전:</span>
                  <span class="info-value" id="version">-</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 환경 설정 -->
          <div class="system-card">
            <div class="card-header">
              <h3>🔧 환경 설정</h3>
              <button class="edit-btn" id="edit-environment">편집</button>
            </div>
            <div class="card-content">
              <div class="settings-list">
                <div class="setting-item">
                  <span class="setting-label">OpenAI API Key:</span>
                  <span class="setting-value" id="openai-key">••••••••</span>
                </div>
                <div class="setting-item">
                  <span class="setting-label">Google API Key:</span>
                  <span class="setting-value" id="google-key">••••••••</span>
                </div>
                <div class="setting-item">
                  <span class="setting-label">GitHub Token:</span>
                  <span class="setting-value" id="github-token">••••••••</span>
                </div>
                <div class="setting-item">
                  <span class="setting-label">데이터베이스 URL:</span>
                  <span class="setting-value" id="db-url">sqlite:///app.db</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 보안 설정 -->
          <div class="system-card">
            <div class="card-header">
              <h3>🔒 보안 설정</h3>
              <button class="edit-btn" id="edit-security">편집</button>
            </div>
            <div class="card-content">
              <div class="security-settings">
                <div class="security-item">
                  <label class="security-label">
                    <input type="checkbox" id="enable-2fa" checked>
                    <span class="checkmark"></span>
                    2단계 인증
                  </label>
                </div>
                <div class="security-item">
                  <label class="security-label">
                    <input type="checkbox" id="enable-rate-limit" checked>
                    <span class="checkmark"></span>
                    API 속도 제한
                  </label>
                </div>
                <div class="security-item">
                  <label class="security-label">
                    <input type="checkbox" id="enable-cors" checked>
                    <span class="checkmark"></span>
                    CORS 보안
                  </label>
                </div>
                <div class="security-item">
                  <label class="security-label">
                    <input type="checkbox" id="enable-https" checked>
                    <span class="checkmark"></span>
                    HTTPS 강제
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 성능 설정 -->
          <div class="system-card">
            <div class="card-header">
              <h3>⚡ 성능 설정</h3>
              <button class="edit-btn" id="edit-performance">편집</button>
            </div>
            <div class="card-content">
              <div class="performance-settings">
                <div class="performance-item">
                  <label class="performance-label">캐시 TTL (초):</label>
                  <input type="number" id="cache-ttl" value="3600" min="60" max="86400">
                </div>
                <div class="performance-item">
                  <label class="performance-label">최대 연결 수:</label>
                  <input type="number" id="max-connections" value="100" min="10" max="1000">
                </div>
                <div class="performance-item">
                  <label class="performance-label">요청 타임아웃 (초):</label>
                  <input type="number" id="request-timeout" value="30" min="5" max="300">
                </div>
                <div class="performance-item">
                  <label class="performance-label">로그 레벨:</label>
                  <select id="log-level">
                    <option value="DEBUG">DEBUG</option>
                    <option value="INFO" selected>INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- 시스템 액션 -->
          <div class="system-card">
            <div class="card-header">
              <h3>🔄 시스템 액션</h3>
            </div>
            <div class="card-content">
              <div class="action-buttons">
                <button class="action-btn restart-btn" id="restart-system">
                  <span class="btn-icon">🔄</span>
                  시스템 재시작
                </button>
                <button class="action-btn backup-btn" id="create-backup">
                  <span class="btn-icon">💾</span>
                  백업 생성
                </button>
                <button class="action-btn optimize-btn" id="optimize-system">
                  <span class="btn-icon">⚡</span>
                  시스템 최적화
                </button>
                <button class="action-btn logs-btn" id="view-logs">
                  <span class="btn-icon">📋</span>
                  로그 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 시스템 정보 새로고침
    const refreshBtn = this.element.querySelector('#refresh-system-info');
    refreshBtn.addEventListener('click', () => {
      this.loadSystemInfo();
    });

    // 환경 설정 편집
    const editEnvBtn = this.element.querySelector('#edit-environment');
    editEnvBtn.addEventListener('click', () => {
      this.showEnvironmentEditor();
    });

    // 보안 설정 편집
    const editSecurityBtn = this.element.querySelector('#edit-security');
    editSecurityBtn.addEventListener('click', () => {
      this.showSecurityEditor();
    });

    // 성능 설정 편집
    const editPerfBtn = this.element.querySelector('#edit-performance');
    editPerfBtn.addEventListener('click', () => {
      this.showPerformanceEditor();
    });

    // 시스템 액션
    const restartBtn = this.element.querySelector('#restart-system');
    restartBtn.addEventListener('click', () => {
      this.restartSystem();
    });

    const backupBtn = this.element.querySelector('#create-backup');
    backupBtn.addEventListener('click', () => {
      this.createBackup();
    });

    const optimizeBtn = this.element.querySelector('#optimize-system');
    optimizeBtn.addEventListener('click', () => {
      this.optimizeSystem();
    });

    const logsBtn = this.element.querySelector('#view-logs');
    logsBtn.addEventListener('click', () => {
      this.viewLogs();
    });

    // 보안 설정 토글
    const securityCheckboxes = this.element.querySelectorAll('.security-item input[type="checkbox"]');
    securityCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.updateSecuritySetting(e.target.id, e.target.checked);
      });
    });

    // 성능 설정 변경
    const performanceInputs = this.element.querySelectorAll('.performance-item input, .performance-item select');
    performanceInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.updatePerformanceSetting(e.target.id, e.target.value);
      });
    });
  }

  async loadSystemInfo() {
    try {
      // 시스템 정보 로드 (실제 API 호출)
      const response = await fetch('/api/admin/system/info');
      const data = await response.json();
      
      if (data.success) {
        this.systemInfo = data.data;
        this.updateSystemInfo();
      }
    } catch (error) {
      console.error('시스템 정보 로드 실패:', error);
      this.showError('시스템 정보를 불러올 수 없습니다.');
    }
  }

  updateSystemInfo() {
    const info = this.systemInfo;
    
    this.element.querySelector('#server-status').textContent = info.status || 'Unknown';
    this.element.querySelector('#memory-usage').textContent = info.memory || 'Unknown';
    this.element.querySelector('#cpu-usage').textContent = info.cpu || 'Unknown';
    this.element.querySelector('#disk-usage').textContent = info.disk || 'Unknown';
    this.element.querySelector('#uptime').textContent = info.uptime || 'Unknown';
    this.element.querySelector('#version').textContent = info.version || 'Unknown';
    
    // 상태 표시 업데이트
    const statusIndicator = this.element.querySelector('#system-status');
    statusIndicator.textContent = info.status === 'healthy' ? '정상' : '오류';
    statusIndicator.className = `status-indicator ${info.status === 'healthy' ? 'healthy' : 'error'}`;
  }

  showEnvironmentEditor() {
    // 환경 설정 편집 모달 표시
    eventBus.emit(AppEvents.SHOW_MODAL, {
      type: 'environment-editor',
      title: '환경 설정 편집',
      content: this.createEnvironmentEditorHTML()
    });
  }

  showSecurityEditor() {
    // 보안 설정 편집 모달 표시
    eventBus.emit(AppEvents.SHOW_MODAL, {
      type: 'security-editor',
      title: '보안 설정 편집',
      content: this.createSecurityEditorHTML()
    });
  }

  showPerformanceEditor() {
    // 성능 설정 편집 모달 표시
    eventBus.emit(AppEvents.SHOW_MODAL, {
      type: 'performance-editor',
      title: '성능 설정 편집',
      content: this.createPerformanceEditorHTML()
    });
  }

  createEnvironmentEditorHTML() {
    return `
      <div class="environment-editor">
        <div class="editor-section">
          <label for="openai-key-input">OpenAI API Key:</label>
          <input type="password" id="openai-key-input" placeholder="sk-...">
        </div>
        <div class="editor-section">
          <label for="google-key-input">Google API Key:</label>
          <input type="password" id="google-key-input" placeholder="AIza...">
        </div>
        <div class="editor-section">
          <label for="github-token-input">GitHub Token:</label>
          <input type="password" id="github-token-input" placeholder="ghp_...">
        </div>
        <div class="editor-section">
          <label for="db-url-input">데이터베이스 URL:</label>
          <input type="text" id="db-url-input" placeholder="sqlite:///app.db">
        </div>
      </div>
    `;
  }

  createSecurityEditorHTML() {
    return `
      <div class="security-editor">
        <div class="editor-section">
          <label>
            <input type="checkbox" id="2fa-enabled">
            2단계 인증 활성화
          </label>
        </div>
        <div class="editor-section">
          <label>
            <input type="checkbox" id="rate-limit-enabled">
            API 속도 제한 활성화
          </label>
        </div>
        <div class="editor-section">
          <label>
            <input type="checkbox" id="cors-enabled">
            CORS 보안 활성화
          </label>
        </div>
        <div class="editor-section">
          <label>
            <input type="checkbox" id="https-enabled">
            HTTPS 강제 활성화
          </label>
        </div>
      </div>
    `;
  }

  createPerformanceEditorHTML() {
    return `
      <div class="performance-editor">
        <div class="editor-section">
          <label for="cache-ttl-input">캐시 TTL (초):</label>
          <input type="number" id="cache-ttl-input" min="60" max="86400" value="3600">
        </div>
        <div class="editor-section">
          <label for="max-connections-input">최대 연결 수:</label>
          <input type="number" id="max-connections-input" min="10" max="1000" value="100">
        </div>
        <div class="editor-section">
          <label for="request-timeout-input">요청 타임아웃 (초):</label>
          <input type="number" id="request-timeout-input" min="5" max="300" value="30">
        </div>
        <div class="editor-section">
          <label for="log-level-select">로그 레벨:</label>
          <select id="log-level-select">
            <option value="DEBUG">DEBUG</option>
            <option value="INFO" selected>INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>
      </div>
    `;
  }

  async updateSecuritySetting(settingId, value) {
    try {
      const response = await fetch('/api/admin/system/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting: settingId, value: value })
      });
      
      if (response.ok) {
        this.showSuccess(`보안 설정이 업데이트되었습니다: ${settingId}`);
      }
    } catch (error) {
      console.error('보안 설정 업데이트 실패:', error);
      this.showError('보안 설정 업데이트에 실패했습니다.');
    }
  }

  async updatePerformanceSetting(settingId, value) {
    try {
      const response = await fetch('/api/admin/system/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting: settingId, value: value })
      });
      
      if (response.ok) {
        this.showSuccess(`성능 설정이 업데이트되었습니다: ${settingId}`);
      }
    } catch (error) {
      console.error('성능 설정 업데이트 실패:', error);
      this.showError('성능 설정 업데이트에 실패했습니다.');
    }
  }

  async restartSystem() {
    if (confirm('시스템을 재시작하시겠습니까? 이 작업은 서비스를 일시 중단시킬 수 있습니다.')) {
      try {
        const response = await fetch('/api/admin/system/restart', { method: 'POST' });
        if (response.ok) {
          this.showSuccess('시스템 재시작이 요청되었습니다.');
        }
      } catch (error) {
        console.error('시스템 재시작 실패:', error);
        this.showError('시스템 재시작에 실패했습니다.');
      }
    }
  }

  async createBackup() {
    try {
      const response = await fetch('/api/admin/system/backup', { method: 'POST' });
      if (response.ok) {
        this.showSuccess('백업이 생성되었습니다.');
      }
    } catch (error) {
      console.error('백업 생성 실패:', error);
      this.showError('백업 생성에 실패했습니다.');
    }
  }

  async optimizeSystem() {
    try {
      const response = await fetch('/api/admin/system/optimize', { method: 'POST' });
      if (response.ok) {
        this.showSuccess('시스템 최적화가 완료되었습니다.');
        this.loadSystemInfo(); // 정보 새로고침
      }
    } catch (error) {
      console.error('시스템 최적화 실패:', error);
      this.showError('시스템 최적화에 실패했습니다.');
    }
  }

  viewLogs() {
    // 로그 뷰어 모달 표시
    eventBus.emit(AppEvents.SHOW_MODAL, {
      type: 'log-viewer',
      title: '시스템 로그',
      content: '<div class="log-viewer">로그를 불러오는 중...</div>'
    });
  }

  showSuccess(message) {
    // 성공 메시지 표시
    console.log('Success:', message);
    // TODO: 토스트 알림 구현
  }

  showError(message) {
    // 에러 메시지 표시
    console.error('Error:', message);
    // TODO: 토스트 알림 구현
  }

  destroy() {
    super.destroy();
  }
}
