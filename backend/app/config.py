"""
Like-Opt - Configuration Settings

환경별 설정을 관리하는 모듈입니다.
개발, 테스트, 프로덕션 환경에 따른 설정을 제공합니다.
"""

import os
from pathlib import Path

class Config:
    """기본 설정 클래스"""
    
    # 프로젝트 루트 경로
    PROJECT_ROOT = Path(__file__).parent.parent.parent
    
    # Flask 기본 설정
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'like-opt-secret-key-2024'
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # 서버 설정
    HOST = os.environ.get('HOST', '127.0.0.1')
    PORT = int(os.environ.get('PORT', 5001))
    
    # 세션 설정
    SESSION_TYPE = 'filesystem'
    SESSION_PERMANENT = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False
    PERMANENT_SESSION_LIFETIME = 86400  # 24시간
    SESSION_FILE_DIR = str(PROJECT_ROOT / '.flask_session')
    
    # 파일 업로드 설정
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = str(PROJECT_ROOT / 'uploads')
    
    # CSRF 설정
    WTF_CSRF_ENABLED = False
    
    # CORS 설정
    CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']
    
    # 데이터베이스 설정
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f'sqlite:///{PROJECT_ROOT / "like.db"}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # AI 설정
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    
    # RAG 설정
    RAG_PERSIST_DIR = str(PROJECT_ROOT / '.like' / 'persist')
    CHROMA_PERSIST_DIR = str(PROJECT_ROOT / '.like' / 'chroma')
    
    # 로깅 설정
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = str(PROJECT_ROOT / 'logs' / 'like.log')

class DevelopmentConfig(Config):
    """개발 환경 설정"""
    DEBUG = True
    TESTING = False

class TestingConfig(Config):
    """테스트 환경 설정"""
    TESTING = True
    DEBUG = False
    WTF_CSRF_ENABLED = False
    
    # 테스트용 인메모리 데이터베이스
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

class ProductionConfig(Config):
    """프로덕션 환경 설정"""
    DEBUG = False
    TESTING = False
    
    # 보안 설정
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    
    # 로깅 레벨
    LOG_LEVEL = 'WARNING'

# 환경별 설정 매핑
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
