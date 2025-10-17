#!/usr/bin/env python3
"""
Like-Opt - Main Application Entry Point

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
    print("Like-Opt starting...")
    print(f"Environment: {os.environ.get('FLASK_ENV', 'development')}")
    print(f"Debug: {os.environ.get('FLASK_DEBUG', 'False')}")
    print(f"Port: {config.PORT}")
    print(f"Project root: {project_root}")
    
    try:
        # 개발 서버 실행
        app.run(
            host=config.HOST,
            port=config.PORT,
            debug=config.DEBUG,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\nShutting down application...")
    except Exception as e:
        print(f"Error occurred: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
