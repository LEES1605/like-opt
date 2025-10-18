#!/usr/bin/env python3
"""
샘플 데이터를 사용하여 RAG 인덱스 생성
"""

import json
import os
from pathlib import Path

def create_sample_index():
    """샘플 데이터로 RAG 인덱스 생성"""
    
    # 프로젝트 루트 경로
    project_root = Path(__file__).parent
    sample_data_file = project_root / "sample_data" / "english_grammar.json"
    persist_dir = project_root / ".like" / "persist"
    chunks_file = persist_dir / "chunks.jsonl"
    
    # persist 디렉토리 생성
    persist_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        # 샘플 데이터 로드
        with open(sample_data_file, 'r', encoding='utf-8') as f:
            sample_data = json.load(f)
        
        print(f"샘플 데이터 로드 완료: {len(sample_data)}개 항목")
        
        # 청크 생성
        chunks = []
        for i, item in enumerate(sample_data):
            chunk = {
                'chunk_id': f"grammar_{i}",
                'text': f"{item['title']}\n\n{item['content']}",
                'source': item['source'],
                'doc_id': f"grammar_doc_{i}",
                'title': item['title'],
                'category': item['category'],
                'difficulty': item['difficulty']
            }
            chunks.append(chunk)
        
        # chunks.jsonl 파일에 저장
        with open(chunks_file, 'w', encoding='utf-8') as f:
            for chunk in chunks:
                f.write(json.dumps(chunk, ensure_ascii=False) + '\n')
        
        print(f"RAG 인덱스 생성 완료: {len(chunks)}개 청크")
        print(f"저장 위치: {chunks_file}")
        
        # 인덱싱 상태 파일 생성
        state_file = persist_dir / ".indexing_state.json"
        state = {
            "indexed_files": {
                "sample_data/english_grammar.json": "sample_hash"
            },
            "last_scan_time": "2024-01-01T00:00:00Z"
        }
        
        with open(state_file, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
        
        print("인덱싱 상태 파일 생성 완료")
        
        return True
        
    except Exception as e:
        print(f"인덱스 생성 실패: {e}")
        return False

if __name__ == "__main__":
    print("RAG 샘플 인덱스 생성 시작...")
    success = create_sample_index()
    
    if success:
        print("✅ RAG 인덱스 생성 성공!")
    else:
        print("❌ RAG 인덱스 생성 실패!")

