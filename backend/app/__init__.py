"""
MAIC Flask Optimized - Flask Application Factory

이 모듈은 Flask 애플리케이션 팩토리 패턴을 구현합니다.
환경별 설정, 확장 초기화, 블루프린트 등록을 담당합니다.
"""

import os
from pathlib import Path
from flask import Flask
from flask_session import Session
from flask_compress import Compress
from flask_cors import CORS

from .config import Config

def create_app(config_class=Config):
    """
    Flask 애플리케이션 팩토리
    
    Args:
        config_class: 설정 클래스
        
    Returns:
        Flask: 구성된 Flask 애플리케이션
    """
    
    # Flask 앱 생성
    app = Flask(
        __name__,
        template_folder=str(Path(__file__).parent / 'templates'),
        static_folder=str(Path(__file__).parent / 'static')
    )
    
    # 설정 로드
    app.config.from_object(config_class)
    
    # 확장 초기화
    Session(app)
    Compress(app)
    CORS(app, origins=app.config.get('CORS_ORIGINS', ['*']))
    
    # 블루프린트 등록
    register_blueprints(app)
    
    # 에러 핸들러 등록
    register_error_handlers(app)
    
    return app

def register_blueprints(app):
    """블루프린트 등록"""
    try:
        # API 블루프린트
        from .api import api_bp
        app.register_blueprint(api_bp, url_prefix='/api/v1')
        
        # 관리자 블루프린트
        from .api.admin import admin_bp
        app.register_blueprint(admin_bp, url_prefix='/api/v1/admin')
        
        # 인증 블루프린트
        from .api.auth import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
        
        print("✅ 블루프린트 등록 완료")
        
    except ImportError as e:
        print(f"⚠️ 블루프린트 등록 중 오류 (개발 중일 수 있음): {e}")

def register_error_handlers(app):
    """에러 핸들러 등록"""
    
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not Found', 'message': '요청한 리소스를 찾을 수 없습니다.'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal Server Error', 'message': '서버 내부 오류가 발생했습니다.'}, 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return {'error': 'Bad Request', 'message': '잘못된 요청입니다.'}, 400
