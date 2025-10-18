/**
 * 사용자 관리 컴포넌트
 * 사용자 목록, 권한 관리, 활동 모니터링 기능
 */

import { BaseComponent } from '../base/BaseComponent.js';
import { eventBus, AppEvents } from '../../utils/events.js';

export class UserManagement extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.users = [];
    this.userStats = {};
    this.selectedUser = null;
    
    this.init();
  }

  init() {
    this.createHTML();
    this.bindEvents();
    this.loadUsers();
    this.loadUserStats();
  }

  createHTML() {
    this.element.innerHTML = `
      <div class="user-management">
        <div class="admin-header">
          <h2>👥 사용자 관리</h2>
          <div class="user-actions">
            <button class="action-btn primary" id="add-user">
              <span class="btn-icon">➕</span>
              사용자 추가
            </button>
            <button class="action-btn secondary" id="refresh-users">
              <span class="btn-icon">🔄</span>
              새로고침
            </button>
          </div>
        </div>

        <!-- 사용자 통계 -->
        <div class="user-stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👤</div>
            <div class="stat-content">
              <div class="stat-value" id="total-users">-</div>
              <div class="stat-label">총 사용자</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🟢</div>
            <div class="stat-content">
              <div class="stat-value" id="active-users">-</div>
              <div class="stat-label">활성 사용자</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔒</div>
            <div class="stat-content">
              <div class="stat-value" id="admin-users">-</div>
              <div class="stat-label">관리자</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value" id="today-logins">-</div>
              <div class="stat-label">오늘 로그인</div>
            </div>
          </div>
        </div>

        <!-- 사용자 목록 -->
        <div class="user-list-section">
          <div class="section-header">
            <h3>사용자 목록</h3>
            <div class="list-controls">
              <div class="search-box">
                <input type="text" id="user-search" placeholder="사용자 검색...">
                <span class="search-icon">🔍</span>
              </div>
              <div class="filter-controls">
                <select id="role-filter">
                  <option value="">모든 역할</option>
                  <option value="admin">관리자</option>
                  <option value="user">일반 사용자</option>
                  <option value="guest">게스트</option>
                </select>
                <select id="status-filter">
                  <option value="">모든 상태</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="banned">차단</option>
                </select>
              </div>
            </div>
          </div>

          <div class="user-table-container">
            <table class="user-table">
              <thead>
                <tr>
                  <th>사용자</th>
                  <th>역할</th>
                  <th>상태</th>
                  <th>마지막 로그인</th>
                  <th>활동</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody id="user-table-body">
                <tr>
                  <td colspan="6" class="loading-row">사용자 목록을 불러오는 중...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 사용자 상세 정보 -->
        <div class="user-detail-section" id="user-detail" style="display: none;">
          <div class="detail-header">
            <h3>사용자 상세 정보</h3>
            <button class="close-btn" id="close-detail">✕</button>
          </div>
          <div class="detail-content" id="user-detail-content">
            <!-- 동적으로 생성됨 -->
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 사용자 추가
    const addUserBtn = this.element.querySelector('#add-user');
    addUserBtn.addEventListener('click', () => {
      this.showAddUserModal();
    });

    // 새로고침
    const refreshBtn = this.element.querySelector('#refresh-users');
    refreshBtn.addEventListener('click', () => {
      this.loadUsers();
      this.loadUserStats();
    });

    // 검색
    const searchInput = this.element.querySelector('#user-search');
    searchInput.addEventListener('input', (e) => {
      this.filterUsers(e.target.value);
    });

    // 필터
    const roleFilter = this.element.querySelector('#role-filter');
    const statusFilter = this.element.querySelector('#status-filter');
    
    roleFilter.addEventListener('change', () => {
      this.applyFilters();
    });
    
    statusFilter.addEventListener('change', () => {
      this.applyFilters();
    });

    // 상세 정보 닫기
    const closeDetailBtn = this.element.querySelector('#close-detail');
    closeDetailBtn.addEventListener('click', () => {
      this.hideUserDetail();
    });
  }

  async loadUsers() {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        this.users = data.users || [];
        this.renderUserTable();
      }
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
      this.showError('사용자 목록을 불러올 수 없습니다.');
    }
  }

  async loadUserStats() {
    try {
      const response = await fetch('/api/admin/users/stats');
      const data = await response.json();
      
      if (data.success) {
        this.userStats = data.stats;
        this.updateUserStats();
      }
    } catch (error) {
      console.error('사용자 통계 로드 실패:', error);
    }
  }

  updateUserStats() {
    const stats = this.userStats;
    
    this.element.querySelector('#total-users').textContent = stats.total || 0;
    this.element.querySelector('#active-users').textContent = stats.active || 0;
    this.element.querySelector('#admin-users').textContent = stats.admins || 0;
    this.element.querySelector('#today-logins').textContent = stats.todayLogins || 0;
  }

  renderUserTable() {
    const tbody = this.element.querySelector('#user-table-body');
    
    if (this.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-row">사용자가 없습니다.</td></tr>';
      return;
    }

    let html = '';
    this.users.forEach(user => {
      const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never';
      const statusClass = this.getStatusClass(user.status);
      const roleClass = this.getRoleClass(user.role);
      
      html += `
        <tr class="user-row" data-user-id="${user.id}">
          <td class="user-info">
            <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
            <div class="user-details">
              <div class="user-name">${user.name}</div>
              <div class="user-email">${user.email}</div>
            </div>
          </td>
          <td>
            <span class="role-badge ${roleClass}">${this.getRoleText(user.role)}</span>
          </td>
          <td>
            <span class="status-badge ${statusClass}">${this.getStatusText(user.status)}</span>
          </td>
          <td class="last-login">${lastLogin}</td>
          <td class="activity">
            <div class="activity-bar">
              <div class="activity-fill" style="width: ${user.activityLevel || 0}%"></div>
            </div>
            <span class="activity-text">${user.activityLevel || 0}%</span>
          </td>
          <td class="actions">
            <button class="action-btn small" onclick="userManagement.viewUserDetail('${user.id}')">
              보기
            </button>
            <button class="action-btn small" onclick="userManagement.editUser('${user.id}')">
              편집
            </button>
            <button class="action-btn small danger" onclick="userManagement.deleteUser('${user.id}')">
              삭제
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  filterUsers(searchTerm) {
    const rows = this.element.querySelectorAll('.user-row');
    const term = searchTerm.toLowerCase();
    
    rows.forEach(row => {
      const name = row.querySelector('.user-name').textContent.toLowerCase();
      const email = row.querySelector('.user-email').textContent.toLowerCase();
      
      if (name.includes(term) || email.includes(term)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  applyFilters() {
    const roleFilter = this.element.querySelector('#role-filter').value;
    const statusFilter = this.element.querySelector('#status-filter').value;
    const rows = this.element.querySelectorAll('.user-row');
    
    rows.forEach(row => {
      const role = row.querySelector('.role-badge').textContent.toLowerCase();
      const status = row.querySelector('.status-badge').textContent.toLowerCase();
      
      const roleMatch = !roleFilter || role.includes(roleFilter);
      const statusMatch = !statusFilter || status.includes(statusFilter);
      
      if (roleMatch && statusMatch) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  async viewUserDetail(userId) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        this.selectedUser = data.user;
        this.showUserDetail();
      }
    } catch (error) {
      console.error('사용자 상세 정보 로드 실패:', error);
      this.showError('사용자 상세 정보를 불러올 수 없습니다.');
    }
  }

  showUserDetail() {
    const user = this.selectedUser;
    const detailSection = this.element.querySelector('#user-detail');
    const detailContent = this.element.querySelector('#user-detail-content');
    
    detailContent.innerHTML = `
      <div class="user-detail-grid">
        <div class="detail-section">
          <h4>기본 정보</h4>
          <div class="detail-item">
            <span class="detail-label">이름:</span>
            <span class="detail-value">${user.name}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">이메일:</span>
            <span class="detail-value">${user.email}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">역할:</span>
            <span class="detail-value">${this.getRoleText(user.role)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">상태:</span>
            <span class="detail-value">${this.getStatusText(user.status)}</span>
          </div>
        </div>
        
        <div class="detail-section">
          <h4>활동 정보</h4>
          <div class="detail-item">
            <span class="detail-label">가입일:</span>
            <span class="detail-value">${new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">마지막 로그인:</span>
            <span class="detail-value">${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">총 로그인:</span>
            <span class="detail-value">${user.loginCount || 0}회</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">활동 레벨:</span>
            <span class="detail-value">${user.activityLevel || 0}%</span>
          </div>
        </div>
        
        <div class="detail-section">
          <h4>권한 설정</h4>
          <div class="permission-list">
            ${this.renderPermissions(user.permissions || [])}
          </div>
        </div>
      </div>
      
      <div class="detail-actions">
        <button class="action-btn primary" onclick="userManagement.editUser('${user.id}')">
          편집
        </button>
        <button class="action-btn secondary" onclick="userManagement.resetPassword('${user.id}')">
          비밀번호 재설정
        </button>
        <button class="action-btn danger" onclick="userManagement.banUser('${user.id}')">
          ${user.status === 'banned' ? '차단 해제' : '차단'}
        </button>
      </div>
    `;
    
    detailSection.style.display = 'block';
  }

  hideUserDetail() {
    this.element.querySelector('#user-detail').style.display = 'none';
    this.selectedUser = null;
  }

  renderPermissions(permissions) {
    const permissionMap = {
      'read': '읽기',
      'write': '쓰기',
      'delete': '삭제',
      'admin': '관리자',
      'moderate': '중재'
    };
    
    return permissions.map(perm => `
      <div class="permission-item">
        <span class="permission-name">${permissionMap[perm] || perm}</span>
        <span class="permission-status">✓</span>
      </div>
    `).join('');
  }

  showAddUserModal() {
    eventBus.emit(AppEvents.SHOW_MODAL, {
      type: 'add-user',
      title: '사용자 추가',
      content: this.createAddUserForm()
    });
  }

  createAddUserForm() {
    return `
      <form class="add-user-form" id="add-user-form">
        <div class="form-group">
          <label for="user-name">이름:</label>
          <input type="text" id="user-name" required>
        </div>
        <div class="form-group">
          <label for="user-email">이메일:</label>
          <input type="email" id="user-email" required>
        </div>
        <div class="form-group">
          <label for="user-password">비밀번호:</label>
          <input type="password" id="user-password" required>
        </div>
        <div class="form-group">
          <label for="user-role">역할:</label>
          <select id="user-role">
            <option value="user">일반 사용자</option>
            <option value="admin">관리자</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="submit" class="action-btn primary">추가</button>
          <button type="button" class="action-btn secondary" onclick="closeModal()">취소</button>
        </div>
      </form>
    `;
  }

  async editUser(userId) {
    // 사용자 편집 모달 표시
    eventBus.emit(AppEvents.SHOW_MODAL, {
      type: 'edit-user',
      title: '사용자 편집',
      content: this.createEditUserForm(userId)
    });
  }

  createEditUserForm(userId) {
    const user = this.users.find(u => u.id === userId);
    return `
      <form class="edit-user-form" id="edit-user-form">
        <input type="hidden" id="user-id" value="${userId}">
        <div class="form-group">
          <label for="edit-user-name">이름:</label>
          <input type="text" id="edit-user-name" value="${user?.name || ''}" required>
        </div>
        <div class="form-group">
          <label for="edit-user-email">이메일:</label>
          <input type="email" id="edit-user-email" value="${user?.email || ''}" required>
        </div>
        <div class="form-group">
          <label for="edit-user-role">역할:</label>
          <select id="edit-user-role">
            <option value="user" ${user?.role === 'user' ? 'selected' : ''}>일반 사용자</option>
            <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>관리자</option>
          </select>
        </div>
        <div class="form-group">
          <label for="edit-user-status">상태:</label>
          <select id="edit-user-status">
            <option value="active" ${user?.status === 'active' ? 'selected' : ''}>활성</option>
            <option value="inactive" ${user?.status === 'inactive' ? 'selected' : ''}>비활성</option>
            <option value="banned" ${user?.status === 'banned' ? 'selected' : ''}>차단</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="submit" class="action-btn primary">저장</button>
          <button type="button" class="action-btn secondary" onclick="closeModal()">취소</button>
        </div>
      </form>
    `;
  }

  async deleteUser(userId) {
    if (confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          this.showSuccess('사용자가 삭제되었습니다.');
          this.loadUsers();
        }
      } catch (error) {
        console.error('사용자 삭제 실패:', error);
        this.showError('사용자 삭제에 실패했습니다.');
      }
    }
  }

  getStatusClass(status) {
    const statusMap = {
      'active': 'active',
      'inactive': 'inactive',
      'banned': 'banned'
    };
    return statusMap[status] || 'unknown';
  }

  getRoleClass(role) {
    const roleMap = {
      'admin': 'admin',
      'user': 'user',
      'guest': 'guest'
    };
    return roleMap[role] || 'unknown';
  }

  getStatusText(status) {
    const statusMap = {
      'active': '활성',
      'inactive': '비활성',
      'banned': '차단'
    };
    return statusMap[status] || 'Unknown';
  }

  getRoleText(role) {
    const roleMap = {
      'admin': '관리자',
      'user': '사용자',
      'guest': '게스트'
    };
    return roleMap[role] || 'Unknown';
  }

  showSuccess(message) {
    console.log('Success:', message);
    // TODO: 토스트 알림 구현
  }

  showError(message) {
    console.error('Error:', message);
    // TODO: 토스트 알림 구현
  }

  destroy() {
    super.destroy();
  }
}
