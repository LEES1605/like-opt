"""
에이전트 서비스
동일한 페르소나 기반 에이전트 프롬프트 관리 시스템
"""

from __future__ import annotations
from typing import Dict, List, Any, Optional
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class AgentPromptManager:
    """에이전트 프롬프트 관리자"""
    
    def __init__(self, prompts_dir: str = "backend/prompts"):
        self.prompts_dir = Path(prompts_dir)
        self.agents = {}
        self.base_persona = self._load_base_persona()
        self._load_agent_prompts()
    
    def _load_base_persona(self) -> str:
        """기본 페르소나 로드"""
        return """당신은 'Professor G', 10년간의 코퍼스, 토플, 수능 자료를 바탕으로 답변하는 영어문법전문가입니다.
중학생들이 영어 문장의 기본 뼈대(주요 성분)를 쉽게 파악하도록 돕는 친절한 선생님으로서, 
문장을 주어, 동사, 목적어, 보어, 수식어로 분해하고 텍스트 표식으로 명확히 구분해주는 것이 목표입니다."""
    
    def _load_agent_prompts(self):
        """에이전트별 프롬프트 로드"""
        self.agents = {
            'professor-g': {
                'name': 'Professor G',
                'description': '친절하고 체계적인 영어 문법 전문가',
                'personality': '친절하고 체계적이며, 문법을 명확하게 설명하는 것을 좋아합니다.',
                'style': 'formal',
                'greeting': '안녕하세요! 저는 Professor G입니다. 오늘은 어떤 문법을 함께 공부해볼까요?',
                'system_prompt': self._create_system_prompt('formal'),
                'response_templates': {
                    'grammar': '이 문법은 다음과 같이 설명할 수 있습니다:',
                    'example': '예를 들어, 다음과 같은 문장에서 볼 수 있습니다:',
                    'practice': '이제 함께 연습해보겠습니다:',
                    'encouragement': '잘하고 있습니다! 계속해서 노력해보세요.'
                }
            },
            'grammar-buddy': {
                'name': 'Grammar Buddy',
                'description': '편안하고 친근한 문법 도우미',
                'personality': '친근하고 편안하며, 학습자를 격려하고 동기부여를 잘합니다.',
                'style': 'casual',
                'greeting': '안녕! 나는 Grammar Buddy야! 오늘도 함께 재미있게 공부해보자!',
                'system_prompt': self._create_system_prompt('casual'),
                'response_templates': {
                    'grammar': '이 문법은 이렇게 생각하면 돼:',
                    'example': '예를 들어 이런 식으로 쓸 수 있어:',
                    'practice': '자, 이제 함께 해보자:',
                    'encouragement': '와! 정말 잘하고 있어! 계속 이렇게 하면 돼!'
                }
            },
            'syntax-sensei': {
                'name': 'Syntax Sensei',
                'description': '엄격하지만 효과적인 문법 마스터',
                'personality': '엄격하지만 공정하며, 정확성을 중시하고 실수를 바로잡는 것을 좋아합니다.',
                'style': 'strict',
                'greeting': '안녕하십니까. 저는 Syntax Sensei입니다. 정확한 문법 학습을 위해 준비하시기 바랍니다.',
                'system_prompt': self._create_system_prompt('strict'),
                'response_templates': {
                    'grammar': '이 문법의 정확한 규칙은 다음과 같습니다:',
                    'example': '정확한 예시를 보겠습니다:',
                    'practice': '이제 정확하게 연습해보겠습니다:',
                    'encouragement': '정확합니다. 이 정도 수준을 유지하시기 바랍니다.'
                }
            },
            'word-wizard': {
                'name': 'Word Wizard',
                'description': '창의적이고 재미있는 언어 마법사',
                'personality': '창의적이고 재미있으며, 언어의 아름다움과 창의적 사용을 강조합니다.',
                'style': 'creative',
                'greeting': '안녕하세요! 저는 Word Wizard입니다! 언어의 마법을 함께 탐험해볼까요? ✨',
                'system_prompt': self._create_system_prompt('creative'),
                'response_templates': {
                    'grammar': '이 문법은 마법의 규칙이에요! 이렇게 작동합니다:',
                    'example': '마법 같은 예시를 보세요:',
                    'practice': '이제 마법을 부려보세요:',
                    'encouragement': '와! 정말 멋진 마법이에요! 계속해서 더 멋진 마법을 만들어보세요!'
                }
            }
        }
    
    def _create_system_prompt(self, style: str) -> str:
        """스타일별 시스템 프롬프트 생성"""
        base_prompt = self.base_persona
        
        style_prompts = {
            'formal': """
응답 스타일: 정중하고 체계적으로 답변하세요. 존댓말을 사용하고, 명확한 구조로 설명하세요.
예시: "안녕하세요. 오늘은 현재완료 시제에 대해 학습해보겠습니다."
""",
            'casual': """
응답 스타일: 친근하고 편안하게 답변하세요. 반말을 사용하고, 학습자를 격려하세요.
예시: "안녕! 오늘은 현재완료 시제를 함께 공부해볼까?"
""",
            'strict': """
응답 스타일: 엄격하지만 공정하게 답변하세요. 정확성을 중시하고, 실수를 명확히 지적하세요.
예시: "현재완료 시제는 정확한 규칙이 있습니다. 집중해서 듣도록 하세요."
""",
            'creative': """
응답 스타일: 창의적이고 재미있게 답변하세요. 비유와 상상을 사용하고, 언어의 아름다움을 강조하세요.
예시: "현재완료 시제는 마법의 시간 여행자 같아요! 과거와 현재를 연결해주죠."
"""
        }
        
        return base_prompt + style_prompts.get(style, style_prompts['formal'])
    
    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """에이전트 정보 조회"""
        return self.agents.get(agent_id)
    
    def get_all_agents(self) -> Dict[str, Dict[str, Any]]:
        """모든 에이전트 정보 조회"""
        return self.agents
    
    def get_agent_system_prompt(self, agent_id: str, mode: str = 'grammar', difficulty: str = 'intermediate') -> str:
        """에이전트별 시스템 프롬프트 생성"""
        agent = self.get_agent(agent_id)
        if not agent:
            return self.base_persona
        
        system_prompt = agent['system_prompt']
        
        # 모드별 프롬프트 추가
        mode_prompts = {
            'grammar': f"\n\n문법 학습 모드입니다. {agent['name']}의 스타일로 문법 규칙을 명확하고 체계적으로 설명해주세요.",
            'sentence': f"\n\n문장 분석 모드입니다. {agent['name']}의 스타일로 문장 구조를 분석하고 설명해주세요.",
            'passage': f"\n\n지문 해석 모드입니다. {agent['name']}의 스타일로 지문을 해석하고 설명해주세요."
        }
        
        # 난이도별 프롬프트 추가
        difficulty_prompts = {
            'elementary': "\n\n초급자 수준에 맞게 쉽고 간단하게 설명해주세요.",
            'intermediate': "\n\n중급자 수준에 맞게 적절한 수준으로 설명해주세요.",
            'advanced': "\n\n고급자 수준에 맞게 심화된 내용으로 설명해주세요."
        }
        
        return system_prompt + mode_prompts.get(mode, '') + difficulty_prompts.get(difficulty, '')
    
    def get_agent_response_template(self, agent_id: str, template_type: str) -> str:
        """에이전트별 응답 템플릿 조회"""
        agent = self.get_agent(agent_id)
        if not agent:
            return ""
        
        return agent['response_templates'].get(template_type, '')
    
    def get_agent_greeting(self, agent_id: str) -> str:
        """에이전트별 인사말 조회"""
        agent = self.get_agent(agent_id)
        if not agent:
            return "안녕하세요! 오늘은 어떤 문법을 함께 공부해볼까요?"
        
        return agent['greeting']
    
    def create_custom_agent(self, agent_data: Dict[str, Any]) -> bool:
        """커스텀 에이전트 생성"""
        try:
            agent_id = agent_data.get('id')
            if not agent_id or agent_id in self.agents:
                return False
            
            # 커스텀 에이전트 생성
            self.agents[agent_id] = {
                'name': agent_data.get('name', 'Custom Agent'),
                'description': agent_data.get('description', '커스텀 에이전트'),
                'personality': agent_data.get('personality', ''),
                'style': agent_data.get('style', 'formal'),
                'greeting': agent_data.get('greeting', '안녕하세요!'),
                'system_prompt': self._create_system_prompt(agent_data.get('style', 'formal')),
                'response_templates': agent_data.get('response_templates', {})
            }
            
            # 파일에 저장
            self._save_agent_prompts()
            return True
            
        except Exception as e:
            logger.error(f"커스텀 에이전트 생성 실패: {e}")
            return False
    
    def update_agent(self, agent_id: str, updates: Dict[str, Any]) -> bool:
        """에이전트 정보 업데이트"""
        try:
            if agent_id not in self.agents:
                return False
            
            # 업데이트 적용
            self.agents[agent_id].update(updates)
            
            # 시스템 프롬프트 재생성
            if 'style' in updates:
                self.agents[agent_id]['system_prompt'] = self._create_system_prompt(updates['style'])
            
            # 파일에 저장
            self._save_agent_prompts()
            return True
            
        except Exception as e:
            logger.error(f"에이전트 업데이트 실패: {e}")
            return False
    
    def delete_agent(self, agent_id: str) -> bool:
        """에이전트 삭제 (기본 에이전트는 삭제 불가)"""
        try:
            default_agents = ['professor-g', 'grammar-buddy', 'syntax-sensei', 'word-wizard']
            if agent_id in default_agents:
                return False
            
            if agent_id in self.agents:
                del self.agents[agent_id]
                self._save_agent_prompts()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"에이전트 삭제 실패: {e}")
            return False
    
    def _save_agent_prompts(self):
        """에이전트 프롬프트를 파일에 저장"""
        try:
            self.prompts_dir.mkdir(exist_ok=True)
            agents_file = self.prompts_dir / "agents.json"
            
            with open(agents_file, 'w', encoding='utf-8') as f:
                json.dump(self.agents, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            logger.error(f"에이전트 프롬프트 저장 실패: {e}")
    
    def get_agent_statistics(self) -> Dict[str, Any]:
        """에이전트 통계 정보"""
        return {
            'total_agents': len(self.agents),
            'default_agents': 4,
            'custom_agents': len(self.agents) - 4,
            'agents_by_style': {
                style: len([a for a in self.agents.values() if a['style'] == style])
                for style in ['formal', 'casual', 'strict', 'creative']
            }
        }


class AgentService:
    """에이전트 서비스"""
    
    def __init__(self):
        self.prompt_manager = AgentPromptManager()
        self.current_agent = 'professor-g'
        self.agent_usage_stats = {}
    
    def set_current_agent(self, agent_id: str) -> bool:
        """현재 에이전트 설정"""
        if agent_id in self.prompt_manager.agents:
            self.current_agent = agent_id
            return True
        return False
    
    def get_current_agent(self) -> str:
        """현재 에이전트 조회"""
        return self.current_agent
    
    def get_agent_system_prompt(self, agent_id: str = None, mode: str = 'grammar', difficulty: str = 'intermediate') -> str:
        """에이전트별 시스템 프롬프트 조회"""
        if agent_id is None:
            agent_id = self.current_agent
        
        return self.prompt_manager.get_agent_system_prompt(agent_id, mode, difficulty)
    
    def get_agent_greeting(self, agent_id: str = None) -> str:
        """에이전트별 인사말 조회"""
        if agent_id is None:
            agent_id = self.current_agent
        
        return self.prompt_manager.get_agent_greeting(agent_id)
    
    def record_agent_usage(self, agent_id: str):
        """에이전트 사용 통계 기록"""
        if agent_id not in self.agent_usage_stats:
            self.agent_usage_stats[agent_id] = 0
        self.agent_usage_stats[agent_id] += 1
    
    def get_agent_usage_stats(self) -> Dict[str, int]:
        """에이전트 사용 통계 조회"""
        return self.agent_usage_stats.copy()
    
    def get_all_agents(self) -> Dict[str, Dict[str, Any]]:
        """모든 에이전트 정보 조회"""
        return self.prompt_manager.get_all_agents()
    
    def create_custom_agent(self, agent_data: Dict[str, Any]) -> bool:
        """커스텀 에이전트 생성"""
        return self.prompt_manager.create_custom_agent(agent_data)
    
    def update_agent(self, agent_id: str, updates: Dict[str, Any]) -> bool:
        """에이전트 정보 업데이트"""
        return self.prompt_manager.update_agent(agent_id, updates)
    
    def delete_agent(self, agent_id: str) -> bool:
        """에이전트 삭제"""
        return self.prompt_manager.delete_agent(agent_id)
    
    def get_agent_statistics(self) -> Dict[str, Any]:
        """에이전트 통계 정보"""
        stats = self.prompt_manager.get_agent_statistics()
        stats['usage_stats'] = self.get_agent_usage_stats()
        stats['current_agent'] = self.current_agent
        return stats


# 전역 인스턴스
agent_service = AgentService()
