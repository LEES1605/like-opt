/**
 * 성능 모니터링 컴포넌트
 * 실시간 시스템 메트릭, 성능 지표, 모니터링 차트
 */

import { BaseComponent } from '../base/BaseComponent.js';
import { eventBus, AppEvents } from '../../utils/events.js';

export class PerformanceMonitor extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.metrics = {};
    this.charts = {};
    this.updateInterval = null;
    this.isMonitoring = false;
    
    this.init();
  }

  init() {
    this.createHTML();
    this.bindEvents();
    this.startMonitoring();
  }

  createHTML() {
    this.element.innerHTML = `
      <div class="performance-monitor">
        <div class="admin-header">
          <h2>📊 성능 모니터링</h2>
          <div class="monitor-controls">
            <button class="action-btn" id="toggle-monitoring">
              <span class="btn-icon">⏸️</span>
              <span class="btn-text">모니터링 일시정지</span>
            </button>
            <button class="action-btn secondary" id="export-metrics">
              <span class="btn-icon">📊</span>
              <span class="btn-text">메트릭 내보내기</span>
            </button>
          </div>
        </div>

        <!-- 실시간 메트릭 카드 -->
        <div class="metrics-grid">
          <div class="metric-card cpu">
            <div class="metric-header">
              <h3>🖥️ CPU 사용률</h3>
              <span class="metric-value" id="cpu-usage">-</span>
            </div>
            <div class="metric-chart">
              <canvas id="cpu-chart" width="200" height="100"></canvas>
            </div>
          </div>

          <div class="metric-card memory">
            <div class="metric-header">
              <h3>💾 메모리 사용량</h3>
              <span class="metric-value" id="memory-usage">-</span>
            </div>
            <div class="metric-chart">
              <canvas id="memory-chart" width="200" height="100"></canvas>
            </div>
          </div>

          <div class="metric-card disk">
            <div class="metric-header">
              <h3>💿 디스크 사용량</h3>
              <span class="metric-value" id="disk-usage">-</span>
            </div>
            <div class="metric-chart">
              <canvas id="disk-chart" width="200" height="100"></canvas>
            </div>
          </div>

          <div class="metric-card network">
            <div class="metric-header">
              <h3>🌐 네트워크</h3>
              <span class="metric-value" id="network-usage">-</span>
            </div>
            <div class="metric-chart">
              <canvas id="network-chart" width="200" height="100"></canvas>
            </div>
          </div>
        </div>

        <!-- 상세 성능 차트 -->
        <div class="detailed-charts">
          <div class="chart-section">
            <div class="chart-header">
              <h3>📈 시스템 성능 추이</h3>
              <div class="chart-controls">
                <select id="time-range">
                  <option value="1h">최근 1시간</option>
                  <option value="6h">최근 6시간</option>
                  <option value="24h" selected>최근 24시간</option>
                  <option value="7d">최근 7일</option>
                </select>
                <button class="action-btn small" id="refresh-charts">새로고침</button>
              </div>
            </div>
            <div class="chart-container">
              <canvas id="performance-chart" width="800" height="400"></canvas>
            </div>
          </div>
        </div>

        <!-- API 성능 모니터링 -->
        <div class="api-performance">
          <div class="section-header">
            <h3>🚀 API 성능</h3>
          </div>
          <div class="api-metrics-grid">
            <div class="api-metric">
              <div class="api-metric-label">평균 응답 시간</div>
              <div class="api-metric-value" id="avg-response-time">-</div>
            </div>
            <div class="api-metric">
              <div class="api-metric-label">초당 요청 수</div>
              <div class="api-metric-value" id="requests-per-second">-</div>
            </div>
            <div class="api-metric">
              <div class="api-metric-label">에러율</div>
              <div class="api-metric-value" id="error-rate">-</div>
            </div>
            <div class="api-metric">
              <div class="api-metric-label">성공률</div>
              <div class="api-metric-value" id="success-rate">-</div>
            </div>
          </div>
        </div>

        <!-- 데이터베이스 성능 -->
        <div class="database-performance">
          <div class="section-header">
            <h3>🗄️ 데이터베이스 성능</h3>
          </div>
          <div class="db-metrics-grid">
            <div class="db-metric">
              <div class="db-metric-label">연결 수</div>
              <div class="db-metric-value" id="db-connections">-</div>
            </div>
            <div class="db-metric">
              <div class="db-metric-label">쿼리 시간</div>
              <div class="db-metric-value" id="query-time">-</div>
            </div>
            <div class="db-metric">
              <div class="db-metric-label">캐시 히트율</div>
              <div class="db-metric-value" id="cache-hit-rate">-</div>
            </div>
            <div class="db-metric">
              <div class="db-metric-label">트랜잭션 수</div>
              <div class="db-metric-value" id="transactions">-</div>
            </div>
          </div>
        </div>

        <!-- 알림 설정 -->
        <div class="alert-settings">
          <div class="section-header">
            <h3>🔔 성능 알림 설정</h3>
          </div>
          <div class="alert-config">
            <div class="alert-item">
              <label class="alert-label">
                <input type="checkbox" id="cpu-alert" checked>
                <span class="checkmark"></span>
                CPU 사용률 알림
              </label>
              <input type="number" id="cpu-threshold" value="80" min="1" max="100" placeholder="임계값 (%)">
            </div>
            <div class="alert-item">
              <label class="alert-label">
                <input type="checkbox" id="memory-alert" checked>
                <span class="checkmark"></span>
                메모리 사용률 알림
              </label>
              <input type="number" id="memory-threshold" value="85" min="1" max="100" placeholder="임계값 (%)">
            </div>
            <div class="alert-item">
              <label class="alert-label">
                <input type="checkbox" id="disk-alert" checked>
                <span class="checkmark"></span>
                디스크 사용률 알림
              </label>
              <input type="number" id="disk-threshold" value="90" min="1" max="100" placeholder="임계값 (%)">
            </div>
            <div class="alert-item">
              <label class="alert-label">
                <input type="checkbox" id="response-alert" checked>
                <span class="checkmark"></span>
                응답 시간 알림
              </label>
              <input type="number" id="response-threshold" value="5000" min="100" max="30000" placeholder="임계값 (ms)">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 모니터링 토글
    const toggleBtn = this.element.querySelector('#toggle-monitoring');
    toggleBtn.addEventListener('click', () => {
      this.toggleMonitoring();
    });

    // 메트릭 내보내기
    const exportBtn = this.element.querySelector('#export-metrics');
    exportBtn.addEventListener('click', () => {
      this.exportMetrics();
    });

    // 차트 새로고침
    const refreshBtn = this.element.querySelector('#refresh-charts');
    refreshBtn.addEventListener('click', () => {
      this.refreshCharts();
    });

    // 시간 범위 변경
    const timeRangeSelect = this.element.querySelector('#time-range');
    timeRangeSelect.addEventListener('change', (e) => {
      this.updateTimeRange(e.target.value);
    });

    // 알림 설정 변경
    const alertCheckboxes = this.element.querySelectorAll('.alert-item input[type="checkbox"]');
    alertCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.updateAlertSetting(e.target.id, e.target.checked);
      });
    });

    const alertInputs = this.element.querySelectorAll('.alert-item input[type="number"]');
    alertInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.updateAlertThreshold(e.target.id, e.target.value);
      });
    });
  }

  startMonitoring() {
    this.isMonitoring = true;
    this.updateMetrics();
    this.updateInterval = setInterval(() => {
      if (this.isMonitoring) {
        this.updateMetrics();
      }
    }, 5000); // 5초마다 업데이트
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  toggleMonitoring() {
    const toggleBtn = this.element.querySelector('#toggle-monitoring');
    const btnText = this.element.querySelector('.btn-text');
    const btnIcon = this.element.querySelector('.btn-icon');
    
    if (this.isMonitoring) {
      this.stopMonitoring();
      btnText.textContent = '모니터링 시작';
      btnIcon.textContent = '▶️';
    } else {
      this.startMonitoring();
      btnText.textContent = '모니터링 일시정지';
      btnIcon.textContent = '⏸️';
    }
  }

  async updateMetrics() {
    try {
      const response = await fetch('/api/admin/performance/metrics');
      const data = await response.json();
      
      if (data.success) {
        this.metrics = data.metrics;
        this.updateMetricCards();
        this.updateCharts();
        this.checkAlerts();
      }
    } catch (error) {
      console.error('메트릭 업데이트 실패:', error);
    }
  }

  updateMetricCards() {
    const metrics = this.metrics;
    
    // CPU 사용률
    this.element.querySelector('#cpu-usage').textContent = `${metrics.cpu?.usage || 0}%`;
    this.updateMiniChart('cpu-chart', metrics.cpu?.history || []);
    
    // 메모리 사용량
    const memoryUsage = metrics.memory?.usage || 0;
    const memoryTotal = metrics.memory?.total || 1;
    const memoryPercent = Math.round((memoryUsage / memoryTotal) * 100);
    this.element.querySelector('#memory-usage').textContent = `${memoryPercent}%`;
    this.updateMiniChart('memory-chart', metrics.memory?.history || []);
    
    // 디스크 사용량
    const diskUsage = metrics.disk?.usage || 0;
    const diskTotal = metrics.disk?.total || 1;
    const diskPercent = Math.round((diskUsage / diskTotal) * 100);
    this.element.querySelector('#disk-usage').textContent = `${diskPercent}%`;
    this.updateMiniChart('disk-chart', metrics.disk?.history || []);
    
    // 네트워크 사용량
    const networkIn = metrics.network?.in || 0;
    const networkOut = metrics.network?.out || 0;
    this.element.querySelector('#network-usage').textContent = `${this.formatBytes(networkIn + networkOut)}/s`;
    this.updateMiniChart('network-chart', metrics.network?.history || []);
    
    // API 성능
    this.element.querySelector('#avg-response-time').textContent = `${metrics.api?.avgResponseTime || 0}ms`;
    this.element.querySelector('#requests-per-second').textContent = `${metrics.api?.rps || 0}`;
    this.element.querySelector('#error-rate').textContent = `${metrics.api?.errorRate || 0}%`;
    this.element.querySelector('#success-rate').textContent = `${metrics.api?.successRate || 0}%`;
    
    // 데이터베이스 성능
    this.element.querySelector('#db-connections').textContent = `${metrics.database?.connections || 0}`;
    this.element.querySelector('#query-time').textContent = `${metrics.database?.avgQueryTime || 0}ms`;
    this.element.querySelector('#cache-hit-rate').textContent = `${metrics.database?.cacheHitRate || 0}%`;
    this.element.querySelector('#transactions').textContent = `${metrics.database?.transactions || 0}`;
  }

  updateMiniChart(canvasId, data) {
    const canvas = this.element.querySelector(`#${canvasId}`);
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 캔버스 클리어
    ctx.clearRect(0, 0, width, height);
    
    if (data.length === 0) return;
    
    // 데이터 정규화
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;
    
    // 선 그리기
    ctx.beginPath();
    ctx.strokeStyle = this.getChartColor(canvasId);
    ctx.lineWidth = 2;
    
    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - minValue) / range) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  }

  updateCharts() {
    // 메인 성능 차트 업데이트
    this.updatePerformanceChart();
  }

  updatePerformanceChart() {
    const canvas = this.element.querySelector('#performance-chart');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 캔버스 클리어
    ctx.clearRect(0, 0, width, height);
    
    // 배경 그리기
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // 그리드 그리기
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // 수평 그리드
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // 수직 그리드
    for (let i = 0; i <= 20; i++) {
      const x = (i / 20) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // 성능 데이터 그리기
    this.drawPerformanceLines(ctx, width, height);
  }

  drawPerformanceLines(ctx, width, height) {
    const metrics = this.metrics;
    const timeRange = this.element.querySelector('#time-range').value;
    const dataPoints = this.getDataPoints(timeRange);
    
    // CPU 라인
    if (metrics.cpu?.history) {
      this.drawLine(ctx, metrics.cpu.history, width, height, '#ff6b6b', 'CPU');
    }
    
    // 메모리 라인
    if (metrics.memory?.history) {
      this.drawLine(ctx, metrics.memory.history, width, height, '#4ecdc4', 'Memory');
    }
    
    // 디스크 라인
    if (metrics.disk?.history) {
      this.drawLine(ctx, metrics.disk.history, width, height, '#45b7d1', 'Disk');
    }
  }

  drawLine(ctx, data, width, height, color, label) {
    if (data.length === 0) return;
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;
    
    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - minValue) / range) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  }

  getDataPoints(timeRange) {
    const ranges = {
      '1h': 12,    // 5분 간격
      '6h': 36,    // 10분 간격
      '24h': 48,   // 30분 간격
      '7d': 168    // 1시간 간격
    };
    return ranges[timeRange] || 48;
  }

  updateTimeRange(timeRange) {
    this.refreshCharts();
  }

  refreshCharts() {
    this.updateCharts();
  }

  checkAlerts() {
    const metrics = this.metrics;
    
    // CPU 알림
    if (this.element.querySelector('#cpu-alert').checked) {
      const threshold = parseInt(this.element.querySelector('#cpu-threshold').value);
      if (metrics.cpu?.usage > threshold) {
        this.showAlert('CPU 사용률이 임계값을 초과했습니다.', 'warning');
      }
    }
    
    // 메모리 알림
    if (this.element.querySelector('#memory-alert').checked) {
      const threshold = parseInt(this.element.querySelector('#memory-threshold').value);
      const memoryPercent = Math.round((metrics.memory?.usage || 0) / (metrics.memory?.total || 1) * 100);
      if (memoryPercent > threshold) {
        this.showAlert('메모리 사용률이 임계값을 초과했습니다.', 'warning');
      }
    }
    
    // 디스크 알림
    if (this.element.querySelector('#disk-alert').checked) {
      const threshold = parseInt(this.element.querySelector('#disk-threshold').value);
      const diskPercent = Math.round((metrics.disk?.usage || 0) / (metrics.disk?.total || 1) * 100);
      if (diskPercent > threshold) {
        this.showAlert('디스크 사용률이 임계값을 초과했습니다.', 'warning');
      }
    }
    
    // 응답 시간 알림
    if (this.element.querySelector('#response-alert').checked) {
      const threshold = parseInt(this.element.querySelector('#response-threshold').value);
      if (metrics.api?.avgResponseTime > threshold) {
        this.showAlert('API 응답 시간이 임계값을 초과했습니다.', 'warning');
      }
    }
  }

  showAlert(message, type) {
    console.log(`Alert [${type}]:`, message);
    // TODO: 토스트 알림 구현
  }

  async updateAlertSetting(settingId, enabled) {
    try {
      const response = await fetch('/api/admin/performance/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting: settingId, enabled: enabled })
      });
      
      if (response.ok) {
        console.log(`알림 설정 업데이트: ${settingId} = ${enabled}`);
      }
    } catch (error) {
      console.error('알림 설정 업데이트 실패:', error);
    }
  }

  async updateAlertThreshold(settingId, threshold) {
    try {
      const response = await fetch('/api/admin/performance/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting: settingId, threshold: parseInt(threshold) })
      });
      
      if (response.ok) {
        console.log(`알림 임계값 업데이트: ${settingId} = ${threshold}`);
      }
    } catch (error) {
      console.error('알림 임계값 업데이트 실패:', error);
    }
  }

  exportMetrics() {
    const metrics = this.metrics;
    const timestamp = new Date().toISOString();
    
    const exportData = {
      timestamp: timestamp,
      metrics: metrics,
      summary: {
        cpu: metrics.cpu?.usage || 0,
        memory: Math.round((metrics.memory?.usage || 0) / (metrics.memory?.total || 1) * 100),
        disk: Math.round((metrics.disk?.usage || 0) / (metrics.disk?.total || 1) * 100),
        api: metrics.api?.avgResponseTime || 0
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_metrics_${timestamp.split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getChartColor(canvasId) {
    const colors = {
      'cpu-chart': '#ff6b6b',
      'memory-chart': '#4ecdc4',
      'disk-chart': '#45b7d1',
      'network-chart': '#96ceb4'
    };
    return colors[canvasId] || '#666';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  destroy() {
    this.stopMonitoring();
    super.destroy();
  }
}
