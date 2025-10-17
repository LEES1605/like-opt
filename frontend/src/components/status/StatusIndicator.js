/**
 * StatusIndicator - 재사용 가능한 상태 표시 컴포넌트
 * 플로팅 상태 인디케이터, 펄스 애니메이션, 실시간 상태 업데이트 제공
 */
export class StatusIndicator {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      position: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
      showText: true,
      autoHide: false,
      hideDelay: 3000,
      pulseAnimation: true,
      ...options
    };
    
    this.currentStatus = 'unknown';
    this.statusHistory = [];
    this.visibilityTimer = null;
    
    this.init();
  }
  
  /**
   * 상태 인디케이터 초기화
   */
  init() {
    this.render();
    this.setupEventListeners();
    this.updateStatus('ready', '준비완료');
  }
  
  /**
   * 상태 인디케이터 HTML 렌더링
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with id '${this.containerId}' not found`);
      return;
    }
    
    container.innerHTML = `
      <div class="status-indicator-floating ${this.options.position}" id="status-indicator">
        <div class="status-pulse" data-status="unknown"></div>
        ${this.options.showText ? '<span class="status-text">상태 확인 중...</span>' : ''}
        <div class="status-tooltip" id="status-tooltip">
          <div class="tooltip-content">
            <div class="tooltip-header">시스템 상태</div>
            <div class="tooltip-body">
              <div class="status-item">
                <span class="status-label">현재 상태:</span>
                <span class="status-value" id="tooltip-current-status">확인 중</span>
              </div>
              <div class="status-item">
                <span class="status-label">마지막 업데이트:</span>
                <span class="status-value" id="tooltip-last-update">-</span>
              </div>
              <div class="status-item">
                <span class="status-label">상태 지속 시간:</span>
                <span class="status-value" id="tooltip-duration">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.setupTooltip();
  }
  
  /**
   * 툴팁 설정
   */
  setupTooltip() {
    const indicator = document.getElementById('status-indicator');
    const tooltip = document.getElementById('status-tooltip');
    
    if (!indicator || !tooltip) return;
    
    let tooltipTimer = null;
    
    // 마우스 오버 시 툴팁 표시
    indicator.addEventListener('mouseenter', () => {
      clearTimeout(tooltipTimer);
      tooltip.style.display = 'block';
      this.updateTooltip();
    });
    
    // 마우스 아웃 시 툴팁 숨김
    indicator.addEventListener('mouseleave', () => {
      tooltipTimer = setTimeout(() => {
        tooltip.style.display = 'none';
      }, 100);
    });
  }
  
  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 상태 클릭 시 상세 정보 표시
    const indicator = document.getElementById('status-indicator');
    if (indicator) {
      indicator.addEventListener('click', () => {
        this.showStatusDetails();
      });
    }
  }
  
  /**
   * 상태 업데이트
   */
  updateStatus(status, message = '', details = {}) {
    const previousStatus = this.currentStatus;
    this.currentStatus = status;
    
    // 상태 기록에 추가
    this.statusHistory.push({
      status,
      message,
      timestamp: new Date(),
      details
    });
    
    // 최대 50개 기록만 유지
    if (this.statusHistory.length > 50) {
      this.statusHistory.shift();
    }
    
    // UI 업데이트
    this.updateStatusDisplay(status, message);
    this.updateTooltip();
    
    // 상태 변경 이벤트 발생
    this.emitStatusChange(previousStatus, status, message, details);
    
    // 자동 숨김 설정
    if (this.options.autoHide && status !== 'error') {
      this.scheduleAutoHide();
    }
  }
    
  /**
   * 상태 표시 업데이트
   */
  updateStatusDisplay(status, message) {
    const indicator = document.getElementById('status-indicator');
    const pulse = indicator?.querySelector('.status-pulse');
    const text = indicator?.querySelector('.status-text');
    
    if (!pulse) return;
    
    // 기존 상태 클래스 제거
    pulse.className = 'status-pulse';
    
    // 새 상태 클래스 추가
    switch (status) {
      case 'ready':
        pulse.classList.add('green');
        if (text) text.textContent = message || '준비완료';
        break;
      case 'loading':
        pulse.classList.add('yellow');
        if (text) text.textContent = message || '처리중';
        break;
      case 'error':
        pulse.classList.add('red');
        if (text) text.textContent = message || '오류';
        break;
      case 'warning':
        pulse.classList.add('orange');
        if (text) text.textContent = message || '경고';
        break;
      case 'offline':
        pulse.classList.add('gray');
        if (text) text.textContent = message || '오프라인';
        break;
      default:
        pulse.classList.add('gray');
        if (text) text.textContent = message || '알 수 없음';
    }
    
    // 펄스 애니메이션 설정
    if (this.options.pulseAnimation) {
      pulse.style.animation = `pulse 2s infinite`;
    } else {
      pulse.style.animation = 'none';
    }
  }
  
  /**
   * 툴팁 업데이트
   */
  updateTooltip() {
    const currentStatusEl = document.getElementById('tooltip-current-status');
    const lastUpdateEl = document.getElementById('tooltip-last-update');
    const durationEl = document.getElementById('tooltip-duration');
    
    if (!currentStatusEl || !lastUpdateEl || !durationEl) return;
    
    const currentRecord = this.statusHistory[this.statusHistory.length - 1];
    if (!currentRecord) return;
    
    // 현재 상태 표시
    currentStatusEl.textContent = currentRecord.message || currentRecord.status;
    currentStatusEl.className = `status-value ${currentRecord.status}`;
    
    // 마지막 업데이트 시간
    lastUpdateEl.textContent = currentRecord.timestamp.toLocaleTimeString('ko-KR');
    
    // 상태 지속 시간 계산
    const now = new Date();
    const duration = Math.floor((now - currentRecord.timestamp) / 1000);
    durationEl.textContent = `${duration}초`;
  }
  
  /**
   * 상태 변경 이벤트 발생
   */
  emitStatusChange(previousStatus, newStatus, message, details) {
    const event = new CustomEvent('statusChange', {
      detail: {
        previousStatus,
        newStatus,
        message,
        details,
        timestamp: new Date()
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * 자동 숨김 스케줄링
   */
  scheduleAutoHide() {
    if (this.visibilityTimer) {
      clearTimeout(this.visibilityTimer);
    }
    
    this.visibilityTimer = setTimeout(() => {
      this.hide();
    }, this.options.hideDelay);
  }
  
  /**
   * 상태 인디케이터 표시
   */
  show() {
    const indicator = document.getElementById('status-indicator');
    if (indicator) {
      indicator.style.display = 'flex';
    }
  }
  
  /**
   * 상태 인디케이터 숨김
   */
  hide() {
    const indicator = document.getElementById('status-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }
  
  /**
   * 상태 토글 (표시/숨김)
   */
  toggle() {
    const indicator = document.getElementById('status-indicator');
    if (indicator) {
      const isVisible = indicator.style.display !== 'none';
      indicator.style.display = isVisible ? 'none' : 'flex';
    }
  }
  
  /**
   * 상태 상세 정보 표시
   */
  showStatusDetails() {
    const details = {
      currentStatus: this.currentStatus,
      statusHistory: [...this.statusHistory].reverse().slice(0, 10),
      totalChanges: this.statusHistory.length,
      uptime: this.calculateUptime()
    };
    
    // 상세 정보를 콘솔에 출력 (실제로는 모달이나 다른 UI로 표시 가능)
    console.group('🔍 시스템 상태 상세 정보');
    console.log('현재 상태:', this.currentStatus);
    console.log('상태 기록:', details.statusHistory);
    console.log('총 상태 변경:', details.totalChanges);
    console.log('가동 시간:', details.uptime);
    console.groupEnd();
    
    // 상세 정보 이벤트 발생
    const event = new CustomEvent('statusDetailsRequested', {
      detail: details
    });
    document.dispatchEvent(event);
  }
  
  /**
   * 가동 시간 계산
   */
  calculateUptime() {
    if (this.statusHistory.length === 0) return '0초';
    
    const startTime = this.statusHistory[0].timestamp;
    const now = new Date();
    const uptimeMs = now - startTime;
    
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분`;
    } else if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    } else {
      return `${seconds}초`;
    }
  }
  
  /**
   * 상태 기록 가져오기
   */
  getStatusHistory() {
    return [...this.statusHistory];
  }
  
  /**
   * 현재 상태 가져오기
   */
  getCurrentStatus() {
    return this.currentStatus;
  }
  
  /**
   * 상태 기록 초기화
   */
  clearHistory() {
    this.statusHistory = [];
  }
  
  /**
   * 컴포넌트 정리
   */
  destroy() {
    if (this.visibilityTimer) {
      clearTimeout(this.visibilityTimer);
    }
    
    const indicator = document.getElementById('status-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}
