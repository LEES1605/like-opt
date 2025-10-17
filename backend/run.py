#!/usr/bin/env python3
"""
MAIC Flask Optimized - Main Application Entry Point

이 파일은 Flask 애플리케이션의 진입점입니다.
개발 및 프로덕션 환경에서 실행할 수 있습니다.
"""

import os
import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app import create_app
from app.config import Config

def main():
    """애플리케이션 실행"""
    
    # 환경 변수 설정
    os.environ.setdefault('FLASK_ENV', 'development')
    os.environ.setdefault('FLASK_DEBUG', '1')
    
    # Flask 앱 생성
    app = create_app()
    
    # 설정 정보 출력
    config = Config()
    print(f"""
🚀 MAIC Flask Optimized 시작 중...
📍 환경: {os.environ.get('FLASK_ENV', 'development')}
🔧 디버그: {os.environ.get('FLASK_DEBUG', 'False')}
🌐 포트: {config.PORT}
📁 프로젝트 루트: {project_root}
    """)
    
    try:
        # 개발 서버 실행
        app.run(
            host=config.HOST,
            port=config.PORT,
            debug=config.DEBUG,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n👋 애플리케이션을 종료합니다...")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
