/**
 * 알림 시스템 컴포넌트
 * 실시간 푸시 알림, 토스트 메시지, 시스템 알림
 */

import { BaseComponent } from '../base/BaseComponent.js';
import { eventBus, AppEvents } from '../../utils/events.js';
import { websocketService } from '../../services/websocketService.js';

export class NotificationSystem extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.notifications = [];
    this.maxNotifications = 10;
    this.autoHideDelay = 5000; // 5초
    this.soundEnabled = true;
    this.permissionGranted = false;
    
    this.init();
  }

  init() {
    this.createHTML();
    this.bindEvents();
    this.setupWebSocketListeners();
    this.requestNotificationPermission();
  }

  createHTML() {
    this.element.innerHTML = `
      <div class="notification-system">
        <!-- 알림 컨테이너 -->
        <div class="notification-container" id="notification-container">
          <!-- 알림들이 여기에 동적으로 추가됩니다 -->
        </div>

        <!-- 알림 설정 패널 -->
        <div class="notification-settings" id="notification-settings" style="display: none;">
          <div class="settings-header">
            <h3>🔔 알림 설정</h3>
            <button class="close-settings" id="close-settings">✕</button>
          </div>
          <div class="settings-content">
            <div class="setting-item">
              <label for="sound-enabled">소리 알림</label>
              <input type="checkbox" id="sound-enabled" ${this.soundEnabled ? 'checked' : ''}>
            </div>
            <div class="setting-item">
              <label for="auto-hide">자동 숨김</label>
              <input type="checkbox" id="auto-hide" checked>
            </div>
            <div class="setting-item">
              <label for="hide-delay">숨김 지연 (초)</label>
              <input type="number" id="hide-delay" value="5" min="1" max="30">
            </div>
          </div>
          <div class="settings-actions">
            <button class="action-btn primary" id="save-settings">저장</button>
            <button class="action-btn secondary" id="test-notification">테스트</button>
          </div>
        </div>

        <!-- 알림 통계 -->
        <div class="notification-stats" id="notification-stats" style="display: none;">
          <div class="stats-header">
            <h3>📊 알림 통계</h3>
            <button class="close-stats" id="close-stats">✕</button>
          </div>
          <div class="stats-content">
            <div class="stat-item">
              <span class="stat-label">총 알림</span>
              <span class="stat-value" id="total-notifications">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">읽지 않음</span>
              <span class="stat-value" id="unread-notifications">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">오늘</span>
              <span class="stat-value" id="today-notifications">0</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 설정 패널 토글
    const settingsButton = this.element.querySelector('#notification-settings');
    const closeSettings = this.element.querySelector('#close-settings');
    
    if (closeSettings) {
      closeSettings.addEventListener('click', () => {
        this.hideSettings();
      });
    }

    // 설정 저장
    const saveSettings = this.element.querySelector('#save-settings');
    if (saveSettings) {
      saveSettings.addEventListener('click', () => {
        this.saveSettings();
      });
    }

    // 테스트 알림
    const testNotification = this.element.querySelector('#test-notification');
    if (testNotification) {
      testNotification.addEventListener('click', () => {
        this.showTestNotification();
      });
    }

    // 통계 패널 토글
    const statsButton = this.element.querySelector('#notification-stats');
    const closeStats = this.element.querySelector('#close-stats');
    
    if (closeStats) {
      closeStats.addEventListener('click', () => {
        this.hideStats();
      });
    }
  }

  setupWebSocketListeners() {
    // WebSocket 알림 수신
    eventBus.on(AppEvents.WEBSOCKET_CONNECTED, () => {
      this.showNotification({
        type: 'success',
        title: '연결됨',
        message: '실시간 서비스에 연결되었습니다.',
        duration: 3000
      });
    });

    eventBus.on(AppEvents.WEBSOCKET_DISCONNECTED, () => {
      this.showNotification({
        type: 'warning',
        title: '연결 해제',
        message: '실시간 서비스 연결이 해제되었습니다.',
        duration: 5000
      });
    });

    eventBus.on(AppEvents.WEBSOCKET_ERROR, (data) => {
      this.showNotification({
        type: 'error',
        title: '연결 오류',
        message: data.message || 'WebSocket 연결 오류가 발생했습니다.',
        duration: 0 // 수동으로 닫기
      });
    });

    // 에이전트 변경 알림
    eventBus.on(AppEvents.AGENT_CHANGED, (data) => {
      this.showNotification({
        type: 'info',
        title: '에이전트 변경',
        message: `에이전트가 ${data.agent_name || data.agent_id}로 변경되었습니다.`,
        duration: 4000
      });
    });

    // 관리자 브로드캐스트
    eventBus.on(AppEvents.ADMIN_BROADCAST, (data) => {
      this.showNotification({
        type: 'info',
        title: '관리자 알림',
        message: data.message,
        duration: 0 // 수동으로 닫기
      });
    });

    // 도움말 요청
    eventBus.on(AppEvents.HELP_REQUESTED, (data) => {
      this.showNotification({
        type: 'info',
        title: '도움말 요청',
        message: `${data.username}님이 도움을 요청했습니다.`,
        duration: 0 // 수동으로 닫기
      });
    });

    // 사용자 연결/해제
    eventBus.on(AppEvents.USER_CONNECTED, (data) => {
      this.showNotification({
        type: 'info',
        title: '사용자 연결',
        message: `${data.username || '사용자'}가 연결되었습니다.`,
        duration: 3000
      });
    });

    eventBus.on(AppEvents.USER_DISCONNECTED, (data) => {
      this.showNotification({
        type: 'info',
        title: '사용자 연결 해제',
        message: `${data.username || '사용자'}가 연결을 해제했습니다.`,
        duration: 3000
      });
    });
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        this.permissionGranted = permission === 'granted';
        
        if (this.permissionGranted) {
          console.log('알림 권한이 허용되었습니다.');
        } else {
          console.log('알림 권한이 거부되었습니다.');
        }
      } catch (error) {
        console.error('알림 권한 요청 실패:', error);
      }
    }
  }

  showNotification(notification) {
    const notificationData = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type || 'info',
      title: notification.title || '알림',
      message: notification.message || '',
      duration: notification.duration || this.autoHideDelay,
      timestamp: new Date().toISOString(),
      read: false,
      data: notification.data || {}
    };

    // 알림 목록에 추가
    this.notifications.unshift(notificationData);
    if (this.notifications.length > this.maxNotifications) {
      this.notifications.pop();
    }

    // UI에 알림 표시
    this.createNotificationElement(notificationData);

    // 브라우저 알림 표시
    if (this.permissionGranted) {
      this.showBrowserNotification(notificationData);
    }

    // 소리 재생
    if (this.soundEnabled) {
      this.playNotificationSound(notificationData.type);
    }

    // 자동 숨김
    if (notificationData.duration > 0) {
      setTimeout(() => {
        this.hideNotification(notificationData.id);
      }, notificationData.duration);
    }

    // 통계 업데이트
    this.updateStats();
  }

  createNotificationElement(notification) {
    const container = this.element.querySelector('#notification-container');
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification ${notification.type}`;
    notificationElement.id = notification.id;
    
    notificationElement.innerHTML = `
      <div class="notification-content">
        <div class="notification-header">
          <span class="notification-title">${notification.title}</span>
          <button class="close-notification" data-id="${notification.id}">✕</button>
        </div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${new Date(notification.timestamp).toLocaleTimeString()}</div>
      </div>
      <div class="notification-progress" style="animation-duration: ${notification.duration}ms;"></div>
    `;

    // 닫기 버튼 이벤트
    const closeButton = notificationElement.querySelector('.close-notification');
    closeButton.addEventListener('click', () => {
      this.hideNotification(notification.id);
    });

    // 클릭 이벤트
    notificationElement.addEventListener('click', () => {
      this.markAsRead(notification.id);
    });

    container.appendChild(notificationElement);

    // 애니메이션
    setTimeout(() => {
      notificationElement.classList.add('show');
    }, 10);
  }

  hideNotification(notificationId) {
    const notificationElement = this.element.querySelector(`#${notificationId}`);
    if (notificationElement) {
      notificationElement.classList.add('hide');
      setTimeout(() => {
        notificationElement.remove();
      }, 300);
    }

    // 알림 목록에서 제거
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.updateStats();
  }

  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.updateStats();
    }
  }

  showBrowserNotification(notification) {
    if (this.permissionGranted) {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };

      // 5초 후 자동 닫기
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  playNotificationSound(type) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 타입별 다른 소리
    const frequencies = {
      'success': [800, 1000, 1200],
      'error': [400, 300, 200],
      'warning': [600, 500, 400],
      'info': [700, 800]
    };

    const freq = frequencies[type] || frequencies.info;
    let currentFreq = 0;

    const playTone = () => {
      if (currentFreq < freq.length) {
        oscillator.frequency.setValueAtTime(freq[currentFreq], audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        currentFreq++;
        setTimeout(playTone, 200);
      }
    };

    oscillator.start();
    playTone();
    oscillator.stop(audioContext.currentTime + freq.length * 0.2);
  }

  showSettings() {
    const settings = this.element.querySelector('#notification-settings');
    settings.style.display = 'block';
  }

  hideSettings() {
    const settings = this.element.querySelector('#notification-settings');
    settings.style.display = 'none';
  }

  showStats() {
    const stats = this.element.querySelector('#notification-stats');
    stats.style.display = 'block';
    this.updateStats();
  }

  hideStats() {
    const stats = this.element.querySelector('#notification-stats');
    stats.style.display = 'none';
  }

  saveSettings() {
    const soundEnabled = this.element.querySelector('#sound-enabled').checked;
    const autoHide = this.element.querySelector('#auto-hide').checked;
    const hideDelay = parseInt(this.element.querySelector('#hide-delay').value);

    this.soundEnabled = soundEnabled;
    this.autoHideDelay = hideDelay * 1000;

    // 로컬 스토리지에 저장
    localStorage.setItem('notificationSettings', JSON.stringify({
      soundEnabled,
      autoHide,
      hideDelay
    }));

    this.hideSettings();
  }

  showTestNotification() {
    this.showNotification({
      type: 'info',
      title: '테스트 알림',
      message: '알림 시스템이 정상적으로 작동합니다!',
      duration: 3000
    });
  }

  updateStats() {
    const total = this.notifications.length;
    const unread = this.notifications.filter(n => !n.read).length;
    const today = this.notifications.filter(n => {
      const today = new Date().toDateString();
      return new Date(n.timestamp).toDateString() === today;
    }).length;

    const totalElement = this.element.querySelector('#total-notifications');
    const unreadElement = this.element.querySelector('#unread-notifications');
    const todayElement = this.element.querySelector('#today-notifications');

    if (totalElement) totalElement.textContent = total;
    if (unreadElement) unreadElement.textContent = unread;
    if (todayElement) todayElement.textContent = today;
  }

  clearAllNotifications() {
    this.notifications = [];
    const container = this.element.querySelector('#notification-container');
    container.innerHTML = '';
    this.updateStats();
  }

  getNotifications() {
    return this.notifications;
  }

  destroy() {
    this.clearAllNotifications();
    super.destroy();
  }
}
