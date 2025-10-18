"""
API 엔드포인트 라우트
채팅, 세션 등 API 기능 제공
"""
from flask import Blueprint, request, jsonify, Response
from typing import Any

from ..services.chat_service import chat_service
from ..services.session_adapter import session_adapter
from .agent import agent_bp

# AI 클라이언트는 선택적으로 import (없어도 동작)
try:
    from ..services.ai_service import AIClient
    _ai_client = AIClient()
except Exception:
    _ai_client = None  # type: ignore[assignment]

# RAG 및 프롬프트 시스템 (Optional)
try:
    from ..services.rag_service import rag_service
    answer_stream = None  # 향후 구현
except Exception as e:
    print(f"[API] RAG/Prompting modules not available: {e}")
    answer_stream = None  # type: ignore[assignment]

api_bp = Blueprint('api', __name__)


@api_bp.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "MAIC Flask Optimized API is running",
        "version": "1.0.0"
    })


@api_bp.route('/chat', methods=['POST'])
def chat():
    """
    채팅 메시지 전송 및 AI 응답 수신 (RAG + 커스텀 프롬프트)
    스트리밍 응답 지원
    
    Request Body:
        {
            "message": "사용자 메시지",
            "mode": "grammar|reading|writing|speaking",
            "stream": true|false (선택, 기본값: true)
        }
    
    Response (stream=false):
        {
            "success": true,
            "response": "AI 응답",
            "mode": "grammar"
        }
    
    Response (stream=true):
        Server-Sent Events 형식으로 스트리밍
    """
    try:
        data = request.get_json() or {}
        message = data.get('message', '').strip()
        mode = data.get('mode', 'grammar')
        difficulty = str(data.get('difficulty', '') or '').strip() or None
        use_stream = data.get('stream', False)  # 기본적으로 전체 응답 사용
        
        if not message:
            return jsonify({
                'success': False,
                'error': '메시지를 입력해주세요.'
            }), 400
        
        # 사용자 메시지 저장
        chat_service.add_message('user', message)
        
        # Professor G 프롬프트 활성화 상태 확인
        professor_g_enabled = session_adapter.get('professor_g_enabled', True)  # 기본값: 활성화
        rag_modules_loaded = session_adapter.get('rag_modules_loaded', False)
        
        print(f"[API] Professor G 활성화: {professor_g_enabled}, RAG 모듈 로드: {rag_modules_loaded}")

        # 모드 정규화: 레거시 별칭을 정식 모드로 매핑
        try:
            from ..services.modes.types import Mode as _Mode
            mode = _Mode.from_str(mode).value
        except Exception:
            mode = 'grammar'
        
        # 온도 설정 가져오기 (모드별)
        temperature_config = session_adapter.get('ai_temperature_config', {})
        
        # 새로운 온도 설정 시스템 사용
        from ..config.temperature_config import get_optimal_temperature
        
        # AI 제공자 확인
        current_provider = session_adapter.get('ai_provider', 'gemini')
        
        # 최적 온도 계산
        temperature = get_optimal_temperature(mode, difficulty, current_provider)
        
        # 기존 설정이 있으면 우선 사용 (사용자가 수동으로 설정한 경우)
        if mode == 'sentence' and difficulty:
            difficulty_map = {
                'elementary': 'elementary',
                'intermediate': 'intermediate', 
                'advanced': 'advanced'
            }
            difficulty_key = difficulty_map.get(difficulty, 'intermediate')
            manual_temp = temperature_config.get('sentence', {}).get(difficulty_key)
            if manual_temp is not None:
                temperature = manual_temp
        else:
            manual_temp = temperature_config.get(mode)
            if manual_temp is not None:
                temperature = manual_temp
        
        # 모드별 AI 제공자 결정 (최적화된 설정)
        mode_provider = None
        if mode in ['grammar', 'sentence', 'passage']:
            # 모드별 최적 AI 제공자 설정
            optimal_providers = {
                'grammar': 'gemini',   # 문법학습: Gemini (더 창의적인 설명)
                'sentence': 'gemini',  # 문장분석: Gemini (일관된 분석)
                'passage': 'gemini'    # 지문설명: Gemini (이해하기 쉬운 설명)
            }
            
            default_provider = optimal_providers.get(mode, 'gemini')
            mode_provider = session_adapter.get(f'ai_provider_{mode}', default_provider)
            print(f"[API] {mode} 모드 AI 제공자: {mode_provider} (최적: {default_provider})")
        
        # RAG 설정 확인 (모드별)
        rag_config = session_adapter.get('ai_rag_config', {})
        # 각 모드별 기본값 설정
        default_rag_settings = {
            'grammar': True,    # 문법학습: 기본 활성화
            'sentence': False,  # 문장분석: 기본 비활성화
            'passage': True     # 지문설명: 기본 활성화
        }
        
        # 사용자 설정이 있으면 사용, 없으면 기본값 사용
        rag_enabled = rag_config.get(mode, default_rag_settings.get(mode, True))
        
        print(f"[API] 모드: {mode}, 난이도: {difficulty}, 온도: {temperature}, RAG: {rag_enabled}")
        
        # 스트리밍 응답 생성기
        def generate_streaming_response():
            ai_response_parts = []
            
            # 방법 1: 커스텀 프롬프트 + RAG (responder 사용)
            if (answer_stream is not None):
                try:
                    print(f"[API] Using answer_stream with mode={mode}, temperature={temperature}, difficulty={difficulty}")
                    
                    # 컨텍스트에 온도 추가
                    ctx = {'difficulty': difficulty} if difficulty else {}
                    ctx['temperature'] = temperature
                    
                    # responder.answer_stream() 사용 (Generator)
                    response_gen = answer_stream(question=message, mode=mode, ctx=ctx)
                    
                    for chunk in response_gen:
                        if chunk:
                            ai_response_parts.append(chunk)
                            yield f"data: {chunk}\n\n"
                    
                    print(f"[API] answer_stream completed, total length: {sum(len(p) for p in ai_response_parts)}")
                    
                except Exception as e:
                    print(f"[API] answer_stream 실패: {e}")
                    import traceback
                    traceback.print_exc()
                    error_msg = f"오류가 발생했습니다: {str(e)}"
                    ai_response_parts.append(error_msg)
                    yield f"data: {error_msg}\n\n"
            
            # 응답이 없으면 폴백 메시지
            if not ai_response_parts:
                fallback_msg = f"[{mode} 모드] AI 서비스가 설정되지 않았습니다."
                ai_response_parts.append(fallback_msg)
                yield f"data: {fallback_msg}\n\n"
            
            # 완료 메시지
            yield "data: [DONE]\n\n"
            
            # AI 응답 저장 (전체 응답)
            full_response = ''.join(ai_response_parts)
            chat_service.add_message('assistant', full_response)
        
        # 스트리밍 vs 일반 응답
        if use_stream:
            return Response(
                generate_streaming_response(),
                mimetype='text/event-stream',
                headers={
                    'Cache-Control': 'no-cache',
                    'X-Accel-Buffering': 'no'
                }
            )
        else:
            # 일반 응답 (기존 방식)
            ai_response = None
            
            if (answer_stream is not None):
                try:
                    print(f"[API] Using answer_stream (non-stream mode)")
                    
                    ctx = {'difficulty': difficulty} if difficulty else {}
                    ctx['temperature'] = temperature
                    
                    response_gen = answer_stream(question=message, mode=mode, ctx=ctx)
                    ai_response = ''.join(response_gen)
                    print(f"[API] answer_stream response length: {len(ai_response)}")
                except Exception as e:
                    print(f"[API] answer_stream 실패: {e}")
                    import traceback
                    traceback.print_exc()
            
            if not ai_response:
                ai_response = f"[{mode} 모드] AI 서비스가 설정되지 않았습니다."
            
            # AI 응답 저장
            chat_service.add_message('assistant', ai_response)
            
            return jsonify({
                'success': True,
                'response': ai_response,
                'mode': mode
            })
        
    except Exception as e:
        print(f"[API] 채팅 API 오류: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '서버 오류가 발생했습니다.'
        }), 500


@api_bp.route('/session', methods=['GET'])
def get_session():
    """
    현재 세션 정보 조회
    
    Response:
        {
            "authenticated": false,
            "user_role": "student",
            "current_mode": "grammar"
        }
    """
    return jsonify({
        'authenticated': session_adapter.get('authenticated', False),
        'user_role': session_adapter.get('user_role', 'student'),
        'current_mode': session_adapter.get('current_mode', 'grammar')
    })


@api_bp.route('/conversation', methods=['GET'])
def get_conversation():
    """
    대화 기록 조회
    
    Response:
        {
            "success": true,
            "messages": [
                {"role": "user", "content": "...", "timestamp": "..."},
                {"role": "assistant", "content": "...", "timestamp": "..."}
            ]
        }
    """
    try:
        conversation = chat_service.get_conversation()
        messages = [msg.to_dict() for msg in conversation]
        
        return jsonify({
            'success': True,
            'messages': messages
        })
    except Exception as e:
        print(f"대화 기록 조회 오류: {e}")
        return jsonify({
            'success': False,
            'error': '대화 기록을 불러올 수 없습니다.'
        }), 500


@api_bp.route('/conversation', methods=['DELETE'])
def clear_conversation():
    """
    대화 기록 초기화
    
    Response:
        {
            "success": true,
            "message": "대화 기록이 초기화되었습니다."
        }
    """
    try:
        chat_service.clear_conversation()
        return jsonify({
            'success': True,
            'message': '대화 기록이 초기화되었습니다.'
        })
    except Exception as e:
        print(f"대화 기록 초기화 오류: {e}")
        return jsonify({
            'success': False,
            'error': '대화 기록 초기화에 실패했습니다.'
        }), 500


@api_bp.route('/mode', methods=['POST'])
def set_mode():
    """
    학습 모드 설정
    
    Request Body:
        {
            "mode": "grammar|reading|writing|speaking"
        }
    
    Response:
        {
            "success": true,
            "mode": "grammar"
        }
    """
    try:
        data = request.get_json() or {}
        mode = data.get('mode', 'grammar')
        
        # 레거시 문자열도 허용: from_str로 검증
        try:
            from ..services.modes.types import Mode as _Mode
            normalized = _Mode.from_str(mode).value
        except Exception:
            return jsonify({
                'success': False,
                'error': '유효하지 않은 모드입니다. 사용 가능: grammar, sentence, passage'
            }), 400
        
        session_adapter.set('current_mode', normalized)
        
        return jsonify({
            'success': True,
            'mode': normalized
        })
    except Exception as e:
        print(f"모드 설정 오류: {e}")
        return jsonify({
            'success': False,
            'error': '모드 설정에 실패했습니다.'
        }), 500

