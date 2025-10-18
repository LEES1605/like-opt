/**
 * 상태 표시기 컴포넌트
 * Like-Opt 프론트엔드 상태 표시 컴포넌트
 */

import { BaseComponent } from '../base/BaseComponent.js';

/**
 * 상태 표시기 컴포넌트 클래스
 */
export class StatusIndicator extends BaseComponent {
  constructor(options = {}) {
    super({
      className: 'status-indicator',
      ...options
    });
    
    this.status = options.status || 'unknown'; // online, offline, loading, error, warning, success
    this.text = options.text || '';
    this.icon = options.icon || '';
    this.showIcon = options.showIcon !== false;
    this.showText = options.showText !== false;
    this.animated = options.animated !== false;
    this.pulse = options.pulse || false;
    this.size = options.size || 'medium'; // small, medium, large
    this.variant = options.variant || 'default'; // default, minimal, detailed
  }
  
  /**
   * 상태 설정
   */
  setupState() {
    this.state = {
      status: this.status,
      text: this.text,
      icon: this.icon,
      showIcon: this.showIcon,
      showText: this.showText,
      animated: this.animated,
      pulse: this.pulse,
      size: this.size,
      variant: this.variant,
      isVisible: true
    };
  }
  
  /**
   * 이벤트 설정
   */
  setupEvents() {
    this.events = {
      click: (event) => this.handleClick(event),
      ...this.events
    };
  }
  
  /**
   * 템플릿 렌더링
   */
  renderTemplate() {
    const { 
      status, text, icon, showIcon, showText, animated, pulse, size, variant, isVisible 
    } = this.state;
    
    if (!isVisible) return '';
    
    const statusIcon = this.getStatusIcon(status, icon);
    const statusText = this.getStatusText(status, text);
    const statusClass = this.getStatusClass(status, size, variant, animated, pulse);
    
    return `
      <div class="status-indicator ${statusClass}" data-status="${status}">
        ${showIcon ? `
          <div class="status-icon ${animated ? 'animated' : ''} ${pulse ? 'pulse' : ''}">
            ${statusIcon}
          </div>
        ` : ''}
        
        ${showText ? `
          <span class="status-text">${statusText}</span>
        ` : ''}
        
        ${variant === 'detailed' ? this.renderDetailedStatus() : ''}
      </div>
    `;
  }
  
  /**
   * 상세 상태 렌더링
   */
  renderDetailedStatus() {
    const { status } = this.state;
    
    const details = {
      online: { description: '연결됨', timestamp: new Date().toLocaleTimeString() },
      offline: { description: '연결 끊김', timestamp: '마지막 연결: ' + new Date().toLocaleTimeString() },
      loading: { description: '로딩 중...', timestamp: '' },
      error: { description: '오류 발생', timestamp: new Date().toLocaleTimeString() },
      warning: { description: '경고', timestamp: new Date().toLocaleTimeString() },
      success: { description: '성공', timestamp: new Date().toLocaleTimeString() }
    };
    
    const detail = details[status] || { description: '알 수 없음', timestamp: '' };
    
    return `
      <div class="status-details">
        <div class="status-description">${detail.description}</div>
        ${detail.timestamp ? `<div class="status-timestamp">${detail.timestamp}</div>` : ''}
      </div>
    `;
  }
  
  /**
   * 클릭 이벤트 처리
   */
  handleClick(event) {
    event.preventDefault();
    
    this.emit('status:click', {
      status: this.state.status,
      text: this.state.text
    });
    
    this.showStatusDetails();
  }
  
  /**
   * 상태 아이콘 가져오기
   */
  getStatusIcon(status, customIcon) {
    if (customIcon) return customIcon;
    
    const icons = {
      online: '🟢',
      offline: '🔴',
      loading: '🟡',
      error: '❌',
      warning: '⚠️',
      success: '✅',
      unknown: '❓'
    };
    
    return icons[status] || icons.unknown;
  }
  
  /**
   * 상태 텍스트 가져오기
   */
  getStatusText(status, customText) {
    if (customText) return customText;
    
    const texts = {
      online: '온라인',
      offline: '오프라인',
      loading: '로딩 중',
      error: '오류',
      warning: '경고',
      success: '성공',
      unknown: '알 수 없음'
    };
    
    return texts[status] || texts.unknown;
  }
  
  /**
   * 상태 클래스 가져오기
   */
  getStatusClass(status, size, variant, animated, pulse) {
    const classes = [
      `status-${status}`,
      `size-${size}`,
      `variant-${variant}`
    ];
    
    if (animated) classes.push('animated');
    if (pulse) classes.push('pulse');
    
    return classes.join(' ');
  }
  
  /**
   * 상태 설정
   */
  setStatus(status, text = null) {
    this.setState({ 
      status,
      ...(text && { text })
    });
  }
  
  /**
   * 텍스트 설정
   */
  setText(text) {
    this.setState({ text });
  }
  
  /**
   * 아이콘 설정
   */
  setIcon(icon) {
    this.setState({ icon });
  }
  
  /**
   * 아이콘 표시 설정
   */
  setShowIcon(show) {
    this.setState({ showIcon: show });
  }
  
  /**
   * 텍스트 표시 설정
   */
  setShowText(show) {
    this.setState({ showText: show });
  }
  
  /**
   * 애니메이션 설정
   */
  setAnimated(animated) {
    this.setState({ animated });
  }
  
  /**
   * 펄스 설정
   */
  setPulse(pulse) {
    this.setState({ pulse });
  }
  
  /**
   * 크기 설정
   */
  setSize(size) {
    this.setState({ size });
  }
  
  /**
   * 변형 설정
   */
  setVariant(variant) {
    this.setState({ variant });
  }
  
  /**
   * 표시 설정
   */
  setVisible(visible) {
    this.setState({ isVisible: visible });
  }
  
  /**
   * 상태 상세 정보 표시
   */
  showStatusDetails() {
    const { status, text, icon } = this.state;
    
    this.emit('modal:show', {
      type: 'status-details',
      title: '상태 정보',
      content: `
        <div class="status-details-modal">
          <div class="status-header">
            <div class="status-icon-large">${this.getStatusIcon(status, icon)}</div>
            <div class="status-info">
              <h3>${this.getStatusText(status, text)}</h3>
              <p>상태: ${status}</p>
            </div>
          </div>
          
          <div class="status-meta">
            <div class="meta-item">
              <span class="meta-label">업데이트 시간:</span>
              <span class="meta-value">${new Date().toLocaleString()}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">컴포넌트 ID:</span>
              <span class="meta-value">${this.options.id}</span>
            </div>
          </div>
        </div>
      `,
      buttons: [
        { text: '닫기', type: 'primary', action: 'close' }
      ]
    });
  }
  
  /**
   * 상태 업데이트 (자동)
   */
  updateStatus(newStatus, text = null) {
    this.setStatus(newStatus, text);
    
    // 특정 상태에 따른 자동 동작
    switch (newStatus) {
      case 'loading':
        this.setAnimated(true);
        this.setPulse(true);
        break;
      case 'error':
        this.setAnimated(false);
        this.setPulse(false);
        break;
      case 'success':
        this.setAnimated(false);
        this.setPulse(false);
        // 성공 후 잠시 후 정상 상태로 변경
        setTimeout(() => {
          if (this.state.status === 'success') {
            this.setStatus('online');
          }
        }, 2000);
        break;
      default:
        this.setAnimated(false);
        this.setPulse(false);
    }
  }
  
  /**
   * 상태 데이터 가져오기
   */
  getStatusData() {
    return {
      status: this.state.status,
      text: this.state.text,
      icon: this.state.icon,
      showIcon: this.state.showIcon,
      showText: this.state.showText,
      animated: this.state.animated,
      pulse: this.state.pulse,
      size: this.state.size,
      variant: this.state.variant,
      isVisible: this.state.isVisible
    };
  }
  
  /**
   * 상태 데이터 설정
   */
  setStatusData(data) {
    this.setState({
      status: data.status || this.state.status,
      text: data.text || this.state.text,
      icon: data.icon || this.state.icon,
      showIcon: data.showIcon !== undefined ? data.showIcon : this.state.showIcon,
      showText: data.showText !== undefined ? data.showText : this.state.showText,
      animated: data.animated !== undefined ? data.animated : this.state.animated,
      pulse: data.pulse !== undefined ? data.pulse : this.state.pulse,
      size: data.size || this.state.size,
      variant: data.variant || this.state.variant,
      isVisible: data.isVisible !== undefined ? data.isVisible : this.state.isVisible
    });
  }
}

// 상태 표시기 팩토리
export class StatusIndicatorFactory {
  static create(status, options = {}) {
    return new StatusIndicator({
      status,
      ...options
    });
  }
  
  static createOnline(options = {}) {
    return this.create('online', options);
  }
  
  static createOffline(options = {}) {
    return this.create('offline', options);
  }
  
  static createLoading(options = {}) {
    return this.create('loading', { animated: true, pulse: true, ...options });
  }
  
  static createError(options = {}) {
    return this.create('error', options);
  }
  
  static createWarning(options = {}) {
    return this.create('warning', options);
  }
  
  static createSuccess(options = {}) {
    return this.create('success', options);
  }
}

// 상태 표시기 매니저
export class StatusIndicatorManager {
  static indicators = new Map();
  
  static register(id, indicator) {
    this.indicators.set(id, indicator);
  }
  
  static get(id) {
    return this.indicators.get(id);
  }
  
  static getAll() {
    return Array.from(this.indicators.values());
  }
  
  static getByStatus(status) {
    return this.getAll().filter(indicator => indicator.state.status === status);
  }
  
  static updateAllStatus(status, text = null) {
    this.getAll().forEach(indicator => {
      indicator.updateStatus(status, text);
    });
  }
  
  static cleanup() {
    this.indicators.clear();
  }
}
