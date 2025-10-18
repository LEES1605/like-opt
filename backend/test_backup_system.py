#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
백업 시스템 테스트
고급 백업 시스템의 기능을 테스트합니다.
"""

import os
import sys
import time
import json
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.resolve()
sys.path.insert(0, str(project_root))

from app.services.backup_service import BackupService, BackupConfig
from app.services.github_backup_service import GitHubBackupService, GHConfig


def test_backup_service():
    """백업 서비스 테스트"""
    print("🧪 백업 서비스 테스트 시작...")
    
    try:
        # 백업 서비스 초기화
        config = BackupConfig(
            backup_dir="test_backups",
            max_backups=5,
            compression_level=6
        )
        backup_service = BackupService(config)
        
        print("✅ 백업 서비스 초기화 완료")
        
        # 전체 백업 생성
        print("\n📦 전체 백업 생성 테스트...")
        backup_info = backup_service.create_full_backup("테스트 전체 백업")
        print(f"✅ 전체 백업 생성 완료: {backup_info.name}")
        print(f"   - ID: {backup_info.id}")
        print(f"   - 크기: {backup_info.size} bytes")
        print(f"   - 체크섬: {backup_info.checksum}")
        
        # 증분 백업 생성
        print("\n📦 증분 백업 생성 테스트...")
        time.sleep(1)  # 파일 수정 시간 차이를 위해 대기
        incremental_backup = backup_service.create_incremental_backup("테스트 증분 백업")
        if incremental_backup:
            print(f"✅ 증분 백업 생성 완료: {incremental_backup.name}")
            print(f"   - ID: {incremental_backup.id}")
            print(f"   - 크기: {incremental_backup.size} bytes")
        else:
            print("ℹ️ 증분 백업할 변경된 파일이 없습니다.")
        
        # 백업 목록 조회
        print("\n📋 백업 목록 조회...")
        backups = backup_service.list_backups()
        print(f"✅ 백업 목록 조회 완료: {len(backups)}개")
        for backup in backups:
            print(f"   - {backup.name} ({backup.type}) - {backup.size} bytes")
        
        # 백업 통계 조회
        print("\n📊 백업 통계 조회...")
        stats = backup_service.get_backup_stats()
        print(f"✅ 백업 통계 조회 완료:")
        print(f"   - 총 백업: {stats['total_backups']}개")
        print(f"   - 전체 백업: {stats['full_backups']}개")
        print(f"   - 증분 백업: {stats['incremental_backups']}개")
        print(f"   - 총 크기: {stats['total_size']} bytes")
        
        # 백업 복원 테스트
        if backups:
            print("\n🔄 백업 복원 테스트...")
            test_restore_dir = Path("test_restore")
            test_restore_dir.mkdir(exist_ok=True)
            
            success = backup_service.restore_backup(backups[0].id, str(test_restore_dir))
            if success:
                print(f"✅ 백업 복원 완료: {backups[0].name}")
            else:
                print(f"❌ 백업 복원 실패: {backups[0].name}")
        
        # 오래된 백업 정리 테스트
        print("\n🧹 오래된 백업 정리 테스트...")
        deleted_count = backup_service.cleanup_old_backups()
        print(f"✅ 백업 정리 완료: {deleted_count}개 삭제")
        
        print("\n🎉 백업 서비스 테스트 완료!")
        return True
        
    except Exception as e:
        print(f"❌ 백업 서비스 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_github_backup_service():
    """GitHub 백업 서비스 테스트"""
    print("\n🧪 GitHub 백업 서비스 테스트 시작...")
    
    try:
        # GitHub 설정 확인
        github_owner = os.getenv('GITHUB_OWNER', '')
        github_repo = os.getenv('GITHUB_REPO', '')
        github_token = os.getenv('GITHUB_TOKEN', '')
        
        if not github_owner or not github_repo or not github_token:
            print("⚠️ GitHub 설정이 없습니다. 환경변수를 설정하세요:")
            print("   - GITHUB_OWNER: GitHub 사용자명")
            print("   - GITHUB_REPO: GitHub 저장소명")
            print("   - GITHUB_TOKEN: GitHub 토큰")
            return False
        
        # GitHub 백업 서비스 초기화
        config = GHConfig(
            owner=github_owner,
            repo=github_repo,
            token=github_token
        )
        github_service = GitHubBackupService(config)
        
        print("✅ GitHub 백업 서비스 초기화 완료")
        
        # 최신 릴리스 조회
        print("\n📋 최신 릴리스 조회...")
        latest_release = github_service.get_latest_release()
        if latest_release:
            print(f"✅ 최신 릴리스 조회 완료: {latest_release.get('name', 'Unknown')}")
            print(f"   - 태그: {latest_release.get('tag_name', 'Unknown')}")
            print(f"   - 에셋: {len(latest_release.get('assets', []))}개")
        else:
            print("ℹ️ 릴리스가 없습니다.")
        
        # 릴리스 목록 조회
        print("\n📋 릴리스 목록 조회...")
        releases = github_service.list_releases(limit=5)
        print(f"✅ 릴리스 목록 조회 완료: {len(releases)}개")
        for release in releases[:3]:  # 최대 3개만 출력
            print(f"   - {release.get('name', 'Unknown')} ({release.get('tag_name', 'Unknown')})")
        
        print("\n🎉 GitHub 백업 서비스 테스트 완료!")
        return True
        
    except Exception as e:
        print(f"❌ GitHub 백업 서비스 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_backup_api():
    """백업 API 테스트"""
    print("\n🧪 백업 API 테스트 시작...")
    
    try:
        import requests
        
        # Flask 앱 시작 (별도 터미널에서 실행 중이어야 함)
        base_url = "http://localhost:5000"
        
        # 백업 목록 조회
        print("\n📋 백업 목록 API 테스트...")
        response = requests.get(f"{base_url}/api/v1/backups")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 백업 목록 API 성공: {len(data.get('backups', []))}개")
        else:
            print(f"❌ 백업 목록 API 실패: {response.status_code}")
            return False
        
        # 백업 통계 조회
        print("\n📊 백업 통계 API 테스트...")
        response = requests.get(f"{base_url}/api/v1/backups/stats")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 백업 통계 API 성공: {data.get('stats', {})}")
        else:
            print(f"❌ 백업 통계 API 실패: {response.status_code}")
            return False
        
        print("\n🎉 백업 API 테스트 완료!")
        return True
        
    except Exception as e:
        print(f"❌ 백업 API 테스트 실패: {e}")
        return False


def cleanup_test_files():
    """테스트 파일 정리"""
    print("\n🧹 테스트 파일 정리...")
    
    try:
        # 테스트 백업 디렉토리 삭제
        test_backup_dir = Path("test_backups")
        if test_backup_dir.exists():
            import shutil
            shutil.rmtree(test_backup_dir)
            print("✅ 테스트 백업 디렉토리 삭제 완료")
        
        # 테스트 복원 디렉토리 삭제
        test_restore_dir = Path("test_restore")
        if test_restore_dir.exists():
            import shutil
            shutil.rmtree(test_restore_dir)
            print("✅ 테스트 복원 디렉토리 삭제 완료")
        
        print("✅ 테스트 파일 정리 완료")
        
    except Exception as e:
        print(f"⚠️ 테스트 파일 정리 중 오류: {e}")


def main():
    """메인 테스트 함수"""
    print("🚀 백업 시스템 테스트 시작")
    print("=" * 50)
    
    # 테스트 실행
    backup_test_passed = test_backup_service()
    github_test_passed = test_github_backup_service()
    api_test_passed = test_backup_api()
    
    # 결과 요약
    print("\n" + "=" * 50)
    print("📊 테스트 결과 요약")
    print("=" * 50)
    print(f"백업 서비스: {'✅ 통과' if backup_test_passed else '❌ 실패'}")
    print(f"GitHub 백업: {'✅ 통과' if github_test_passed else '❌ 실패'}")
    print(f"백업 API: {'✅ 통과' if api_test_passed else '❌ 실패'}")
    
    # 전체 결과
    all_passed = backup_test_passed and github_test_passed and api_test_passed
    print(f"\n전체 결과: {'🎉 모든 테스트 통과!' if all_passed else '❌ 일부 테스트 실패'}")
    
    # 테스트 파일 정리
    cleanup_test_files()
    
    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
