"""
백업 API
백업 생성, 복원, 관리, GitHub Release 백업
"""

from flask import Blueprint, request, jsonify, session
from typing import Dict, Any
from pathlib import Path

from ..services.backup_service import get_backup_service, BackupConfig
from ..services.github_backup_service import get_github_backup_service

# 백업 API 블루프린트
backup_bp = Blueprint('backup', __name__)

@backup_bp.route('/backups', methods=['GET'])
def list_backups():
    """
    백업 목록 조회
    
    Returns:
        {
            "success": true,
            "backups": [...],
            "stats": {...}
        }
    """
    try:
        backup_service = get_backup_service()
        backups = backup_service.list_backups()
        stats = backup_service.get_backup_stats()
        
        # 백업 정보를 JSON 직렬화 가능한 형태로 변환
        backup_list = []
        for backup in backups:
            backup_list.append({
                'id': backup.id,
                'name': backup.name,
                'timestamp': backup.timestamp.isoformat(),
                'size': backup.size,
                'type': backup.type,
                'status': backup.status,
                'file_path': backup.file_path,
                'github_url': backup.github_url,
                'checksum': backup.checksum,
                'metadata': backup.metadata
            })
        
        return jsonify({
            'success': True,
            'backups': backup_list,
            'stats': stats
        })
        
    except Exception as e:
        print(f"[Backup API] 백업 목록 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'백업 목록 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@backup_bp.route('/backups', methods=['POST'])
def create_backup():
    """
    백업 생성
    
    Request Body:
        {
            "type": "full|incremental",
            "name": "백업 이름 (선택)",
            "github_upload": true|false
        }
    
    Returns:
        {
            "success": true,
            "backup": {...},
            "message": "백업이 생성되었습니다."
        }
    """
    try:
        data = request.get_json() or {}
        backup_type = data.get('type', 'full')
        backup_name = data.get('name')
        github_upload = data.get('github_upload', False)
        
        backup_service = get_backup_service()
        
        # 백업 생성
        if backup_type == 'full':
            backup_info = backup_service.create_full_backup(backup_name)
        elif backup_type == 'incremental':
            backup_info = backup_service.create_incremental_backup(backup_name)
        else:
            return jsonify({
                'success': False,
                'error': '유효하지 않은 백업 타입입니다. (full, incremental)'
            }), 400
        
        if not backup_info:
            return jsonify({
                'success': False,
                'error': '백업 생성에 실패했습니다.'
            }), 500
        
        # GitHub 업로드 (선택)
        if github_upload:
            try:
                # GitHub 설정 (환경변수에서 가져오기)
                import os
                github_owner = os.getenv('GITHUB_OWNER', '')
                github_repo = os.getenv('GITHUB_REPO', '')
                github_token = os.getenv('GITHUB_TOKEN', '')
                
                if github_owner and github_repo and github_token:
                    github_service = get_github_backup_service(github_owner, github_repo, github_token)
                    tag = f"backup-{backup_info.id}"
                    github_service.ensure_release(tag, backup_info.name)
                    github_service.upload_asset(tag, Path(backup_info.file_path))
                    backup_service.upload_to_github(backup_info.id)
                else:
                    print("[Backup API] GitHub 설정이 없습니다.")
            except Exception as e:
                print(f"[Backup API] GitHub 업로드 실패: {e}")
        
        return jsonify({
            'success': True,
            'backup': {
                'id': backup_info.id,
                'name': backup_info.name,
                'timestamp': backup_info.timestamp.isoformat(),
                'size': backup_info.size,
                'type': backup_info.type,
                'status': backup_info.status,
                'file_path': backup_info.file_path,
                'github_url': backup_info.github_url,
                'checksum': backup_info.checksum,
                'metadata': backup_info.metadata
            },
            'message': f'{backup_type} 백업이 생성되었습니다.'
        })
        
    except Exception as e:
        print(f"[Backup API] 백업 생성 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'백업 생성 중 오류가 발생했습니다: {str(e)}'
        }), 500


@backup_bp.route('/backups/<backup_id>', methods=['GET'])
def get_backup(backup_id: str):
    """
    특정 백업 정보 조회
    
    Args:
        backup_id: 백업 ID
    
    Returns:
        {
            "success": true,
            "backup": {...}
        }
    """
    try:
        backup_service = get_backup_service()
        backup_info = backup_service.get_backup_info(backup_id)
        
        if not backup_info:
            return jsonify({
                'success': False,
                'error': '백업을 찾을 수 없습니다.'
            }), 404
        
        return jsonify({
            'success': True,
            'backup': {
                'id': backup_info.id,
                'name': backup_info.name,
                'timestamp': backup_info.timestamp.isoformat(),
                'size': backup_info.size,
                'type': backup_info.type,
                'status': backup_info.status,
                'file_path': backup_info.file_path,
                'github_url': backup_info.github_url,
                'checksum': backup_info.checksum,
                'metadata': backup_info.metadata
            }
        })
        
    except Exception as e:
        print(f"[Backup API] 백업 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'백업 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@backup_bp.route('/backups/<backup_id>/restore', methods=['POST'])
def restore_backup(backup_id: str):
    """
    백업 복원
    
    Args:
        backup_id: 백업 ID
    
    Request Body:
        {
            "target_dir": "복원 대상 디렉토리 (선택)"
        }
    
    Returns:
        {
            "success": true,
            "message": "백업이 복원되었습니다."
        }
    """
    try:
        data = request.get_json() or {}
        target_dir = data.get('target_dir')
        
        backup_service = get_backup_service()
        success = backup_service.restore_backup(backup_id, target_dir)
        
        if success:
            return jsonify({
                'success': True,
                'message': '백업이 복원되었습니다.'
            })
        else:
            return jsonify({
                'success': False,
                'error': '백업 복원에 실패했습니다.'
            }), 500
        
    except Exception as e:
        print(f"[Backup API] 백업 복원 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'백업 복원 중 오류가 발생했습니다: {str(e)}'
        }), 500


@backup_bp.route('/backups/<backup_id>/github', methods=['POST'])
def upload_to_github(backup_id: str):
    """
    GitHub Release에 백업 업로드
    
    Args:
        backup_id: 백업 ID
    
    Returns:
        {
            "success": true,
            "message": "GitHub에 업로드되었습니다."
        }
    """
    try:
        backup_service = get_backup_service()
        success = backup_service.upload_to_github(backup_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'GitHub에 업로드되었습니다.'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'GitHub 업로드에 실패했습니다.'
            }), 500
        
    except Exception as e:
        print(f"[Backup API] GitHub 업로드 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'GitHub 업로드 중 오류가 발생했습니다: {str(e)}'
        }), 500


@backup_bp.route('/backups/<backup_id>', methods=['DELETE'])
def delete_backup(backup_id: str):
    """
    백업 삭제
    
    Args:
        backup_id: 백업 ID
    
    Returns:
        {
            "success": true,
            "message": "백업이 삭제되었습니다."
        }
    """
    try:
        backup_service = get_backup_service()
        success = backup_service.delete_backup(backup_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': '백업이 삭제되었습니다.'
            })
        else:
            return jsonify({
                'success': False,
                'error': '백업 삭제에 실패했습니다.'
            }), 500
        
    except Exception as e:
        print(f"[Backup API] 백업 삭제 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'백업 삭제 중 오류가 발생했습니다: {str(e)}'
        }), 500


@backup_bp.route('/backups/cleanup', methods=['POST'])
def cleanup_backups():
    """
    오래된 백업 정리
    
    Returns:
        {
            "success": true,
            "deleted_count": 3,
            "message": "3개의 오래된 백업이 정리되었습니다."
        }
    """
    try:
        backup_service = get_backup_service()
        deleted_count = backup_service.cleanup_old_backups()
        
        return jsonify({
            'success': True,
            'deleted_count': deleted_count,
            'message': f'{deleted_count}개의 오래된 백업이 정리되었습니다.'
        })
        
    except Exception as e:
        print(f"[Backup API] 백업 정리 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'백업 정리 중 오류가 발생했습니다: {str(e)}'
        }), 500


@backup_bp.route('/backups/stats', methods=['GET'])
def get_backup_stats():
    """
    백업 통계 조회
    
    Returns:
        {
            "success": true,
            "stats": {...}
        }
    """
    try:
        backup_service = get_backup_service()
        stats = backup_service.get_backup_stats()
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        print(f"[Backup API] 백업 통계 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'백업 통계 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@backup_bp.route('/backups/github/releases', methods=['GET'])
def list_github_releases():
    """
    GitHub Release 목록 조회
    
    Returns:
        {
            "success": true,
            "releases": [...]
        }
    """
    try:
        import os
        github_owner = os.getenv('GITHUB_OWNER', '')
        github_repo = os.getenv('GITHUB_REPO', '')
        github_token = os.getenv('GITHUB_TOKEN', '')
        
        if not github_owner or not github_repo:
            return jsonify({
                'success': False,
                'error': 'GitHub 설정이 없습니다.'
            }), 400
        
        github_service = get_github_backup_service(github_owner, github_repo, github_token)
        releases = github_service.list_releases(limit=20)
        
        return jsonify({
            'success': True,
            'releases': releases
        })
        
    except Exception as e:
        print(f"[Backup API] GitHub 릴리스 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'GitHub 릴리스 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@backup_bp.route('/backups/github/restore', methods=['POST'])
def restore_from_github():
    """
    GitHub Release에서 백업 복원
    
    Request Body:
        {
            "tag": "릴리스 태그",
            "asset_name": "에셋 이름",
            "target_dir": "복원 대상 디렉토리 (선택)"
        }
    
    Returns:
        {
            "success": true,
            "message": "GitHub에서 백업이 복원되었습니다."
        }
    """
    try:
        data = request.get_json() or {}
        tag = data.get('tag')
        asset_name = data.get('asset_name')
        target_dir = data.get('target_dir', '.')
        
        if not tag or not asset_name:
            return jsonify({
                'success': False,
                'error': '태그와 에셋 이름이 필요합니다.'
            }), 400
        
        import os
        github_owner = os.getenv('GITHUB_OWNER', '')
        github_repo = os.getenv('GITHUB_REPO', '')
        github_token = os.getenv('GITHUB_TOKEN', '')
        
        if not github_owner or not github_repo:
            return jsonify({
                'success': False,
                'error': 'GitHub 설정이 없습니다.'
            }), 400
        
        github_service = get_github_backup_service(github_owner, github_repo, github_token)
        log = github_service.restore_from_github(tag, asset_name, Path(target_dir))
        
        if log.detail.startswith('백업 복원 완료'):
            return jsonify({
                'success': True,
                'message': 'GitHub에서 백업이 복원되었습니다.',
                'log': {
                    'tag': log.tag,
                    'asset_name': log.asset_name,
                    'detail': log.detail
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': log.detail
            }), 500
        
    except Exception as e:
        print(f"[Backup API] GitHub 복원 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'GitHub 복원 중 오류가 발생했습니다: {str(e)}'
        }), 500
