"""
WebSocket 서비스
실시간 양방향 통신, 푸시 알림, 상태 동기화 기능
"""

from __future__ import annotations
from typing import Dict, List, Any, Optional, Set
import json
import logging
from datetime import datetime
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from flask import request, session

logger = logging.getLogger(__name__)


class WebSocketService:
    """WebSocket 서비스"""
    
    def __init__(self, socketio: SocketIO):
        self.socketio = socketio
        self.connected_users: Dict[str, Dict[str, Any]] = {}
        self.rooms: Dict[str, Set[str]] = {
            'admin': set(),
            'users': set(),
            'notifications': set()
        }
        self.message_history: List[Dict[str, Any]] = []
        self.setup_handlers()
    
    def setup_handlers(self):
        """WebSocket 이벤트 핸들러 설정"""
        
        @self.socketio.on('connect')
        def handle_connect():
            """클라이언트 연결 처리"""
            user_id = request.sid
            user_info = {
                'id': user_id,
                'connected_at': datetime.now().isoformat(),
                'ip': request.environ.get('REMOTE_ADDR'),
                'user_agent': request.environ.get('HTTP_USER_AGENT'),
                'is_admin': session.get('user_role') == 'admin'
            }
            
            self.connected_users[user_id] = user_info
            
            # 기본 룸에 참가
            join_room('users')
            if user_info['is_admin']:
                join_room('admin')
            
            # 연결 알림
            emit('connection_status', {
                'status': 'connected',
                'user_id': user_id,
                'timestamp': datetime.now().isoformat()
            })
            
            # 관리자에게 새 사용자 알림
            if not user_info['is_admin']:
                self.socketio.emit('user_connected', {
                    'user_id': user_id,
                    'connected_at': user_info['connected_at']
                }, room='admin')
            
            logger.info(f"사용자 연결: {user_id}")
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            """클라이언트 연결 해제 처리"""
            user_id = request.sid
            
            if user_id in self.connected_users:
                user_info = self.connected_users[user_id]
                
                # 룸에서 제거
                leave_room('users')
                if user_info['is_admin']:
                    leave_room('admin')
                
                # 관리자에게 사용자 연결 해제 알림
                if not user_info['is_admin']:
                    self.socketio.emit('user_disconnected', {
                        'user_id': user_id,
                        'disconnected_at': datetime.now().isoformat()
                    }, room='admin')
                
                del self.connected_users[user_id]
                logger.info(f"사용자 연결 해제: {user_id}")
        
        @self.socketio.on('join_room')
        def handle_join_room(data):
            """특정 룸 참가"""
            room = data.get('room')
            if room and room in self.rooms:
                join_room(room)
                self.rooms[room].add(request.sid)
                emit('room_joined', {'room': room})
                logger.info(f"사용자 {request.sid}이 룸 {room}에 참가")
        
        @self.socketio.on('leave_room')
        def handle_leave_room(data):
            """특정 룸 떠나기"""
            room = data.get('room')
            if room and room in self.rooms:
                leave_room(room)
                self.rooms[room].discard(request.sid)
                emit('room_left', {'room': room})
                logger.info(f"사용자 {request.sid}이 룸 {room}에서 떠남")
        
        @self.socketio.on('send_message')
        def handle_send_message(data):
            """실시간 메시지 전송"""
            message = data.get('message', '').strip()
            room = data.get('room', 'users')
            message_type = data.get('type', 'chat')
            
            if not message:
                emit('error', {'message': '메시지가 비어있습니다.'})
                return
            
            user_id = request.sid
            user_info = self.connected_users.get(user_id, {})
            
            message_data = {
                'id': f"msg_{datetime.now().timestamp()}",
                'user_id': user_id,
                'username': user_info.get('username', 'Anonymous'),
                'message': message,
                'type': message_type,
                'timestamp': datetime.now().isoformat(),
                'room': room
            }
            
            # 메시지 히스토리에 추가
            self.message_history.append(message_data)
            
            # 룸에 메시지 브로드캐스트
            self.socketio.emit('message_received', message_data, room=room)
            
            # 관리자에게 알림 (일반 사용자 메시지인 경우)
            if not user_info.get('is_admin', False) and room == 'users':
                self.socketio.emit('user_message', message_data, room='admin')
            
            logger.info(f"메시지 전송: {user_id} -> {room}")
        
        @self.socketio.on('typing_start')
        def handle_typing_start(data):
            """타이핑 시작 알림"""
            room = data.get('room', 'users')
            user_id = request.sid
            user_info = self.connected_users.get(user_id, {})
            
            typing_data = {
                'user_id': user_id,
                'username': user_info.get('username', 'Anonymous'),
                'timestamp': datetime.now().isoformat()
            }
            
            self.socketio.emit('user_typing', typing_data, room=room, include_self=False)
        
        @self.socketio.on('typing_stop')
        def handle_typing_stop(data):
            """타이핑 중지 알림"""
            room = data.get('room', 'users')
            user_id = request.sid
            
            self.socketio.emit('user_stopped_typing', {
                'user_id': user_id,
                'timestamp': datetime.now().isoformat()
            }, room=room, include_self=False)
        
        @self.socketio.on('agent_changed')
        def handle_agent_changed(data):
            """에이전트 변경 알림"""
            agent_id = data.get('agent_id')
            agent_name = data.get('agent_name')
            user_id = request.sid
            
            if agent_id:
                # 사용자에게 에이전트 변경 확인
                emit('agent_change_confirmed', {
                    'agent_id': agent_id,
                    'agent_name': agent_name,
                    'timestamp': datetime.now().isoformat()
                })
                
                # 관리자에게 에이전트 변경 알림
                self.socketio.emit('user_agent_changed', {
                    'user_id': user_id,
                    'agent_id': agent_id,
                    'agent_name': agent_name,
                    'timestamp': datetime.now().isoformat()
                }, room='admin')
                
                logger.info(f"에이전트 변경: {user_id} -> {agent_name}")
        
        @self.socketio.on('request_help')
        def handle_request_help(data):
            """도움말 요청"""
            user_id = request.sid
            user_info = self.connected_users.get(user_id, {})
            help_type = data.get('type', 'general')
            message = data.get('message', '')
            
            help_request = {
                'user_id': user_id,
                'username': user_info.get('username', 'Anonymous'),
                'help_type': help_type,
                'message': message,
                'timestamp': datetime.now().isoformat()
            }
            
            # 관리자에게 도움말 요청 알림
            self.socketio.emit('help_requested', help_request, room='admin')
            
            # 사용자에게 요청 확인
            emit('help_request_sent', {
                'message': '도움말 요청이 전송되었습니다.',
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"도움말 요청: {user_id} - {help_type}")
        
        @self.socketio.on('admin_broadcast')
        def handle_admin_broadcast(data):
            """관리자 브로드캐스트"""
            user_info = self.connected_users.get(request.sid, {})
            
            # 관리자 권한 확인
            if not user_info.get('is_admin', False):
                emit('error', {'message': '관리자 권한이 필요합니다.'})
                return
            
            message = data.get('message', '').strip()
            target_room = data.get('room', 'users')
            message_type = data.get('type', 'announcement')
            
            if not message:
                emit('error', {'message': '메시지가 비어있습니다.'})
                return
            
            broadcast_data = {
                'id': f"broadcast_{datetime.now().timestamp()}",
                'message': message,
                'type': message_type,
                'from': 'admin',
                'timestamp': datetime.now().isoformat(),
                'room': target_room
            }
            
            # 대상 룸에 브로드캐스트
            self.socketio.emit('admin_broadcast', broadcast_data, room=target_room)
            
            logger.info(f"관리자 브로드캐스트: {target_room} - {message}")
        
        @self.socketio.on('get_online_users')
        def handle_get_online_users():
            """온라인 사용자 목록 조회"""
            user_info = self.connected_users.get(request.sid, {})
            
            # 관리자 권한 확인
            if not user_info.get('is_admin', False):
                emit('error', {'message': '관리자 권한이 필요합니다.'})
                return
            
            online_users = []
            for user_id, info in self.connected_users.items():
                if not info.get('is_admin', False):
                    online_users.append({
                        'user_id': user_id,
                        'connected_at': info.get('connected_at'),
                        'ip': info.get('ip'),
                        'user_agent': info.get('user_agent')
                    })
            
            emit('online_users', {
                'users': online_users,
                'total_count': len(online_users),
                'timestamp': datetime.now().isoformat()
            })
    
    def send_notification(self, user_id: str, notification: Dict[str, Any]):
        """특정 사용자에게 알림 전송"""
        try:
            self.socketio.emit('notification', notification, room=user_id)
            logger.info(f"알림 전송: {user_id}")
        except Exception as e:
            logger.error(f"알림 전송 실패: {e}")
    
    def broadcast_notification(self, notification: Dict[str, Any], room: str = 'users'):
        """룸 전체에 알림 브로드캐스트"""
        try:
            self.socketio.emit('notification', notification, room=room)
            logger.info(f"알림 브로드캐스트: {room}")
        except Exception as e:
            logger.error(f"알림 브로드캐스트 실패: {e}")
    
    def send_system_alert(self, alert_type: str, message: str, severity: str = 'info'):
        """시스템 알림 전송"""
        alert_data = {
            'type': 'system_alert',
            'alert_type': alert_type,
            'message': message,
            'severity': severity,
            'timestamp': datetime.now().isoformat()
        }
        
        self.broadcast_notification(alert_data, 'admin')
        logger.info(f"시스템 알림: {alert_type} - {message}")
    
    def send_agent_change_notification(self, user_id: str, old_agent: str, new_agent: str):
        """에이전트 변경 알림 전송"""
        notification = {
            'type': 'agent_change',
            'old_agent': old_agent,
            'new_agent': new_agent,
            'message': f'에이전트가 {old_agent}에서 {new_agent}로 변경되었습니다.',
            'timestamp': datetime.now().isoformat()
        }
        
        self.send_notification(user_id, notification)
    
    def send_performance_alert(self, metric: str, value: float, threshold: float):
        """성능 알림 전송"""
        alert_data = {
            'type': 'performance_alert',
            'metric': metric,
            'value': value,
            'threshold': threshold,
            'message': f'{metric}이 임계값({threshold})을 초과했습니다. 현재값: {value}',
            'timestamp': datetime.now().isoformat()
        }
        
        self.broadcast_notification(alert_data, 'admin')
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """연결 통계 조회"""
        admin_count = sum(1 for user in self.connected_users.values() if user.get('is_admin', False))
        user_count = len(self.connected_users) - admin_count
        
        return {
            'total_connections': len(self.connected_users),
            'admin_connections': admin_count,
            'user_connections': user_count,
            'rooms': {room: len(users) for room, users in self.rooms.items()},
            'message_count': len(self.message_history)
        }
    
    def get_message_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """메시지 히스토리 조회"""
        return self.message_history[-limit:] if self.message_history else []
    
    def clear_message_history(self):
        """메시지 히스토리 초기화"""
        self.message_history.clear()
        logger.info("메시지 히스토리 초기화")


# 전역 WebSocket 서비스 인스턴스
websocket_service = None


def initialize_websocket_service(socketio: SocketIO):
    """WebSocket 서비스 초기화"""
    global websocket_service
    websocket_service = WebSocketService(socketio)
    return websocket_service


def get_websocket_service() -> Optional[WebSocketService]:
    """WebSocket 서비스 인스턴스 반환"""
    return websocket_service
