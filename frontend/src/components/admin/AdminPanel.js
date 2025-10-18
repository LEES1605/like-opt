/**
 * 관리자 패널 컴포넌트
 * Like-Opt 프론트엔드 관리자 패널 컴포넌트
 */

import { BaseComponent } from '../base/BaseComponent.js';
import { adminService } from '../../services/adminService.js';
import { eventBus, AppEvents } from '../../utils/events.js';
import { BackupManagement } from './BackupManagement.js';

/**
 * 관리자 패널 컴포넌트 클래스
 */
export class AdminPanel extends BaseComponent {
  constructor(options = {}) {
    super({
      className: 'admin-panel',
      ...options
    });
    
    this.showIndexing = options.showIndexing !== false;
    this.showBackup = options.showBackup !== false;
    this.showSettings = options.showSettings !== false;
    this.showStats = options.showStats !== false;
    this.autoRefresh = options.autoRefresh !== false;
    this.refreshInterval = options.refreshInterval || 30000; // 30초
    
    // 백업 관리 컴포넌트
    this.backupManagement = null;
  }
  
  /**
   * 상태 설정
   */
  setupState() {
    this.state = {
      isLoggedIn: false,
      isLoading: false,
      error: null,
      activeTab: 'overview',
      indexingStatus: {
        isRunning: false,
        progress: 0,
        currentTask: null,
        totalTasks: 0,
        completedTasks: 0
      },
      backupStatus: {
        isCreating: false,
        isRestoring: false,
        lastBackup: null,
        availableBackups: []
      },
      systemStats: {
        totalUsers: 0,
        totalConversations: 0,
        totalMessages: 0,
        systemUptime: 0,
        memoryUsage: 0,
        diskUsage: 0
      },
      settings: {
        autoIndexing: false,
        backupFrequency: 'daily',
        maxBackups: 10,
        notifications: true
      }
    };
  }
  
  /**
   * 이벤트 설정
   */
  setupEvents() {
    this.events = {
      'click .tab-button': (event) => this.handleTabClick(event),
      'click .start-indexing': (event) => this.handleStartIndexing(event),
      'click .stop-indexing': (event) => this.handleStopIndexing(event),
      'click .create-backup': (event) => this.handleCreateBackup(event),
      'click .restore-backup': (event) => this.handleRestoreBackup(event),
      'click .delete-backup': (event) => this.handleDeleteBackup(event),
      'click .save-settings': (event) => this.handleSaveSettings(event),
      'click .refresh-stats': (event) => this.handleRefreshStats(event),
      'click .logout-button': (event) => this.handleLogout(event),
      ...this.events
    };
  }
  
  /**
   * 템플릿 렌더링
   */
  renderTemplate() {
    const { isLoggedIn, isLoading, error, activeTab } = this.state;
    
    if (!isLoggedIn) {
      return this.renderLoginRequired();
    }
    
    return `
      <div class="admin-panel-container">
        <div class="admin-panel-header">
          <h2 class="admin-panel-title">관리자 패널</h2>
          <div class="admin-panel-actions">
            <button class="refresh-stats" title="새로고침">
              <span class="refresh-icon">🔄</span>
            </button>
            <button class="logout-button" title="로그아웃">
              <span class="logout-icon">🚪</span>
            </button>
          </div>
        </div>
        
        ${error ? this.renderError(error) : ''}
        
        <div class="admin-panel-tabs">
          ${this.renderTabs()}
        </div>
        
        <div class="admin-panel-content">
          ${this.renderTabContent(activeTab)}
        </div>
      </div>
    `;
  }
  
  /**
   * 로그인 필요 상태 렌더링
   */
  renderLoginRequired() {
    return `
      <div class="admin-panel-container login-required">
        <div class="admin-panel-header">
          <h2 class="admin-panel-title">관리자 패널</h2>
        </div>
        
        <div class="admin-panel-content">
          <div class="login-required-message">
            <div class="login-required-icon">🔒</div>
            <h3>관리자 권한이 필요합니다</h3>
            <p>관리자 패널에 접근하려면 로그인이 필요합니다.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * 에러 렌더링
   */
  renderError(error) {
    return `
      <div class="admin-panel-error">
        <div class="error-icon">⚠️</div>
        <div class="error-content">
          <h4 class="error-title">오류 발생</h4>
          <p class="error-message">${error}</p>
        </div>
        <button class="error-close" onclick="this.parentElement.remove()">×</button>
      </div>
    `;
  }
  
  /**
   * 탭 렌더링
   */
  renderTabs() {
    const { activeTab } = this.state;
    
    const tabs = [
      { id: 'overview', label: '개요', icon: '📊' },
      { id: 'indexing', label: '인덱싱', icon: '🔍' },
      { id: 'backup', label: '백업', icon: '💾' },
      { id: 'settings', label: '설정', icon: '⚙️' }
    ];
    
    return tabs.map(tab => `
      <button 
        class="tab-button ${activeTab === tab.id ? 'active' : ''}" 
        data-tab="${tab.id}"
      >
        <span class="tab-icon">${tab.icon}</span>
        <span class="tab-label">${tab.label}</span>
      </button>
    `).join('');
  }
  
  /**
   * 탭 콘텐츠 렌더링
   */
  renderTabContent(tabId) {
    switch (tabId) {
      case 'overview':
        return this.renderOverviewTab();
      case 'indexing':
        return this.renderIndexingTab();
      case 'backup':
        return this.renderBackupTab();
      case 'settings':
        return this.renderSettingsTab();
      default:
        return this.renderOverviewTab();
    }
  }
  
  /**
   * 개요 탭 렌더링
   */
  renderOverviewTab() {
    const { systemStats } = this.state;
    
    return `
      <div class="admin-tab-content overview-tab">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-value">${systemStats.totalUsers}</div>
              <div class="stat-label">총 사용자</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">💬</div>
            <div class="stat-content">
              <div class="stat-value">${systemStats.totalConversations}</div>
              <div class="stat-label">총 대화</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-content">
              <div class="stat-value">${systemStats.totalMessages}</div>
              <div class="stat-label">총 메시지</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
              <div class="stat-value">${this.formatUptime(systemStats.systemUptime)}</div>
              <div class="stat-label">시스템 가동시간</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🧠</div>
            <div class="stat-content">
              <div class="stat-value">${systemStats.memoryUsage}%</div>
              <div class="stat-label">메모리 사용률</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">💿</div>
            <div class="stat-content">
              <div class="stat-value">${systemStats.diskUsage}%</div>
              <div class="stat-label">디스크 사용률</div>
            </div>
          </div>
        </div>
        
        <div class="quick-actions">
          <h3>빠른 작업</h3>
          <div class="quick-action-buttons">
            <button class="quick-action-button" data-action="refresh-stats">
              <span class="action-icon">🔄</span>
              <span class="action-label">통계 새로고침</span>
            </button>
            <button class="quick-action-button" data-action="start-indexing">
              <span class="action-icon">🔍</span>
              <span class="action-label">인덱싱 시작</span>
            </button>
            <button class="quick-action-button" data-action="create-backup">
              <span class="action-icon">💾</span>
              <span class="action-label">백업 생성</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * 인덱싱 탭 렌더링
   */
  renderIndexingTab() {
    const { indexingStatus } = this.state;
    
    return `
      <div class="admin-tab-content indexing-tab">
        <div class="indexing-status">
          <h3>인덱싱 상태</h3>
          <div class="status-indicator ${indexingStatus.isRunning ? 'running' : 'stopped'}">
            <span class="status-icon">${indexingStatus.isRunning ? '🔄' : '⏸️'}</span>
            <span class="status-text">${indexingStatus.isRunning ? '실행 중' : '중지됨'}</span>
          </div>
        </div>
        
        ${indexingStatus.isRunning ? this.renderIndexingProgress() : ''}
        
        <div class="indexing-actions">
          <button class="start-indexing" ${indexingStatus.isRunning ? 'disabled' : ''}>
            <span class="action-icon">▶️</span>
            <span class="action-label">인덱싱 시작</span>
          </button>
          <button class="stop-indexing" ${!indexingStatus.isRunning ? 'disabled' : ''}>
            <span class="action-icon">⏹️</span>
            <span class="action-label">인덱싱 중지</span>
          </button>
        </div>
        
        <div class="indexing-history">
          <h3>인덱싱 기록</h3>
          <div class="history-list">
            <div class="history-item">
              <span class="history-time">2024-01-15 14:30:00</span>
              <span class="history-status success">완료</span>
              <span class="history-details">문법 데이터 인덱싱</span>
            </div>
            <div class="history-item">
              <span class="history-time">2024-01-15 10:15:00</span>
              <span class="history-status success">완료</span>
              <span class="history-details">문장분석 데이터 인덱싱</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * 인덱싱 진행률 렌더링
   */
  renderIndexingProgress() {
    const { indexingStatus } = this.state;
    const progressPercent = Math.round((indexingStatus.completedTasks / indexingStatus.totalTasks) * 100);
    
    return `
      <div class="indexing-progress">
        <div class="progress-header">
          <span class="progress-label">진행률</span>
          <span class="progress-percent">${progressPercent}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="progress-details">
          <span class="current-task">${indexingStatus.currentTask || '대기 중...'}</span>
          <span class="task-count">${indexingStatus.completedTasks}/${indexingStatus.totalTasks}</span>
        </div>
      </div>
    `;
  }
  
  /**
   * 백업 탭 렌더링
   */
  renderBackupTab() {
    const { backupStatus } = this.state;
    
    return `
      <div class="admin-tab-content backup-tab">
        <div class="backup-status">
          <h3>백업 상태</h3>
          <div class="status-indicator ${backupStatus.isCreating ? 'creating' : 'idle'}">
            <span class="status-icon">${backupStatus.isCreating ? '🔄' : '💾'}</span>
            <span class="status-text">${backupStatus.isCreating ? '백업 생성 중' : '대기 중'}</span>
          </div>
        </div>
        
        <div class="backup-actions">
          <button class="create-backup" ${backupStatus.isCreating ? 'disabled' : ''}>
            <span class="action-icon">➕</span>
            <span class="action-label">새 백업 생성</span>
          </button>
        </div>
        
        <div class="backup-list">
          <h3>사용 가능한 백업</h3>
          <div class="backup-items">
            ${backupStatus.availableBackups.map(backup => `
              <div class="backup-item">
                <div class="backup-info">
                  <div class="backup-name">${backup.name}</div>
                  <div class="backup-date">${backup.date}</div>
                  <div class="backup-size">${backup.size}</div>
                </div>
                <div class="backup-actions">
                  <button class="restore-backup" data-backup="${backup.name}">
                    <span class="action-icon">🔄</span>
                    <span class="action-label">복원</span>
                  </button>
                  <button class="delete-backup" data-backup="${backup.name}">
                    <span class="action-icon">🗑️</span>
                    <span class="action-label">삭제</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * 백업 탭 렌더링
   */
  renderBackupTab() {
    return `
      <div class="admin-tab-content backup-tab">
        <div id="backupManagementContainer"></div>
      </div>
    `;
  }

  /**
   * 설정 탭 렌더링
   */
  renderSettingsTab() {
    const { settings } = this.state;
    
    return `
      <div class="admin-tab-content settings-tab">
        <div class="settings-section">
          <h3>인덱싱 설정</h3>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" class="setting-checkbox" ${settings.autoIndexing ? 'checked' : ''}>
              <span class="setting-text">자동 인덱싱</span>
            </label>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>백업 설정</h3>
          <div class="setting-item">
            <label class="setting-label">백업 빈도</label>
            <select class="setting-select">
              <option value="daily" ${settings.backupFrequency === 'daily' ? 'selected' : ''}>매일</option>
              <option value="weekly" ${settings.backupFrequency === 'weekly' ? 'selected' : ''}>매주</option>
              <option value="monthly" ${settings.backupFrequency === 'monthly' ? 'selected' : ''}>매월</option>
            </select>
          </div>
          <div class="setting-item">
            <label class="setting-label">최대 백업 수</label>
            <input type="number" class="setting-input" value="${settings.maxBackups}" min="1" max="50">
          </div>
        </div>
        
        <div class="settings-section">
          <h3>알림 설정</h3>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" class="setting-checkbox" ${settings.notifications ? 'checked' : ''}>
              <span class="setting-text">알림 활성화</span>
            </label>
          </div>
        </div>
        
        <div class="settings-actions">
          <button class="save-settings">
            <span class="action-icon">💾</span>
            <span class="action-label">설정 저장</span>
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * 탭 클릭 이벤트 처리
   */
  handleTabClick(event) {
    const tabId = event.target.closest('.tab-button').dataset.tab;
    this.setState({ activeTab: tabId });
    
    // 백업 탭이 활성화되면 백업 관리 컴포넌트 초기화
    if (tabId === 'backup' && !this.backupManagement) {
      this.initializeBackupManagement();
    }
  }
  
  /**
   * 백업 관리 컴포넌트 초기화
   */
  initializeBackupManagement() {
    try {
      const container = this.element.querySelector('#backupManagementContainer');
      if (container) {
        this.backupManagement = new BackupManagement({
          container: container
        });
        console.log('✅ 백업 관리 컴포넌트 초기화 완료');
      }
    } catch (error) {
      console.error('❌ 백업 관리 컴포넌트 초기화 실패:', error);
    }
  }
  
  /**
   * 인덱싱 시작 이벤트 처리
   */
  async handleStartIndexing(event) {
    event.preventDefault();
    
    try {
      this.setState({ isLoading: true });
      
      const result = await adminService.runIndexing();
      
      if (result.success) {
        this.setState({ 
          indexingStatus: { ...this.state.indexingStatus, isRunning: true }
        });
        
        eventBus.emit(AppEvents.INDEXING_STARTED, {
          timestamp: new Date()
        });
        
        console.log('✅ 인덱싱 시작 성공');
      } else {
        throw new Error(result.message || '인덱싱 시작에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('❌ 인덱싱 시작 실패:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ isLoading: false });
    }
  }
  
  /**
   * 인덱싱 중지 이벤트 처리
   */
  async handleStopIndexing(event) {
    event.preventDefault();
    
    try {
      this.setState({ isLoading: true });
      
      // 실제 구현에서는 인덱싱 중지 API 호출
      this.setState({ 
        indexingStatus: { ...this.state.indexingStatus, isRunning: false }
      });
      
      console.log('✅ 인덱싱 중지 성공');
      
    } catch (error) {
      console.error('❌ 인덱싱 중지 실패:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ isLoading: false });
    }
  }
  
  /**
   * 백업 생성 이벤트 처리
   */
  async handleCreateBackup(event) {
    event.preventDefault();
    
    try {
      this.setState({ isLoading: true });
      
      const result = await adminService.createBackup();
      
      if (result.success) {
        this.setState({ 
          backupStatus: { ...this.state.backupStatus, isCreating: true }
        });
        
        eventBus.emit(AppEvents.BACKUP_CREATED, {
          timestamp: new Date(),
          backupName: result.backupName
        });
        
        console.log('✅ 백업 생성 성공');
      } else {
        throw new Error(result.message || '백업 생성에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('❌ 백업 생성 실패:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ isLoading: false });
    }
  }
  
  /**
   * 백업 복원 이벤트 처리
   */
  async handleRestoreBackup(event) {
    event.preventDefault();
    
    const backupName = event.target.closest('.restore-backup').dataset.backup;
    
    if (!confirm(`정말로 "${backupName}" 백업을 복원하시겠습니까?`)) {
      return;
    }
    
    try {
      this.setState({ isLoading: true });
      
      const result = await adminService.restoreBackup(backupName);
      
      if (result.success) {
        eventBus.emit(AppEvents.BACKUP_RESTORED, {
          timestamp: new Date(),
          backupName
        });
        
        console.log('✅ 백업 복원 성공');
      } else {
        throw new Error(result.message || '백업 복원에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('❌ 백업 복원 실패:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ isLoading: false });
    }
  }
  
  /**
   * 백업 삭제 이벤트 처리
   */
  async handleDeleteBackup(event) {
    event.preventDefault();
    
    const backupName = event.target.closest('.delete-backup').dataset.backup;
    
    if (!confirm(`정말로 "${backupName}" 백업을 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      this.setState({ isLoading: true });
      
      // 실제 구현에서는 백업 삭제 API 호출
      console.log('✅ 백업 삭제 성공');
      
    } catch (error) {
      console.error('❌ 백업 삭제 실패:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ isLoading: false });
    }
  }
  
  /**
   * 설정 저장 이벤트 처리
   */
  async handleSaveSettings(event) {
    event.preventDefault();
    
    try {
      this.setState({ isLoading: true });
      
      // 실제 구현에서는 설정 저장 API 호출
      console.log('✅ 설정 저장 성공');
      
    } catch (error) {
      console.error('❌ 설정 저장 실패:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ isLoading: false });
    }
  }
  
  /**
   * 통계 새로고침 이벤트 처리
   */
  async handleRefreshStats(event) {
    event.preventDefault();
    
    try {
      this.setState({ isLoading: true });
      
      // 실제 구현에서는 통계 API 호출
      await this.loadSystemStats();
      
      console.log('✅ 통계 새로고침 성공');
      
    } catch (error) {
      console.error('❌ 통계 새로고침 실패:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ isLoading: false });
    }
  }
  
  /**
   * 로그아웃 이벤트 처리
   */
  async handleLogout(event) {
    event.preventDefault();
    
    try {
      await adminService.logout();
      
      this.setState({ isLoggedIn: false });
      
      eventBus.emit(AppEvents.ADMIN_LOGOUT, {
        timestamp: new Date()
      });
      
      console.log('✅ 관리자 로그아웃 성공');
      
    } catch (error) {
      console.error('❌ 관리자 로그아웃 실패:', error);
      this.setState({ error: error.message });
    }
  }
  
  /**
   * 시스템 통계 로드
   */
  async loadSystemStats() {
    try {
      // 실제 구현에서는 API 호출
      const stats = {
        totalUsers: 1250,
        totalConversations: 5670,
        totalMessages: 23450,
        systemUptime: Date.now() - (24 * 60 * 60 * 1000), // 24시간
        memoryUsage: 65,
        diskUsage: 42
      };
      
      this.setState({ systemStats: stats });
      
    } catch (error) {
      console.error('시스템 통계 로드 실패:', error);
    }
  }
  
  /**
   * 가동시간 포맷팅
   */
  formatUptime(uptime) {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else {
      return `${minutes}분`;
    }
  }
  
  /**
   * 컴포넌트 마운트 시 실행
   */
  async onMount() {
    // 로그인 상태 확인
    await this.checkLoginStatus();
    
    // 시스템 통계 로드
    await this.loadSystemStats();
    
    // 자동 새로고침 설정
    if (this.autoRefresh) {
      this.refreshTimer = setInterval(() => {
        this.loadSystemStats();
      }, this.refreshInterval);
    }
  }
  
  /**
   * 컴포넌트 언마운트 시 실행
   */
  onUnmount() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }
  
  /**
   * 로그인 상태 확인
   */
  async checkLoginStatus() {
    try {
      const isLoggedIn = await adminService.isLoggedIn();
      this.setState({ isLoggedIn });
    } catch (error) {
      console.error('로그인 상태 확인 실패:', error);
      this.setState({ isLoggedIn: false });
    }
  }
}

// 관리자 패널 팩토리
export class AdminPanelFactory {
  static create(options = {}) {
    return new AdminPanel(options);
  }
  
  static createFull(options = {}) {
    return new AdminPanel({
      showIndexing: true,
      showBackup: true,
      showSettings: true,
      showStats: true,
      autoRefresh: true,
      ...options
    });
  }
}

// 관리자 패널 매니저
export class AdminPanelManager {
  static instances = new Map();
  
  static register(id, panel) {
    this.instances.set(id, panel);
  }
  
  static get(id) {
    return this.instances.get(id);
  }
  
  static getAll() {
    return Array.from(this.instances.values());
  }
  
  static cleanup() {
    this.instances.clear();
  }
}

