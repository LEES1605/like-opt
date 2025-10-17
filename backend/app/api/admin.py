"""
MAIC Flask Optimized - Admin API

관리자 기능 관련 API 엔드포인트 (인덱싱, 복원 등)
"""

from flask import Blueprint, request, jsonify, session
from typing import Dict, Any

from ..services.indexing_service import indexing_service
from ..services.restore_service import restore_service

# 관리자 API 블루프린트
admin_bp = Blueprint('admin', __name__)

def require_admin_auth():
    """관리자 인증 확인"""
    return session.get('authenticated') == True and session.get('user_role') == 'admin'

@admin_bp.route('/indexing/run', methods=['POST'])
def run_indexing():
    """
    인덱싱 실행 API
    
    Returns:
        {
            "success": true,
            "result": {...}
        }
    """
    if not require_admin_auth():
        return jsonify({
            'success': False,
            'error': '관리자 권한이 필요합니다.'
        }), 403
    
    try:
        result = indexing_service.run_indexing()
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        print(f"[Admin API] 인덱싱 실행 실패: {e}")
        return jsonify({
            'success': False,
            'error': '인덱싱 실행 중 오류가 발생했습니다.'
        }), 500

@admin_bp.route('/indexing/status', methods=['GET'])
def get_indexing_status():
    """
    인덱싱 상태 조회 API
    
    Returns:
        {
            "success": true,
            "status": {...}
        }
    """
    if not require_admin_auth():
        return jsonify({
            'success': False,
            'error': '관리자 권한이 필요합니다.'
        }), 403
    
    try:
        state = indexing_service.load_indexing_state()
        
        return jsonify({
            'success': True,
            'status': {
                'indexed_files_count': len(state.get('indexed_files', {})),
                'last_scan_time': state.get('last_scan_time'),
                'chunks_file_exists': indexing_service._chunks_file.exists(),
                'chunks_count': _count_chunks()
            }
        })
        
    except Exception as e:
        print(f"[Admin API] 인덱싱 상태 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': '인덱싱 상태 조회 중 오류가 발생했습니다.'
        }), 500

@admin_bp.route('/backup/create', methods=['POST'])
def create_backup():
    """
    백업 생성 API
    
    Request Body:
        {
            "tag_name": "backup-20241017" (선택사항)
        }
    
    Returns:
        {
            "success": true,
            "result": {...}
        }
    """
    if not require_admin_auth():
        return jsonify({
            'success': False,
            'error': '관리자 권한이 필요합니다.'
        }), 403
    
    try:
        data = request.get_json() or {}
        tag_name = data.get('tag_name')
        
        if tag_name:
            # 수동 백업
            backup_files = [
                indexing_service._chunks_file,
                indexing_service._indexing_state_file
            ]
            existing_files = [f for f in backup_files if f.exists()]
            
            if not existing_files:
                return jsonify({
                    'success': False,
                    'error': '백업할 파일이 없습니다.'
                }), 400
            
            result = restore_service.upload_to_github_release(tag_name, existing_files)
        else:
            # 자동 백업
            result = restore_service.auto_backup()
        
        return jsonify({
            'success': result.get('success', False),
            'result': result
        })
        
    except Exception as e:
        print(f"[Admin API] 백업 생성 실패: {e}")
        return jsonify({
            'success': False,
            'error': '백업 생성 중 오류가 발생했습니다.'
        }), 500

@admin_bp.route('/backup/list', methods=['GET'])
def list_backups():
    """
    백업 목록 조회 API
    
    Returns:
        {
            "success": true,
            "releases": [...]
        }
    """
    if not require_admin_auth():
        return jsonify({
            'success': False,
            'error': '관리자 권한이 필요합니다.'
        }), 403
    
    try:
        releases = restore_service.get_available_releases()
        
        return jsonify({
            'success': True,
            'releases': releases
        })
        
    except Exception as e:
        print(f"[Admin API] 백업 목록 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': '백업 목록 조회 중 오류가 발생했습니다.'
        }), 500

@admin_bp.route('/backup/restore', methods=['POST'])
def restore_backup():
    """
    백업 복원 API
    
    Request Body:
        {
            "tag_name": "backup-20241017",
            "asset_name": "maic-data-backup-20241017.zip"
        }
    
    Returns:
        {
            "success": true,
            "result": {...}
        }
    """
    if not require_admin_auth():
        return jsonify({
            'success': False,
            'error': '관리자 권한이 필요합니다.'
        }), 403
    
    try:
        data = request.get_json() or {}
        tag_name = data.get('tag_name')
        asset_name = data.get('asset_name')
        
        if not tag_name or not asset_name:
            return jsonify({
                'success': False,
                'error': 'tag_name과 asset_name이 필요합니다.'
            }), 400
        
        result = restore_service.download_from_release(
            tag_name, 
            asset_name, 
            indexing_service._persist_dir
        )
        
        return jsonify({
            'success': result.get('success', False),
            'result': result
        })
        
    except Exception as e:
        print(f"[Admin API] 백업 복원 실패: {e}")
        return jsonify({
            'success': False,
            'error': '백업 복원 중 오류가 발생했습니다.'
        }), 500

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """
    관리자 로그인 API
    
    Request Body:
        {
            "password": "admin_password"
        }
    
    Returns:
        {
            "success": true,
            "message": "로그인 성공"
        }
    """
    try:
        data = request.get_json() or {}
        password = data.get('password', '')
        
        admin_password = os.getenv('ADMIN_PASSWORD', '1234')
        
        if password == admin_password:
            session['authenticated'] = True
            session['user_role'] = 'admin'
            
            return jsonify({
                'success': True,
                'message': '로그인 성공'
            })
        else:
            return jsonify({
                'success': False,
                'error': '비밀번호가 올바르지 않습니다.'
            }), 401
            
    except Exception as e:
        print(f"[Admin API] 로그인 실패: {e}")
        return jsonify({
            'success': False,
            'error': '로그인 중 오류가 발생했습니다.'
        }), 500

@admin_bp.route('/logout', methods=['POST'])
def admin_logout():
    """
    관리자 로그아웃 API
    
    Returns:
        {
            "success": true,
            "message": "로그아웃 성공"
        }
    """
    try:
        session.clear()
        
        return jsonify({
            'success': True,
            'message': '로그아웃 성공'
        })
        
    except Exception as e:
        print(f"[Admin API] 로그아웃 실패: {e}")
        return jsonify({
            'success': False,
            'error': '로그아웃 중 오류가 발생했습니다.'
        }), 500

def _count_chunks() -> int:
    """청크 파일의 청크 수 계산"""
    try:
        if not indexing_service._chunks_file.exists():
            return 0
        
        count = 0
        with open(indexing_service._chunks_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    count += 1
        return count
    except Exception:
        return 0
