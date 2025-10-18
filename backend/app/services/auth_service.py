"""
Authentication service
"""
from typing import Dict, Any, Optional


class AuthService:
    """Authentication service for admin login"""
    
    def __init__(self):
        self.admin_password = "1234"  # 기본 관리자 비밀번호
    
    def authenticate_admin(self, password: str) -> bool:
        """관리자 인증"""
        return password == self.admin_password
    
    def get_admin_info(self) -> Dict[str, Any]:
        """관리자 정보 반환"""
        return {
            "role": "admin",
            "permissions": ["read", "write", "delete"]
        }


# Global instance
auth_service = AuthService()
