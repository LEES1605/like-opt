"""
에이전트 API
에이전트 선택, 프롬프트 관리, 통계 조회 API
"""

from flask import Blueprint, request, jsonify, session
from typing import Dict, Any

# from ..services.agent_service import agent_service

# 에이전트 API 블루프린트
agent_bp = Blueprint('agent', __name__)

@agent_bp.route('/agents', methods=['GET'])
def get_agents():
    """
    모든 에이전트 정보 조회
    
    Returns:
        {
            "success": true,
            "agents": {...},
            "current_agent": "professor-g"
        }
    """
    try:
        # 임시 테스트 응답
        return jsonify({
            'success': True,
            'agents': [
                {
                    "id": "professor_g",
                    "name": "Professor G",
                    "description": "친절하고 체계적인 문법 전문가",
                    "style": "formal"
                }
            ],
            'current_agent': "professor_g"
        })
        
    except Exception as e:
        print(f"[Agent API] 에이전트 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'에이전트 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@agent_bp.route('/agents/<agent_id>', methods=['GET'])
def get_agent(agent_id: str):
    """
    특정 에이전트 정보 조회
    
    Args:
        agent_id: 에이전트 ID
    
    Returns:
        {
            "success": true,
            "agent": {...}
        }
    """
    try:
        agent = agent_service.prompt_manager.get_agent(agent_id)
        
        if not agent:
            return jsonify({
                'success': False,
                'error': '에이전트를 찾을 수 없습니다.'
            }), 404
        
        return jsonify({
            'success': True,
            'agent': agent
        })
        
    except Exception as e:
        print(f"[Agent API] 에이전트 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'에이전트 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@agent_bp.route('/agents/current', methods=['GET'])
def get_current_agent():
    """
    현재 선택된 에이전트 조회
    
    Returns:
        {
            "success": true,
            "current_agent": "professor-g",
            "agent": {...}
        }
    """
    try:
        current_agent_id = agent_service.get_current_agent()
        agent = agent_service.prompt_manager.get_agent(current_agent_id)
        
        return jsonify({
            'success': True,
            'current_agent': current_agent_id,
            'agent': agent
        })
        
    except Exception as e:
        print(f"[Agent API] 현재 에이전트 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'현재 에이전트 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@agent_bp.route('/agents/current', methods=['POST'])
def set_current_agent():
    """
    현재 에이전트 설정
    
    Request Body:
        {
            "agent_id": "professor-g"
        }
    
    Returns:
        {
            "success": true,
            "message": "에이전트가 변경되었습니다.",
            "current_agent": "professor-g"
        }
    """
    try:
        data = request.get_json() or {}
        agent_id = data.get('agent_id', '').strip()
        
        if not agent_id:
            return jsonify({
                'success': False,
                'error': '에이전트 ID가 필요합니다.'
            }), 400
        
        # 에이전트 존재 확인
        agent = agent_service.prompt_manager.get_agent(agent_id)
        if not agent:
            return jsonify({
                'success': False,
                'error': '존재하지 않는 에이전트입니다.'
            }), 404
        
        # 현재 에이전트 설정
        success = agent_service.set_current_agent(agent_id)
        
        if success:
            # 사용 통계 기록
            agent_service.record_agent_usage(agent_id)
            
            return jsonify({
                'success': True,
                'message': f'에이전트가 {agent["name"]}으로 변경되었습니다.',
                'current_agent': agent_id,
                'agent': agent
            })
        else:
            return jsonify({
                'success': False,
                'error': '에이전트 설정에 실패했습니다.'
            }), 500
        
    except Exception as e:
        print(f"[Agent API] 에이전트 설정 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'에이전트 설정 중 오류가 발생했습니다: {str(e)}'
        }), 500


@agent_bp.route('/agents/<agent_id>/prompt', methods=['GET'])
def get_agent_prompt(agent_id: str):
    """
    에이전트별 시스템 프롬프트 조회
    
    Args:
        agent_id: 에이전트 ID
    
    Query Parameters:
        mode: 학습 모드 (grammar, sentence, passage)
        difficulty: 난이도 (elementary, intermediate, advanced)
    
    Returns:
        {
            "success": true,
            "prompt": "...",
            "agent": {...}
        }
    """
    try:
        mode = request.args.get('mode', 'grammar')
        difficulty = request.args.get('difficulty', 'intermediate')
        
        # 에이전트 존재 확인
        agent = agent_service.prompt_manager.get_agent(agent_id)
        if not agent:
            return jsonify({
                'success': False,
                'error': '존재하지 않는 에이전트입니다.'
            }), 404
        
        # 시스템 프롬프트 생성
        prompt = agent_service.get_agent_system_prompt(agent_id, mode, difficulty)
        
        return jsonify({
            'success': True,
            'prompt': prompt,
            'agent': agent,
            'mode': mode,
            'difficulty': difficulty
        })
        
    except Exception as e:
        print(f"[Agent API] 프롬프트 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'프롬프트 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@agent_bp.route('/agents/<agent_id>/greeting', methods=['GET'])
def get_agent_greeting(agent_id: str):
    """
    에이전트별 인사말 조회
    
    Args:
        agent_id: 에이전트 ID
    
    Returns:
        {
            "success": true,
            "greeting": "...",
            "agent": {...}
        }
    """
    try:
        # 에이전트 존재 확인
        agent = agent_service.prompt_manager.get_agent(agent_id)
        if not agent:
            return jsonify({
                'success': False,
                'error': '존재하지 않는 에이전트입니다.'
            }), 404
        
        # 인사말 조회
        greeting = agent_service.get_agent_greeting(agent_id)
        
        return jsonify({
            'success': True,
            'greeting': greeting,
            'agent': agent
        })
        
    except Exception as e:
        print(f"[Agent API] 인사말 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'인사말 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@agent_bp.route('/agents', methods=['POST'])
def create_agent():
    """
    커스텀 에이전트 생성
    
    Request Body:
        {
            "id": "custom-agent",
            "name": "Custom Agent",
            "description": "커스텀 에이전트",
            "personality": "성격 설명",
            "style": "formal",
            "greeting": "인사말",
            "response_templates": {...}
        }
    
    Returns:
        {
            "success": true,
            "message": "에이전트가 생성되었습니다.",
            "agent": {...}
        }
    """
    try:
        data = request.get_json() or {}
        
        # 필수 필드 확인
        required_fields = ['id', 'name', 'description', 'personality', 'style']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'error': f'{field} 필드가 필요합니다.'
                }), 400
        
        # 에이전트 생성
        success = agent_service.create_custom_agent(data)
        
        if success:
            agent = agent_service.prompt_manager.get_agent(data['id'])
            return jsonify({
                'success': True,
                'message': '에이전트가 생성되었습니다.',
                'agent': agent
            })
        else:
            return jsonify({
                'success': False,
                'error': '에이전트 생성에 실패했습니다.'
            }), 500
        
    except Exception as e:
        print(f"[Agent API] 에이전트 생성 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'에이전트 생성 중 오류가 발생했습니다: {str(e)}'
        }), 500


@agent_bp.route('/agents/<agent_id>', methods=['PUT'])
def update_agent(agent_id: str):
    """
    에이전트 정보 업데이트
    
    Args:
        agent_id: 에이전트 ID
    
    Request Body:
        {
            "name": "Updated Name",
            "description": "Updated Description",
            ...
        }
    
    Returns:
        {
            "success": true,
            "message": "에이전트가 업데이트되었습니다.",
            "agent": {...}
        }
    """
    try:
        data = request.get_json() or {}
        
        # 에이전트 존재 확인
        agent = agent_service.prompt_manager.get_agent(agent_id)
        if not agent:
            return jsonify({
                'success': False,
                'error': '존재하지 않는 에이전트입니다.'
            }), 404
        
        # 에이전트 업데이트
        success = agent_service.update_agent(agent_id, data)
        
        if success:
            updated_agent = agent_service.prompt_manager.get_agent(agent_id)
            return jsonify({
                'success': True,
                'message': '에이전트가 업데이트되었습니다.',
                'agent': updated_agent
            })
        else:
            return jsonify({
                'success': False,
                'error': '에이전트 업데이트에 실패했습니다.'
            }), 500
        
    except Exception as e:
        print(f"[Agent API] 에이전트 업데이트 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'에이전트 업데이트 중 오류가 발생했습니다: {str(e)}'
        }), 500


@agent_bp.route('/agents/<agent_id>', methods=['DELETE'])
def delete_agent(agent_id: str):
    """
    에이전트 삭제
    
    Args:
        agent_id: 에이전트 ID
    
    Returns:
        {
            "success": true,
            "message": "에이전트가 삭제되었습니다."
        }
    """
    try:
        # 에이전트 존재 확인
        agent = agent_service.prompt_manager.get_agent(agent_id)
        if not agent:
            return jsonify({
                'success': False,
                'error': '존재하지 않는 에이전트입니다.'
            }), 404
        
        # 에이전트 삭제
        success = agent_service.delete_agent(agent_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': '에이전트가 삭제되었습니다.'
            })
        else:
            return jsonify({
                'success': False,
                'error': '기본 에이전트는 삭제할 수 없습니다.'
            }), 400
        
    except Exception as e:
        print(f"[Agent API] 에이전트 삭제 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'에이전트 삭제 중 오류가 발생했습니다: {str(e)}'
        }), 500


@agent_bp.route('/agents/statistics', methods=['GET'])
def get_agent_statistics():
    """
    에이전트 통계 정보 조회
    
    Returns:
        {
            "success": true,
            "statistics": {...}
        }
    """
    try:
        statistics = agent_service.get_agent_statistics()
        
        return jsonify({
            'success': True,
            'statistics': statistics
        })
        
    except Exception as e:
        print(f"[Agent API] 통계 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'통계 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500
