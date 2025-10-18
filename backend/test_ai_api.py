#!/usr/bin/env python3
"""
AI API 테스트 스크립트
"""

import requests
import json

def test_chat_api():
    """채팅 API 테스트"""
    
    # API 엔드포인트
    url = "http://localhost:5001/api/v1/chat"
    
    # 테스트 데이터
    test_data = {
        "message": "안녕하세요! 영어 문법에 대해 질문이 있습니다.",
        "mode": "grammar",
        "difficulty": "intermediate",
        "provider": "openai",
        "stream": False
    }
    
    try:
        print("AI 채팅 API 테스트 시작...")
        print(f"요청 데이터: {json.dumps(test_data, ensure_ascii=False, indent=2)}")
        
        # POST 요청 전송
        response = requests.post(
            url,
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"응답 상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("API 호출 성공!")
            print(f"응답 데이터: {json.dumps(result, ensure_ascii=False, indent=2)}")
            
            if result.get('success'):
                print(f"AI 응답: {result.get('response', '응답 없음')}")
            else:
                print(f"API 오류: {result.get('error', '알 수 없는 오류')}")
        else:
            print(f"HTTP 오류: {response.status_code}")
            print(f"응답 내용: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("연결 실패: 백엔드 서버가 실행 중인지 확인해주세요.")
    except requests.exceptions.Timeout:
        print("타임아웃: AI 응답이 너무 오래 걸립니다.")
    except Exception as e:
        print(f"예상치 못한 오류: {e}")

def test_health_api():
    """헬스 체크 API 테스트"""
    
    url = "http://localhost:5001/api/v1/health"
    
    try:
        print("\n헬스 체크 API 테스트...")
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            print("헬스 체크 성공!")
            print(f"상태: {result.get('status', 'unknown')}")
            print(f"메시지: {result.get('message', 'no message')}")
        else:
            print(f"헬스 체크 실패: {response.status_code}")
            
    except Exception as e:
        print(f"헬스 체크 오류: {e}")

def test_conversation_api():
    """대화 기록 API 테스트"""
    
    url = "http://localhost:5001/api/v1/conversation"
    
    try:
        print("\n대화 기록 API 테스트...")
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            print("대화 기록 조회 성공!")
            print(f"메시지 수: {result.get('message_count', 0)}")
        else:
            print(f"대화 기록 조회 실패: {response.status_code}")
            
    except Exception as e:
        print(f"대화 기록 조회 오류: {e}")

if __name__ == "__main__":
    print("Like-Opt AI API 테스트 시작\n")
    
    # 헬스 체크
    test_health_api()
    
    # 대화 기록 조회
    test_conversation_api()
    
    # 채팅 API 테스트
    test_chat_api()
    
    print("\n테스트 완료!")
