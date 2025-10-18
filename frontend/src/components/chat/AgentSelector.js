/**
 * 에이전트 선택 컴포넌트
 * 동일한 페르소나 기반 에이전트 토글 시스템
 */

import { BaseComponent } from '../base/BaseComponent.js';
import { eventBus, AppEvents } from '../../utils/events.js';

export class AgentSelector extends BaseComponent {
  constructor(options = {}) {
    super(options);
    
    this.agents = [
      {
        id: 'professor-g',
        name: 'Professor G',
        description: '친절하고 체계적인 영어 문법 전문가',
        icon: '👨‍🏫',
        color: '#4CAF50',
        personality: '친절하고 체계적이며, 문법을 명확하게 설명하는 것을 좋아합니다.',
        style: 'formal'
      },
      {
        id: 'grammar-buddy',
        name: 'Grammar Buddy',
        description: '편안하고 친근한 문법 도우미',
        icon: '🤝',
        color: '#2196F3',
        personality: '친근하고 편안하며, 학습자를 격려하고 동기부여를 잘합니다.',
        style: 'casual'
      },
      {
        id: 'syntax-sensei',
        name: 'Syntax Sensei',
        description: '엄격하지만 효과적인 문법 마스터',
        icon: '🥋',
        color: '#FF9800',
        personality: '엄격하지만 공정하며, 정확성을 중시하고 실수를 바로잡는 것을 좋아합니다.',
        style: 'strict'
      },
      {
        id: 'word-wizard',
        name: 'Word Wizard',
        description: '창의적이고 재미있는 언어 마법사',
        icon: '🧙‍♂️',
        color: '#9C27B0',
        personality: '창의적이고 재미있으며, 언어의 아름다움과 창의적 사용을 강조합니다.',
        style: 'creative'
      }
    ];
    
    this.currentAgent = this.agents[0]; // 기본 에이전트
    this.isExpanded = false;
    
    this.init();
  }

  init() {
    this.createHTML();
    this.bindEvents();
    this.loadAgentSettings();
  }

  createHTML() {
    this.element.innerHTML = `
      <div class="agent-selector">
        <!-- 현재 선택된 에이전트 -->
        <div class="current-agent" id="current-agent">
          <div class="agent-avatar" style="background-color: ${this.currentAgent.color}">
            ${this.currentAgent.icon}
          </div>
          <div class="agent-info">
            <div class="agent-name">${this.currentAgent.name}</div>
            <div class="agent-description">${this.currentAgent.description}</div>
          </div>
          <button class="expand-btn" id="expand-btn">
            <span class="expand-icon">▼</span>
          </button>
        </div>

        <!-- 에이전트 목록 -->
        <div class="agent-list" id="agent-list" style="display: none;">
          <div class="agent-list-header">
            <h3>에이전트 선택</h3>
            <button class="close-btn" id="close-btn">✕</button>
          </div>
          <div class="agent-options">
            ${this.agents.map(agent => `
              <div class="agent-option ${agent.id === this.currentAgent.id ? 'selected' : ''}" 
                   data-agent-id="${agent.id}">
                <div class="agent-option-avatar" style="background-color: ${agent.color}">
                  ${agent.icon}
                </div>
                <div class="agent-option-info">
                  <div class="agent-option-name">${agent.name}</div>
                  <div class="agent-option-description">${agent.description}</div>
                  <div class="agent-option-personality">${agent.personality}</div>
                </div>
                <div class="agent-option-style">
                  <span class="style-badge ${agent.style}">${this.getStyleText(agent.style)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 에이전트 상세 정보 -->
        <div class="agent-detail" id="agent-detail" style="display: none;">
          <div class="detail-header">
            <h3>에이전트 상세 정보</h3>
            <button class="close-detail-btn" id="close-detail-btn">✕</button>
          </div>
          <div class="detail-content" id="detail-content">
            <!-- 동적으로 생성됨 -->
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 에이전트 목록 토글
    const expandBtn = this.element.querySelector('#expand-btn');
    expandBtn.addEventListener('click', () => {
      this.toggleAgentList();
    });

    // 에이전트 목록 닫기
    const closeBtn = this.element.querySelector('#close-btn');
    closeBtn.addEventListener('click', () => {
      this.hideAgentList();
    });

    // 에이전트 선택
    const agentOptions = this.element.querySelectorAll('.agent-option');
    agentOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const agentId = e.currentTarget.dataset.agentId;
        this.selectAgent(agentId);
      });

      // 에이전트 상세 정보 보기
      option.addEventListener('dblclick', (e) => {
        const agentId = e.currentTarget.dataset.agentId;
        this.showAgentDetail(agentId);
      });
    });

    // 상세 정보 닫기
    const closeDetailBtn = this.element.querySelector('#close-detail-btn');
    closeDetailBtn.addEventListener('click', () => {
      this.hideAgentDetail();
    });

    // 외부 클릭 시 목록 닫기
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target)) {
        this.hideAgentList();
        this.hideAgentDetail();
      }
    });
  }

  toggleAgentList() {
    const agentList = this.element.querySelector('#agent-list');
    const expandIcon = this.element.querySelector('.expand-icon');
    
    if (this.isExpanded) {
      this.hideAgentList();
    } else {
      this.showAgentList();
    }
  }

  showAgentList() {
    const agentList = this.element.querySelector('#agent-list');
    const expandIcon = this.element.querySelector('.expand-icon');
    
    agentList.style.display = 'block';
    expandIcon.textContent = '▲';
    this.isExpanded = true;
    
    // 애니메이션 효과
    agentList.style.opacity = '0';
    agentList.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      agentList.style.opacity = '1';
      agentList.style.transform = 'translateY(0)';
    }, 10);
  }

  hideAgentList() {
    const agentList = this.element.querySelector('#agent-list');
    const expandIcon = this.element.querySelector('.expand-icon');
    
    agentList.style.opacity = '0';
    agentList.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      agentList.style.display = 'none';
      expandIcon.textContent = '▼';
      this.isExpanded = false;
    }, 200);
  }

  selectAgent(agentId) {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) return;

    // 현재 에이전트 업데이트
    this.currentAgent = agent;
    
    // UI 업데이트
    this.updateCurrentAgent();
    this.updateAgentOptions();
    
    // 에이전트 목록 닫기
    this.hideAgentList();
    
    // 이벤트 발생
    eventBus.emit(AppEvents.AGENT_CHANGED, {
      agent: agent,
      previousAgent: this.agents.find(a => a.id !== agentId)
    });
    
    // 에이전트 설정 저장
    this.saveAgentSettings();
    
    // 성공 메시지
    this.showSuccess(`에이전트가 ${agent.name}으로 변경되었습니다.`);
  }

  updateCurrentAgent() {
    const currentAgentElement = this.element.querySelector('#current-agent');
    const avatar = currentAgentElement.querySelector('.agent-avatar');
    const name = currentAgentElement.querySelector('.agent-name');
    const description = currentAgentElement.querySelector('.agent-description');
    
    avatar.style.backgroundColor = this.currentAgent.color;
    avatar.textContent = this.currentAgent.icon;
    name.textContent = this.currentAgent.name;
    description.textContent = this.currentAgent.description;
  }

  updateAgentOptions() {
    const agentOptions = this.element.querySelectorAll('.agent-option');
    agentOptions.forEach(option => {
      const agentId = option.dataset.agentId;
      if (agentId === this.currentAgent.id) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    });
  }

  showAgentDetail(agentId) {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) return;

    const detailSection = this.element.querySelector('#agent-detail');
    const detailContent = this.element.querySelector('#detail-content');
    
    detailContent.innerHTML = `
      <div class="agent-detail-grid">
        <div class="detail-section">
          <div class="detail-avatar" style="background-color: ${agent.color}">
            ${agent.icon}
          </div>
          <div class="detail-basic">
            <h4>${agent.name}</h4>
            <p class="detail-description">${agent.description}</p>
            <div class="detail-style">
              <span class="style-badge ${agent.style}">${this.getStyleText(agent.style)}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h4>성격 및 특징</h4>
          <p class="detail-personality">${agent.personality}</p>
        </div>
        
        <div class="detail-section">
          <h4>응답 스타일</h4>
          <div class="style-examples">
            ${this.getStyleExamples(agent.style)}
          </div>
        </div>
        
        <div class="detail-section">
          <h4>적합한 상황</h4>
          <div class="suitable-situations">
            ${this.getSuitableSituations(agent.id)}
          </div>
        </div>
      </div>
      
      <div class="detail-actions">
        <button class="action-btn primary" onclick="agentSelector.selectAgent('${agent.id}')">
          이 에이전트 선택
        </button>
        <button class="action-btn secondary" onclick="agentSelector.hideAgentDetail()">
          닫기
        </button>
      </div>
    `;
    
    detailSection.style.display = 'block';
    
    // 애니메이션 효과
    detailSection.style.opacity = '0';
    detailSection.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      detailSection.style.opacity = '1';
      detailSection.style.transform = 'scale(1)';
    }, 10);
  }

  hideAgentDetail() {
    const detailSection = this.element.querySelector('#agent-detail');
    
    detailSection.style.opacity = '0';
    detailSection.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      detailSection.style.display = 'none';
    }, 200);
  }

  getStyleText(style) {
    const styleMap = {
      'formal': '정중한',
      'casual': '편안한',
      'strict': '엄격한',
      'creative': '창의적인'
    };
    return styleMap[style] || style;
  }

  getStyleExamples(style) {
    const examples = {
      'formal': `
        <div class="example-item">
          <strong>예시:</strong> "안녕하세요. 오늘은 현재완료 시제에 대해 학습해보겠습니다."
        </div>
      `,
      'casual': `
        <div class="example-item">
          <strong>예시:</strong> "안녕! 오늘은 현재완료 시제를 함께 공부해볼까?"
        </div>
      `,
      'strict': `
        <div class="example-item">
          <strong>예시:</strong> "현재완료 시제는 정확한 규칙이 있습니다. 집중해서 듣도록 하세요."
        </div>
      `,
      'creative': `
        <div class="example-item">
          <strong>예시:</strong> "현재완료 시제는 마법의 시간 여행자 같아요! 과거와 현재를 연결해주죠."
        </div>
      `
    };
    return examples[style] || '';
  }

  getSuitableSituations(agentId) {
    const situations = {
      'professor-g': `
        <div class="situation-item">📚 체계적인 문법 학습</div>
        <div class="situation-item">🎯 정확한 문법 설명</div>
        <div class="situation-item">📝 시험 준비</div>
      `,
      'grammar-buddy': `
        <div class="situation-item">💬 편안한 대화</div>
        <div class="situation-item">🤗 격려가 필요한 때</div>
        <div class="situation-item">😊 재미있는 학습</div>
      `,
      'syntax-sensei': `
        <div class="situation-item">⚡ 빠른 실수 수정</div>
        <div class="situation-item">🎯 정확성 중시</div>
        <div class="situation-item">📋 체계적인 검토</div>
      `,
      'word-wizard': `
        <div class="situation-item">✨ 창의적 표현</div>
        <div class="situation-item">🎨 언어의 아름다움</div>
        <div class="situation-item">🌟 영감을 주는 학습</div>
      `
    };
    return situations[agentId] || '';
  }

  loadAgentSettings() {
    try {
      const savedAgentId = localStorage.getItem('selectedAgent');
      if (savedAgentId) {
        const agent = this.agents.find(a => a.id === savedAgentId);
        if (agent) {
          this.currentAgent = agent;
          this.updateCurrentAgent();
          this.updateAgentOptions();
        }
      }
    } catch (error) {
      console.error('에이전트 설정 로드 실패:', error);
    }
  }

  saveAgentSettings() {
    try {
      localStorage.setItem('selectedAgent', this.currentAgent.id);
    } catch (error) {
      console.error('에이전트 설정 저장 실패:', error);
    }
  }

  getCurrentAgent() {
    return this.currentAgent;
  }

  setAgent(agentId) {
    this.selectAgent(agentId);
  }

  showSuccess(message) {
    console.log('Success:', message);
    // TODO: 토스트 알림 구현
  }

  destroy() {
    super.destroy();
  }
}
