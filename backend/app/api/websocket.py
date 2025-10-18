"""
WebSocket API
실시간 통신, 알림, 상태 동기화 API
"""

from flask import Blueprint, request, jsonify, session
from typing import Dict, Any

from ..services.websocket_service import get_websocket_service

# WebSocket API 블루프린트
websocket_bp = Blueprint('websocket', __name__)

@websocket_bp.route('/websocket/status', methods=['GET'])
def get_websocket_status():
    """
    WebSocket 연결 상태 조회
    
    Returns:
        {
            "success": true,
            "status": {...}
        }
    """
    try:
        websocket_service = get_websocket_service()
        if not websocket_service:
            return jsonify({
                'success': False,
                'error': 'WebSocket 서비스가 초기화되지 않았습니다.'
            }), 500
        
        stats = websocket_service.get_connection_stats()
        
        return jsonify({
            'success': True,
            'status': stats
        })
        
    except Exception as e:
        print(f"[WebSocket API] 상태 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'WebSocket 상태 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@websocket_bp.route('/websocket/messages', methods=['GET'])
def get_message_history():
    """
    메시지 히스토리 조회
    
    Query Parameters:
        limit: 조회할 메시지 수 (기본값: 50)
    
    Returns:
        {
            "success": true,
            "messages": [...]
        }
    """
    try:
        websocket_service = get_websocket_service()
        if not websocket_service:
            return jsonify({
                'success': False,
                'error': 'WebSocket 서비스가 초기화되지 않았습니다.'
            }), 500
        
        limit = request.args.get('limit', 50, type=int)
        messages = websocket_service.get_message_history(limit)
        
        return jsonify({
            'success': True,
            'messages': messages
        })
        
    except Exception as e:
        print(f"[WebSocket API] 메시지 히스토리 조회 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'메시지 히스토리 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@websocket_bp.route('/websocket/messages', methods=['DELETE'])
def clear_message_history():
    """
    메시지 히스토리 초기화
    
    Returns:
        {
            "success": true,
            "message": "메시지 히스토리가 초기화되었습니다."
        }
    """
    try:
        websocket_service = get_websocket_service()
        if not websocket_service:
            return jsonify({
                'success': False,
                'error': 'WebSocket 서비스가 초기화되지 않았습니다.'
            }), 500
        
        websocket_service.clear_message_history()
        
        return jsonify({
            'success': True,
            'message': '메시지 히스토리가 초기화되었습니다.'
        })
        
    except Exception as e:
        print(f"[WebSocket API] 메시지 히스토리 초기화 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'메시지 히스토리 초기화 중 오류가 발생했습니다: {str(e)}'
        }), 500


@websocket_bp.route('/websocket/notify', methods=['POST'])
def send_notification():
    """
    알림 전송
    
    Request Body:
        {
            "user_id": "user123",
            "type": "info|warning|error|success",
            "title": "알림 제목",
            "message": "알림 내용",
            "data": {...}
        }
    
    Returns:
        {
            "success": true,
            "message": "알림이 전송되었습니다."
        }
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        notification_type = data.get('type', 'info')
        title = data.get('title', '알림')
        message = data.get('message', '')
        notification_data = data.get('data', {})
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': '사용자 ID가 필요합니다.'
            }), 400
        
        if not message:
            return jsonify({
                'success': False,
                'error': '알림 내용이 필요합니다.'
            }), 400
        
        websocket_service = get_websocket_service()
        if not websocket_service:
            return jsonify({
                'success': False,
                'error': 'WebSocket 서비스가 초기화되지 않았습니다.'
            }), 500
        
        notification = {
            'type': notification_type,
            'title': title,
            'message': message,
            'data': notification_data,
            'timestamp': websocket_service.socketio.server.manager.get_room_time()
        }
        
        websocket_service.send_notification(user_id, notification)
        
        return jsonify({
            'success': True,
            'message': '알림이 전송되었습니다.'
        })
        
    except Exception as e:
        print(f"[WebSocket API] 알림 전송 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'알림 전송 중 오류가 발생했습니다: {str(e)}'
        }), 500


@websocket_bp.route('/websocket/broadcast', methods=['POST'])
def broadcast_notification():
    """
    브로드캐스트 알림 전송
    
    Request Body:
        {
            "room": "users|admin|notifications",
            "type": "info|warning|error|success",
            "title": "알림 제목",
            "message": "알림 내용",
            "data": {...}
        }
    
    Returns:
        {
            "success": true,
            "message": "브로드캐스트가 전송되었습니다."
        }
    """
    try:
        data = request.get_json() or {}
        room = data.get('room', 'users')
        notification_type = data.get('type', 'info')
        title = data.get('title', '알림')
        message = data.get('message', '')
        notification_data = data.get('data', {})
        
        if not message:
            return jsonify({
                'success': False,
                'error': '알림 내용이 필요합니다.'
            }), 400
        
        websocket_service = get_websocket_service()
        if not websocket_service:
            return jsonify({
                'success': False,
                'error': 'WebSocket 서비스가 초기화되지 않았습니다.'
            }), 500
        
        notification = {
            'type': notification_type,
            'title': title,
            'message': message,
            'data': notification_data,
            'timestamp': websocket_service.socketio.server.manager.get_room_time()
        }
        
        websocket_service.broadcast_notification(notification, room)
        
        return jsonify({
            'success': True,
            'message': f'{room} 룸에 브로드캐스트가 전송되었습니다.'
        })
        
    except Exception as e:
        print(f"[WebSocket API] 브로드캐스트 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'브로드캐스트 전송 중 오류가 발생했습니다: {str(e)}'
        }), 500


@websocket_bp.route('/websocket/system-alert', methods=['POST'])
def send_system_alert():
    """
    시스템 알림 전송
    
    Request Body:
        {
            "alert_type": "performance|security|maintenance",
            "message": "알림 내용",
            "severity": "info|warning|error|critical"
        }
    
    Returns:
        {
            "success": true,
            "message": "시스템 알림이 전송되었습니다."
        }
    """
    try:
        data = request.get_json() or {}
        alert_type = data.get('alert_type', 'system')
        message = data.get('message', '')
        severity = data.get('severity', 'info')
        
        if not message:
            return jsonify({
                'success': False,
                'error': '알림 내용이 필요합니다.'
            }), 400
        
        websocket_service = get_websocket_service()
        if not websocket_service:
            return jsonify({
                'success': False,
                'error': 'WebSocket 서비스가 초기화되지 않았습니다.'
            }), 500
        
        websocket_service.send_system_alert(alert_type, message, severity)
        
        return jsonify({
            'success': True,
            'message': '시스템 알림이 전송되었습니다.'
        })
        
    except Exception as e:
        print(f"[WebSocket API] 시스템 알림 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'시스템 알림 전송 중 오류가 발생했습니다: {str(e)}'
        }), 500


@websocket_bp.route('/websocket/agent-notification', methods=['POST'])
def send_agent_notification():
    """
    에이전트 변경 알림 전송
    
    Request Body:
        {
            "user_id": "user123",
            "old_agent": "professor-g",
            "new_agent": "grammar-buddy"
        }
    
    Returns:
        {
            "success": true,
            "message": "에이전트 변경 알림이 전송되었습니다."
        }
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        old_agent = data.get('old_agent', '')
        new_agent = data.get('new_agent', '')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': '사용자 ID가 필요합니다.'
            }), 400
        
        if not new_agent:
            return jsonify({
                'success': False,
                'error': '새 에이전트가 필요합니다.'
            }), 400
        
        websocket_service = get_websocket_service()
        if not websocket_service:
            return jsonify({
                'success': False,
                'error': 'WebSocket 서비스가 초기화되지 않았습니다.'
            }), 500
        
        websocket_service.send_agent_change_notification(user_id, old_agent, new_agent)
        
        return jsonify({
            'success': True,
            'message': '에이전트 변경 알림이 전송되었습니다.'
        })
        
    except Exception as e:
        print(f"[WebSocket API] 에이전트 알림 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'에이전트 알림 전송 중 오류가 발생했습니다: {str(e)}'
        }), 500


@websocket_bp.route('/websocket/performance-alert', methods=['POST'])
def send_performance_alert():
    """
    성능 알림 전송
    
    Request Body:
        {
            "metric": "cpu|memory|disk",
            "value": 85.5,
            "threshold": 80.0
        }
    
    Returns:
        {
            "success": true,
            "message": "성능 알림이 전송되었습니다."
        }
    """
    try:
        data = request.get_json() or {}
        metric = data.get('metric', '')
        value = data.get('value', 0)
        threshold = data.get('threshold', 0)
        
        if not metric:
            return jsonify({
                'success': False,
                'error': '메트릭이 필요합니다.'
            }), 400
        
        websocket_service = get_websocket_service()
        if not websocket_service:
            return jsonify({
                'success': False,
                'error': 'WebSocket 서비스가 초기화되지 않았습니다.'
            }), 500
        
        websocket_service.send_performance_alert(metric, value, threshold)
        
        return jsonify({
            'success': True,
            'message': '성능 알림이 전송되었습니다.'
        })
        
    except Exception as e:
        print(f"[WebSocket API] 성능 알림 실패: {e}")
        return jsonify({
            'success': False,
            'error': f'성능 알림 전송 중 오류가 발생했습니다: {str(e)}'
        }), 500
