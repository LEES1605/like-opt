"""
MAIC Flask Optimized - API Blueprint

API 관련 블루프린트들을 정의합니다.
"""

from flask import Blueprint

# 메인 API 블루프린트
api_bp = Blueprint('api', __name__)

@api_bp.route('/health')
def health_check():
    """헬스 체크 엔드포인트"""
    return {
        'status': 'healthy',
        'message': 'MAIC Flask Optimized API is running',
        'version': '1.0.0'
    }

@api_bp.route('/')
def api_info():
    """API 정보 엔드포인트"""
    return {
        'name': 'MAIC Flask Optimized API',
        'version': '1.0.0',
        'description': 'AI-powered English learning platform API',
        'endpoints': {
            'health': '/api/v1/health',
            'admin': '/api/v1/admin/*',
            'auth': '/api/v1/auth/*',
            'chat': '/api/v1/chat/*'
        }
    }
