/**
 * WebSocket 서비스
 * 실시간 양방향 통신, 푸시 알림, 상태 동기화
 */

import { eventBus, AppEvents } from '../utils/events.js';

export class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000; // 5초
    this.heartbeatInterval = 30000; // 30초
    this.heartbeatTimer = null;
    this.messageQueue = [];
    this.eventListeners = new Map();
    
    this.init();
  }

  init() {
    this.connect();
    this.setupEventListeners();
  }

  connect() {
    try {
      // Socket.IO 클라이언트 연결
      this.socket = io({
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      this.handleConnectionError();
    }
  }

  setupSocketListeners() {
    if (!this.socket) return;

    // 연결 성공
    this.socket.on('connect', () => {
      console.log('WebSocket 연결됨');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // 연결 상태 이벤트 발생
      eventBus.emit(AppEvents.WEBSOCKET_CONNECTED, {
        timestamp: new Date().toISOString()
      });
      
      // 대기 중인 메시지 전송
      this.flushMessageQueue();
      
      // 하트비트 시작
      this.startHeartbeat();
    });

    // 연결 해제
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket 연결 해제:', reason);
      this.isConnected = false;
      
      // 연결 해제 이벤트 발생
      eventBus.emit(AppEvents.WEBSOCKET_DISCONNECTED, {
        reason: reason,
        timestamp: new Date().toISOString()
      });
      
      // 하트비트 중지
      this.stopHeartbeat();
      
      // 자동 재연결 시도
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });

    // 연결 오류
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket 연결 오류:', error);
      this.handleConnectionError();
    });

    // 연결 상태 확인
    this.socket.on('connection_status', (data) => {
      console.log('연결 상태:', data);
      this.isConnected = data.status === 'connected';
    });

    // 메시지 수신
    this.socket.on('message_received', (data) => {
      console.log('메시지 수신:', data);
      eventBus.emit(AppEvents.MESSAGE_RECEIVED, data);
    });

    // 알림 수신
    this.socket.on('notification', (data) => {
      console.log('알림 수신:', data);
      this.handleNotification(data);
    });

    // 에이전트 변경 확인
    this.socket.on('agent_change_confirmed', (data) => {
      console.log('에이전트 변경 확인:', data);
      eventBus.emit(AppEvents.AGENT_CHANGED, data);
    });

    // 타이핑 상태
    this.socket.on('user_typing', (data) => {
      eventBus.emit(AppEvents.USER_TYPING, data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      eventBus.emit(AppEvents.USER_STOPPED_TYPING, data);
    });

    // 관리자 전용 이벤트
    this.socket.on('user_connected', (data) => {
      eventBus.emit(AppEvents.USER_CONNECTED, data);
    });

    this.socket.on('user_disconnected', (data) => {
      eventBus.emit(AppEvents.USER_DISCONNECTED, data);
    });

    this.socket.on('user_message', (data) => {
      eventBus.emit(AppEvents.USER_MESSAGE, data);
    });

    this.socket.on('user_agent_changed', (data) => {
      eventBus.emit(AppEvents.USER_AGENT_CHANGED, data);
    });

    this.socket.on('help_requested', (data) => {
      eventBus.emit(AppEvents.HELP_REQUESTED, data);
    });

    this.socket.on('admin_broadcast', (data) => {
      eventBus.emit(AppEvents.ADMIN_BROADCAST, data);
    });

    this.socket.on('online_users', (data) => {
      eventBus.emit(AppEvents.ONLINE_USERS, data);
    });

    // 룸 관련 이벤트
    this.socket.on('room_joined', (data) => {
      console.log('룸 참가:', data);
    });

    this.socket.on('room_left', (data) => {
      console.log('룸 떠남:', data);
    });

    // 에러 처리
    this.socket.on('error', (data) => {
      console.error('WebSocket 오류:', data);
      eventBus.emit(AppEvents.WEBSOCKET_ERROR, data);
    });
  }

  setupEventListeners() {
    // 에이전트 변경 이벤트 리스너
    eventBus.on(AppEvents.AGENT_CHANGED, (data) => {
      this.sendAgentChange(data);
    });

    // 타이핑 이벤트 리스너
    eventBus.on(AppEvents.TYPING_START, (data) => {
      this.sendTypingStart(data);
    });

    eventBus.on(AppEvents.TYPING_STOP, (data) => {
      this.sendTypingStop(data);
    });
  }

  handleNotification(notification) {
    // 알림 타입별 처리
    switch (notification.type) {
      case 'system_alert':
        this.showSystemAlert(notification);
        break;
      case 'performance_alert':
        this.showPerformanceAlert(notification);
        break;
      case 'agent_change':
        this.showAgentChangeNotification(notification);
        break;
      default:
        this.showGenericNotification(notification);
    }
  }

  showSystemAlert(notification) {
    // 시스템 알림 표시
    console.log('시스템 알림:', notification);
    // TODO: 토스트 알림 구현
  }

  showPerformanceAlert(notification) {
    // 성능 알림 표시
    console.log('성능 알림:', notification);
    // TODO: 토스트 알림 구현
  }

  showAgentChangeNotification(notification) {
    // 에이전트 변경 알림 표시
    console.log('에이전트 변경 알림:', notification);
    // TODO: 토스트 알림 구현
  }

  showGenericNotification(notification) {
    // 일반 알림 표시
    console.log('알림:', notification);
    // TODO: 토스트 알림 구현
  }

  // 메시지 전송
  sendMessage(message, room = 'users', messageType = 'chat') {
    if (!this.isConnected) {
      this.queueMessage('send_message', { message, room, type: messageType });
      return;
    }

    this.socket.emit('send_message', {
      message: message,
      room: room,
      type: messageType
    });
  }

  // 타이핑 시작
  sendTypingStart(room = 'users') {
    if (!this.isConnected) return;

    this.socket.emit('typing_start', { room });
  }

  // 타이핑 중지
  sendTypingStop(room = 'users') {
    if (!this.isConnected) return;

    this.socket.emit('typing_stop', { room });
  }

  // 에이전트 변경
  sendAgentChange(data) {
    if (!this.isConnected) {
      this.queueMessage('agent_changed', data);
      return;
    }

    this.socket.emit('agent_changed', data);
  }

  // 룸 참가
  joinRoom(room) {
    if (!this.isConnected) {
      this.queueMessage('join_room', { room });
      return;
    }

    this.socket.emit('join_room', { room });
  }

  // 룸 떠나기
  leaveRoom(room) {
    if (!this.isConnected) return;

    this.socket.emit('leave_room', { room });
  }

  // 도움말 요청
  requestHelp(helpType = 'general', message = '') {
    if (!this.isConnected) {
      this.queueMessage('request_help', { type: helpType, message });
      return;
    }

    this.socket.emit('request_help', {
      type: helpType,
      message: message
    });
  }

  // 관리자 브로드캐스트
  adminBroadcast(message, room = 'users', messageType = 'announcement') {
    if (!this.isConnected) {
      this.queueMessage('admin_broadcast', { message, room, type: messageType });
      return;
    }

    this.socket.emit('admin_broadcast', {
      message: message,
      room: room,
      type: messageType
    });
  }

  // 온라인 사용자 조회
  getOnlineUsers() {
    if (!this.isConnected) return;

    this.socket.emit('get_online_users');
  }

  // 메시지 큐에 추가
  queueMessage(event, data) {
    this.messageQueue.push({ event, data });
    console.log('메시지 큐에 추가:', event, data);
  }

  // 대기 중인 메시지 전송
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const { event, data } = this.messageQueue.shift();
      this.socket.emit(event, data);
    }
  }

  // 하트비트 시작
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.socket.emit('ping');
      }
    }, this.heartbeatInterval);
  }

  // 하트비트 중지
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 재연결 스케줄링
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`${delay}ms 후 재연결 시도 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // 연결 오류 처리
  handleConnectionError() {
    this.isConnected = false;
    this.stopHeartbeat();
    
    eventBus.emit(AppEvents.WEBSOCKET_ERROR, {
      message: 'WebSocket 연결 오류',
      timestamp: new Date().toISOString()
    });
  }

  // 연결 상태 확인
  isWebSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  // 연결 해제
  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
    }
    this.isConnected = false;
  }

  // 이벤트 리스너 추가
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  // 이벤트 리스너 제거
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 커스텀 이벤트 발생
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  // 연결 통계 조회
  async getConnectionStats() {
    try {
      const response = await fetch('/api/v1/websocket/status');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('연결 통계 조회 실패:', error);
      return null;
    }
  }

  // 메시지 히스토리 조회
  async getMessageHistory(limit = 50) {
    try {
      const response = await fetch(`/api/v1/websocket/messages?limit=${limit}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('메시지 히스토리 조회 실패:', error);
      return null;
    }
  }

  // 메시지 히스토리 초기화
  async clearMessageHistory() {
    try {
      const response = await fetch('/api/v1/websocket/messages', {
        method: 'DELETE'
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('메시지 히스토리 초기화 실패:', error);
      return null;
    }
  }

  // 알림 전송
  async sendNotification(userId, notification) {
    try {
      const response = await fetch('/api/v1/websocket/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...notification
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('알림 전송 실패:', error);
      return null;
    }
  }

  // 브로드캐스트 전송
  async broadcastNotification(notification, room = 'users') {
    try {
      const response = await fetch('/api/v1/websocket/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: room,
          ...notification
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('브로드캐스트 전송 실패:', error);
      return null;
    }
  }

  destroy() {
    this.disconnect();
    this.eventListeners.clear();
  }
}

export class WebSocketError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'WebSocketError';
    this.status = status;
  }
}

// 전역 인스턴스
export const websocketService = new WebSocketService();
