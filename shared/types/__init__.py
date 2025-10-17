"""
MAIC Flask Optimized - Shared Types

프론트엔드와 백엔드 간 공통으로 사용되는 타입 정의들입니다.
"""

from typing import Dict, List, Optional, Union
from enum import Enum

# 학습 모드
class LearningMode(str, Enum):
    GRAMMAR = "grammar"
    SENTENCE = "sentence"
    PASSAGE = "passage"

# 난이도
class Difficulty(str, Enum):
    ELEMENTARY = "elementary"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

# AI 제공자
class AIProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"

# API 응답 타입
class APIResponse:
    def __init__(self, success: bool = True, data: Optional[Dict] = None, 
                 message: str = "", error: Optional[str] = None):
        self.success = success
        self.data = data or {}
        self.message = message
        self.error = error
    
    def to_dict(self) -> Dict:
        return {
            "success": self.success,
            "data": self.data,
            "message": self.message,
            "error": self.error
        }

# 채팅 메시지 타입
class ChatMessage:
    def __init__(self, role: str, content: str, timestamp: Optional[str] = None):
        self.role = role  # 'user' or 'assistant'
        self.content = content
        self.timestamp = timestamp
    
    def to_dict(self) -> Dict:
        return {
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp
        }

# 사용자 세션 타입
class UserSession:
    def __init__(self, user_id: str, authenticated: bool = False, 
                 role: str = "student", preferences: Optional[Dict] = None):
        self.user_id = user_id
        self.authenticated = authenticated
        self.role = role
        self.preferences = preferences or {}
    
    def to_dict(self) -> Dict:
        return {
            "user_id": self.user_id,
            "authenticated": self.authenticated,
            "role": self.role,
            "preferences": self.preferences
        }
