/**
 * 백업 관리 컴포넌트
 * 백업 생성, 복원, 관리, GitHub Release 백업
 */

import { BaseComponent } from '../base/BaseComponent.js';
import { eventBus, AppEvents } from '../../utils/events.js';
import { stateManager } from '../../store/state.js';

export class BackupManagement extends BaseComponent {
  constructor(options = {}) {
    super('BackupManagement', { ...options, shadowDom: true });
    this.state = {
      backups: [],
      stats: {},
      loading: false,
      error: null,
      selectedBackup: null,
      githubReleases: [],
      githubLoading: false,
    };
  }

  async connectedCallback() {
    await super.connectedCallback();
    this.render();
    this.attachEventListeners();
    await this.loadBackups();
    await this.loadBackupStats();
    this.subscribeToStateChanges();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('./src/styles/components/admin.css');
      </style>
      <div class="admin-card backup-management-container">
        <h2 class="admin-title">💾 백업 관리</h2>

        ${this.state.loading ? '<div class="loading-spinner"></div>' : ''}
        ${this.state.error ? `<p class="error-message">${this.state.error}</p>` : ''}

        <!-- 백업 통계 -->
        <div class="backup-stats neumorphism-card-flat">
          <h3>📊 백업 통계</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">총 백업</span>
              <span class="stat-value">${this.state.stats.total_backups || 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">전체 백업</span>
              <span class="stat-value">${this.state.stats.full_backups || 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">증분 백업</span>
              <span class="stat-value">${this.state.stats.incremental_backups || 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">총 크기</span>
              <span class="stat-value">${this.formatBytes(this.state.stats.total_size || 0)}</span>
            </div>
          </div>
        </div>

        <!-- 백업 생성 -->
        <div class="backup-create neumorphism-card-flat">
          <h3>🆕 백업 생성</h3>
          <div class="create-form">
            <div class="form-group">
              <label for="backupType">백업 타입:</label>
              <select id="backupType" class="neumorphism-select">
                <option value="full">전체 백업</option>
                <option value="incremental">증분 백업</option>
              </select>
            </div>
            <div class="form-group">
              <label for="backupName">백업 이름 (선택):</label>
              <input type="text" id="backupName" class="neumorphism-input" placeholder="백업 이름을 입력하세요">
            </div>
            <div class="form-group">
              <label for="githubUpload">
                <input type="checkbox" id="githubUpload" class="neumorphism-checkbox">
                GitHub에 업로드
              </label>
            </div>
            <button id="createBackupButton" class="neumorphism-btn primary" ${this.state.loading ? 'disabled' : ''}>
              ${this.state.loading ? '<span class="spinner"></span> 생성 중...' : '백업 생성'}
            </button>
          </div>
        </div>

        <!-- 백업 목록 -->
        <div class="backup-list neumorphism-card-flat">
          <div class="list-header">
            <h3>📋 백업 목록</h3>
            <div class="list-actions">
              <button id="refreshBackupsButton" class="neumorphism-btn secondary-sm">새로고침</button>
              <button id="cleanupBackupsButton" class="neumorphism-btn secondary-sm">정리</button>
            </div>
          </div>
          <div class="backup-items">
            ${this.state.backups.length > 0 ? this.state.backups.map(backup => `
              <div class="backup-item neumorphism-card-flat ${backup.id === this.state.selectedBackup ? 'selected' : ''}" data-backup-id="${backup.id}">
                <div class="backup-header">
                  <div class="backup-info">
                    <h4>${backup.name}</h4>
                    <div class="backup-meta">
                      <span class="backup-type ${backup.type}">${backup.type === 'full' ? '전체' : '증분'}</span>
                      <span class="backup-size">${this.formatBytes(backup.size)}</span>
                      <span class="backup-date">${new Date(backup.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div class="backup-status">
                    <span class="status-badge ${backup.status}">${backup.status}</span>
                    ${backup.github_url ? '<span class="github-badge">GitHub</span>' : ''}
                  </div>
                </div>
                <div class="backup-actions">
                  <button class="action-btn primary-sm" data-action="restore" data-backup-id="${backup.id}">복원</button>
                  <button class="action-btn secondary-sm" data-action="download" data-backup-id="${backup.id}">다운로드</button>
                  ${!backup.github_url ? `<button class="action-btn secondary-sm" data-action="upload-github" data-backup-id="${backup.id}">GitHub 업로드</button>` : ''}
                  <button class="action-btn danger-sm" data-action="delete" data-backup-id="${backup.id}">삭제</button>
                </div>
              </div>
            `).join('') : '<p class="no-backups">백업이 없습니다.</p>'}
          </div>
        </div>

        <!-- GitHub Release -->
        <div class="github-releases neumorphism-card-flat">
          <div class="releases-header">
            <h3>🐙 GitHub Release</h3>
            <button id="refreshReleasesButton" class="neumorphism-btn secondary-sm" ${this.state.githubLoading ? 'disabled' : ''}>
              ${this.state.githubLoading ? '<span class="spinner"></span> 로딩...' : '새로고침'}
            </button>
          </div>
          <div class="releases-list">
            ${this.state.githubReleases.length > 0 ? this.state.githubReleases.map(release => `
              <div class="release-item neumorphism-card-flat">
                <div class="release-header">
                  <h4>${release.name || release.tag_name}</h4>
                  <span class="release-tag">${release.tag_name}</span>
                </div>
                <div class="release-info">
                  <p>${release.body || '설명 없음'}</p>
                  <div class="release-meta">
                    <span>생성: ${new Date(release.created_at).toLocaleString()}</span>
                    <span>에셋: ${release.assets?.length || 0}개</span>
                  </div>
                </div>
                ${release.assets && release.assets.length > 0 ? `
                  <div class="release-assets">
                    ${release.assets.map(asset => `
                      <div class="asset-item">
                        <span class="asset-name">${asset.name}</span>
                        <span class="asset-size">${this.formatBytes(asset.size)}</span>
                        <button class="action-btn secondary-sm" data-action="restore-github" data-tag="${release.tag_name}" data-asset="${asset.name}">복원</button>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('') : '<p class="no-releases">GitHub Release가 없습니다.</p>'}
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // 백업 생성
    this.shadowRoot.getElementById('createBackupButton').addEventListener('click', () => this.createBackup());
    
    // 백업 목록 새로고침
    this.shadowRoot.getElementById('refreshBackupsButton').addEventListener('click', () => this.loadBackups());
    
    // 백업 정리
    this.shadowRoot.getElementById('cleanupBackupsButton').addEventListener('click', () => this.cleanupBackups());
    
    // GitHub Release 새로고침
    this.shadowRoot.getElementById('refreshReleasesButton').addEventListener('click', () => this.loadGitHubReleases());
    
    // 백업 액션
    this.shadowRoot.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const backupId = e.target.dataset.backupId;
      const tag = e.target.dataset.tag;
      const asset = e.target.dataset.asset;
      
      if (action === 'restore') {
        this.restoreBackup(backupId);
      } else if (action === 'download') {
        this.downloadBackup(backupId);
      } else if (action === 'upload-github') {
        this.uploadToGitHub(backupId);
      } else if (action === 'delete') {
        this.deleteBackup(backupId);
      } else if (action === 'restore-github') {
        this.restoreFromGitHub(tag, asset);
      }
    });
    
    // 백업 선택
    this.shadowRoot.addEventListener('click', (e) => {
      if (e.target.closest('.backup-item')) {
        const backupId = e.target.closest('.backup-item').dataset.backupId;
        this.setState({ selectedBackup: backupId });
      }
    });
  }

  subscribeToStateChanges() {
    stateManager.subscribe('admin.backups', (backups) => this.setState({ backups }));
    stateManager.subscribe('admin.backupStats', (stats) => this.setState({ stats }));
  }

  async loadBackups() {
    this.setState({ loading: true, error: null });
    try {
      const response = await fetch('/api/v1/backups');
      const data = await response.json();
      
      if (data.success) {
        this.setState({ backups: data.backups });
        stateManager.setState('admin.backups', data.backups);
      } else {
        this.setState({ error: data.error || '백업 목록을 불러올 수 없습니다.' });
      }
    } catch (error) {
      this.setState({ error: error.message || '백업 목록을 불러오는데 실패했습니다.' });
    } finally {
      this.setState({ loading: false });
    }
  }

  async loadBackupStats() {
    try {
      const response = await fetch('/api/v1/backups/stats');
      const data = await response.json();
      
      if (data.success) {
        this.setState({ stats: data.stats });
        stateManager.setState('admin.backupStats', data.stats);
      }
    } catch (error) {
      console.error('백업 통계 로드 실패:', error);
    }
  }

  async loadGitHubReleases() {
    this.setState({ githubLoading: true });
    try {
      const response = await fetch('/api/v1/backups/github/releases');
      const data = await response.json();
      
      if (data.success) {
        this.setState({ githubReleases: data.releases });
      } else {
        console.error('GitHub Release 로드 실패:', data.error);
      }
    } catch (error) {
      console.error('GitHub Release 로드 실패:', error);
    } finally {
      this.setState({ githubLoading: false });
    }
  }

  async createBackup() {
    const backupType = this.shadowRoot.getElementById('backupType').value;
    const backupName = this.shadowRoot.getElementById('backupName').value;
    const githubUpload = this.shadowRoot.getElementById('githubUpload').checked;
    
    this.setState({ loading: true, error: null });
    try {
      const response = await fetch('/api/v1/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: backupType,
          name: backupName || undefined,
          github_upload: githubUpload
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
          message: data.message,
          type: 'success'
        });
        await this.loadBackups();
        await this.loadBackupStats();
      } else {
        this.setState({ error: data.error || '백업 생성에 실패했습니다.' });
      }
    } catch (error) {
      this.setState({ error: error.message || '백업 생성에 실패했습니다.' });
    } finally {
      this.setState({ loading: false });
    }
  }

  async restoreBackup(backupId) {
    if (!confirm('백업을 복원하시겠습니까? 현재 데이터가 덮어씌워질 수 있습니다.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/backups/${backupId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
          message: data.message,
          type: 'success'
        });
      } else {
        eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
          message: data.error || '백업 복원에 실패했습니다.',
          type: 'error'
        });
      }
    } catch (error) {
      eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
        message: error.message || '백업 복원에 실패했습니다.',
        type: 'error'
      });
    }
  }

  async downloadBackup(backupId) {
    const backup = this.state.backups.find(b => b.id === backupId);
    if (!backup || !backup.file_path) {
      eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
        message: '백업 파일을 찾을 수 없습니다.',
        type: 'error'
      });
      return;
    }
    
    // 파일 다운로드 (실제 구현 필요)
    eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
      message: '백업 다운로드 기능은 개발 중입니다.',
      type: 'info'
    });
  }

  async uploadToGitHub(backupId) {
    try {
      const response = await fetch(`/api/v1/backups/${backupId}/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
          message: data.message,
          type: 'success'
        });
        await this.loadBackups();
      } else {
        eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
          message: data.error || 'GitHub 업로드에 실패했습니다.',
          type: 'error'
        });
      }
    } catch (error) {
      eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
        message: error.message || 'GitHub 업로드에 실패했습니다.',
        type: 'error'
      });
    }
  }

  async deleteBackup(backupId) {
    if (!confirm('백업을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/backups/${backupId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
          message: data.message,
          type: 'success'
        });
        await this.loadBackups();
        await this.loadBackupStats();
      } else {
        eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
          message: data.error || '백업 삭제에 실패했습니다.',
          type: 'error'
        });
      }
    } catch (error) {
      eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
        message: error.message || '백업 삭제에 실패했습니다.',
        type: 'error'
      });
    }
  }

  async cleanupBackups() {
    try {
      const response = await fetch('/api/v1/backups/cleanup', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
          message: data.message,
          type: 'success'
        });
        await this.loadBackups();
        await this.loadBackupStats();
      } else {
        eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
          message: data.error || '백업 정리에 실패했습니다.',
          type: 'error'
        });
      }
    } catch (error) {
      eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
        message: error.message || '백업 정리에 실패했습니다.',
        type: 'error'
      });
    }
  }

  async restoreFromGitHub(tag, asset) {
    if (!confirm(`GitHub Release '${tag}'의 '${asset}'을 복원하시겠습니까?`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/v1/backups/github/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: tag,
          asset_name: asset
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
          message: data.message,
          type: 'success'
        });
      } else {
        eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
          message: data.error || 'GitHub 복원에 실패했습니다.',
          type: 'error'
        });
      }
    } catch (error) {
      eventBus.emit(AppEvents.SHOW_NOTIFICATION, {
        message: error.message || 'GitHub 복원에 실패했습니다.',
        type: 'error'
      });
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  destroy() {
    super.destroy();
  }
}
