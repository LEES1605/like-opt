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
from flask_socketio import SocketIO

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
    
    # WebSocket 초기화
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')
    app.socketio = socketio
    
    # 블루프린트 등록
    register_blueprints(app)
    
    # WebSocket 서비스 초기화
    from .services.websocket_service import initialize_websocket_service
    initialize_websocket_service(socketio)
    
    # 에러 핸들러 등록
    register_error_handlers(app)
    
    # Static 라우트 등록
    register_static_routes(app)
    
    return app

def register_blueprints(app):
    """블루프린트 등록"""
    try:
        # 메인 API 블루프린트
        from .api import api_bp
        app.register_blueprint(api_bp, url_prefix='/api/v1')
        
        # 채팅 API 블루프린트
        from .api.chat import chat_bp
        app.register_blueprint(chat_bp, url_prefix='/api/v1')
        
        # 관리자 블루프린트
        from .api.admin import admin_bp
        app.register_blueprint(admin_bp, url_prefix='/api/v1/admin')
        
        # 에이전트 블루프린트
        from .api.agent import agent_bp
        app.register_blueprint(agent_bp, url_prefix='/api/v1')
        
        # WebSocket 블루프린트
        from .api.websocket import websocket_bp
        app.register_blueprint(websocket_bp, url_prefix='/api/v1')
        
        # 백업 블루프린트
        from .api.backup import backup_bp
        app.register_blueprint(backup_bp, url_prefix='/api/v1')
        
        # 인증 블루프린트 (향후 구현)
        # from .api.auth import auth_bp
        # app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
        
        print("Blueprints registered successfully")
        
    except ImportError as e:
        print(f"Blueprint registration error (may be in development): {e}")

def register_static_routes(app):
    """Static 파일 라우트 등록"""
    
    @app.route('/')
    def index():
        """메인 페이지"""
        return app.send_static_file('medal-demo.html')
    
    @app.route('/medal-demo')
    def medal_demo():
        """메달 데모 페이지"""
        return app.send_static_file('medal-demo.html')
    
    @app.route('/chat-test')
    def chat_test():
        """AI 채팅 테스트 페이지"""
        return app.send_static_file('chat-test.html')
    
    @app.route('/chat-advanced')
    def chat_advanced():
        """고급 AI 채팅 페이지 (인스타 스타일)"""
        return app.send_static_file('chat-advanced.html')
    
    @app.route('/chat-mobile')
    def chat_mobile():
        """모바일 최적화 AI 채팅 페이지"""
        return app.send_static_file('chat-mobile.html')
    
    @app.route('/maic-complete')
    def maic_complete():
        """MAIC-Flask 완전 구현 페이지 (학생모드 + 관리자모드)"""
        return app.send_static_file('maic-complete.html')

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
