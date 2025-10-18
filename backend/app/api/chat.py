"""
MAIC Flask Optimized - Chat API

AI 채팅 관련 API 엔드포인트
"""

from flask import Blueprint, request, jsonify, session
from typing import Dict, Any

from ..services.chat_service import chat_service
from ..services.rag_service import rag_service
from ..services.ai_service import ai_service, AIProvider
from ..services.advanced_rag_service import get_advanced_rag_service

# 채팅 API 블루프린트
chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat', methods=['POST'])
def chat():
    """
    AI 채팅 API
    
    Request Body:
        {
            "message": "사용자 메시지",
            "mode": "grammar|sentence|passage",
            "difficulty": "elementary|intermediate|advanced",
            "provider": "openai|gemini",
            "stream": false
        }
    
    Returns:
        {
            "success": true,
            "response": "AI 응답",
            "conversation": [...],
            "provider": "openai"
        }
    """
    try:
        data = request.get_json() or {}
        message = data.get('message', '').strip()
        mode = data.get('mode', 'grammar')
        difficulty = data.get('difficulty', 'intermediate')
        provider = data.get('provider', 'openai')
        use_stream = data.get('stream', False)
        
        # 입력 검증
        if not message:
            return jsonify({
                'success': False,
                'error': '메시지를 입력해주세요.'
            }), 400
        
        # 사용자 메시지 추가
        chat_service.add_message('user', message)
        
        # AI 응답 생성
        response = _generate_ai_response(message, mode, difficulty, provider, use_stream)
        
        # AI 응답을 대화에 추가
        chat_service.add_message('assistant', response)
        
        # 대화 기록 가져오기
        conversation = chat_service.get_conversation_for_ai()
        
        return jsonify({
            'success': True,
            'response': response,
            'conversation': conversation,
            'provider': provider,
            'mode': mode,
            'difficulty': difficulty
        })
        
    except Exception as e:
        print(f"[Chat API] 오류: {e}")
        return jsonify({
            'success': False,
            'error': 'AI 응답 생성 중 오류가 발생했습니다.'
        }), 500

@chat_bp.route('/conversation', methods=['GET'])
def get_conversation():
    """
    대화 기록 조회 API
    
    Returns:
        {
            "success": true,
            "conversation": [...],
            "message_count": 10
        }
    """
    try:
        conversation = chat_service.get_conversation_for_ai()
        
        return jsonify({
            'success': True,
            'conversation': conversation,
            'message_count': len(conversation)
        })
        
    except Exception as e:
        print(f"[Conversation API] 오류: {e}")
        return jsonify({
            'success': False,
            'error': '대화 기록 조회 중 오류가 발생했습니다.'
        }), 500

@chat_bp.route('/conversation', methods=['DELETE'])
def clear_conversation():
    """
    대화 기록 초기화 API
    
    Returns:
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
        print(f"[Clear Conversation API] 오류: {e}")
        return jsonify({
            'success': False,
            'error': '대화 기록 초기화 중 오류가 발생했습니다.'
        }), 500

@chat_bp.route('/mode', methods=['POST'])
def set_mode():
    """
    학습 모드 설정 API
    
    Request Body:
        {
            "mode": "grammar|sentence|passage",
            "difficulty": "elementary|intermediate|advanced"
        }
    
    Returns:
        {
            "success": true,
            "mode": "grammar",
            "difficulty": "intermediate"
        }
    """
    try:
        data = request.get_json() or {}
        mode = data.get('mode', 'grammar')
        difficulty = data.get('difficulty', 'intermediate')
        
        # 세션에 모드 저장
        session['learning_mode'] = mode
        session['difficulty'] = difficulty
        
        return jsonify({
            'success': True,
            'mode': mode,
            'difficulty': difficulty
        })
        
    except Exception as e:
        print(f"[Mode API] 오류: {e}")
        return jsonify({
            'success': False,
            'error': '모드 설정 중 오류가 발생했습니다.'
        }), 500

def _generate_ai_response(
    message: str, 
    mode: str, 
    difficulty: str, 
    provider: str,
    use_stream: bool = False
) -> str:
    """
    AI 응답 생성 헬퍼 함수
    
    Args:
        message: 사용자 메시지
        mode: 학습 모드
        difficulty: 난이도
        provider: AI 제공자
        use_stream: 스트리밍 사용 여부
        
    Returns:
        str: AI 응답
    """
    try:
        # RAG 컨텍스트 생성
        rag_context = None
        if rag_service.is_index_ready():
            rag_context = rag_service.get_context_for_query(message, max_chunks=3)
        
        # 시스템 프롬프트 생성
        system_prompt = _create_system_prompt(mode, difficulty)
        
        # 사용자 프롬프트 생성
        user_prompt = message
        if rag_context:
            user_prompt = f"{rag_context}\n\n{user_prompt}"
        
        # 대화 형식으로 메시지 구성
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt}
        ]
        
        # AI 응답 생성
        if use_stream:
            # 스트리밍 응답 (현재는 단일 응답으로 처리)
            response_chunks = []
            for chunk in ai_service.stream_response(messages, provider):
                response_chunks.append(chunk)
            response = ''.join(response_chunks)
        else:
            response = ai_service.generate_response(messages, provider)
        
        return response
        
    except Exception as e:
        print(f"[AI Response] 오류: {e}")
        return "죄송합니다. AI 응답 생성 중 오류가 발생했습니다."

def _create_system_prompt(mode: str, difficulty: str) -> str:
    """
    모드별 시스템 프롬프트 생성
    
    Args:
        mode: 학습 모드
        difficulty: 난이도
        
    Returns:
        str: 시스템 프롬프트
    """
    base_prompt = """당신은 'Professor G', 10년간의 코퍼스, 토플, 수능 자료를 바탕으로 답변하는 영어문법전문가입니다.
중학생들이 영어 문장의 기본 뼈대(주요 성분)를 쉽게 파악하도록 돕는 친절한 선생님으로서, 
문장을 주어, 동사, 목적어, 보어, 수식어로 분해하고 텍스트 표식으로 명확히 구분해주는 것이 목표입니다."""
    
    mode_prompts = {
        'grammar': "문법 학습 모드입니다. 문법 규칙을 명확하고 체계적으로 설명해주세요.",
        'sentence': "문장 분석 모드입니다. 문장 구조를 자세히 분석하고 설명해주세요.",
        'passage': "지문 설명 모드입니다. 지문의 내용을 이해하기 쉽게 설명해주세요."
    }
    
    difficulty_prompts = {
        'elementary': "초급 수준에 맞게 쉽고 간단하게 설명해주세요.",
        'intermediate': "중급 수준에 맞게 적절한 난이도로 설명해주세요.",
        'advanced': "고급 수준에 맞게 심화된 내용으로 설명해주세요."
    }
    
    mode_prompt = mode_prompts.get(mode, "")
    difficulty_prompt = difficulty_prompts.get(difficulty, "")
    
    return f"{base_prompt}\n\n{mode_prompt}\n{difficulty_prompt}"


@chat_bp.route('/search/advanced', methods=['POST'])
async def advanced_search():
    """
    고급 RAG 검색 API
    
    Request Body:
        {
            "query": "검색 쿼리",
            "top_k": 10,
            "alpha": 0.5,
            "use_rerank": true
        }
    
    Returns:
        {
            "success": true,
            "results": [...],
            "stats": {...}
        }
    """
    try:
        data = request.get_json() or {}
        query = data.get('query', '').strip()
        top_k = data.get('top_k', 10)
        alpha = data.get('alpha', 0.5)
        use_rerank = data.get('use_rerank', True)
        
        # 입력 검증
        if not query:
            return jsonify({
                'success': False,
                'error': '검색 쿼리가 비어있습니다.'
            }), 400
        
        # 고급 RAG 서비스 가져오기
        advanced_rag = await get_advanced_rag_service()
        
        # 하이브리드 검색 실행
        results = await advanced_rag.hybrid_search(
            query=query,
            top_k=top_k,
            alpha=alpha,
            use_rerank=use_rerank
        )
        
        # 결과 변환
        search_results = []
        for result in results:
            search_results.append({
                'doc_id': result.doc_id,
                'chunk_id': result.chunk_id,
                'score': result.score,
                'bm25_score': result.bm25_score,
                'vector_score': result.vector_score,
                'text': result.text,
                'title': result.title,
                'source': result.source,
                'search_type': result.search_type,
                'metadata': result.metadata
            })
        
        # 통계 정보
        stats = await advanced_rag.get_search_stats()
        
        return jsonify({
            'success': True,
            'results': search_results,
            'stats': stats,
            'query': query,
            'total_results': len(search_results)
        })
        
    except Exception as e:
        print(f"[Advanced Search] 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'고급 검색 중 오류가 발생했습니다: {str(e)}'
        }), 500


@chat_bp.route('/search/stats', methods=['GET'])
async def search_stats():
    """
    검색 통계 API
    
    Returns:
        {
            "success": true,
            "stats": {...}
        }
    """
    try:
        # 고급 RAG 서비스 가져오기
        advanced_rag = await get_advanced_rag_service()
        
        # 통계 정보
        stats = await advanced_rag.get_search_stats()
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        print(f"[Search Stats] 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'통계 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@chat_bp.route('/search/optimize', methods=['POST'])
async def optimize_search():
    """
    검색 인덱스 최적화 API
    
    Returns:
        {
            "success": true,
            "message": "인덱스 최적화가 완료되었습니다."
        }
    """
    try:
        # 고급 RAG 서비스 가져오기
        advanced_rag = await get_advanced_rag_service()
        
        # 인덱스 최적화 실행
        await advanced_rag.optimize_index()
        
        return jsonify({
            'success': True,
            'message': '인덱스 최적화가 완료되었습니다.'
        })
        
    except Exception as e:
        print(f"[Optimize Search] 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'인덱스 최적화 중 오류가 발생했습니다: {str(e)}'
        }), 500
