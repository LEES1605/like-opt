#!/usr/bin/env python3
"""
RAG API 테스트 스크립트
"""

import requests
import json

def test_rag_chat():
    """RAG가 포함된 채팅 API 테스트"""
    
    url = "http://localhost:5001/api/v1/chat"
    
    # RAG 관련 질문
    test_data = {
        "message": "현재시제에 대해 설명해주세요",
        "mode": "grammar",
        "difficulty": "elementary",
        "provider": "openai",
        "stream": False
    }
    
    try:
        print("RAG 채팅 API 테스트 시작...")
        print(f"요청 데이터: {json.dumps(test_data, ensure_ascii=False, indent=2)}")
        
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
            
    except Exception as e:
        print(f"예상치 못한 오류: {e}")

def test_rag_search():
    """RAG 검색 테스트 (직접 구현)"""
    
    try:
        print("\nRAG 검색 테스트...")
        
        # RAG 서비스 직접 테스트
        import sys
        sys.path.append('.')
        
        from app.services.rag_service import rag_service
        
        # 검색 테스트
        query = "현재시제"
        results = rag_service.search(query, top_k=3)
        
        print(f"검색 쿼리: {query}")
        print(f"검색 결과: {len(results)}개")
        
        for i, result in enumerate(results, 1):
            print(f"\n[{i}] {result.title}")
            print(f"점수: {result.score}")
            print(f"내용: {result.text[:100]}...")
        
        # 컨텍스트 생성 테스트
        context = rag_service.get_context_for_query(query, max_chunks=2)
        if context:
            print(f"\n생성된 컨텍스트:")
            print(context[:200] + "...")
        else:
            print("\n컨텍스트 생성 실패")
            
    except Exception as e:
        print(f"RAG 검색 테스트 오류: {e}")

def test_rag_stats():
    """RAG 통계 테스트"""
    
    try:
        print("\nRAG 통계 테스트...")
        
        import sys
        sys.path.append('.')
        
        from app.services.rag_service import rag_service
        
        stats = rag_service.get_stats()
        print(f"RAG 통계: {json.dumps(stats, ensure_ascii=False, indent=2)}")
        
    except Exception as e:
        print(f"RAG 통계 테스트 오류: {e}")

if __name__ == "__main__":
    print("RAG API 테스트 시작\n")
    
    # RAG 통계
    test_rag_stats()
    
    # RAG 검색
    test_rag_search()
    
    # RAG 채팅
    test_rag_chat()
    
    print("\n테스트 완료!")

