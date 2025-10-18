"""
Session adapter for Flask session management
"""
from flask import session
from typing import Any, Optional


class SessionAdapter:
    """Flask session adapter"""
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get value from session"""
        return session.get(key, default)
    
    def set(self, key: str, value: Any) -> None:
        """Set value in session"""
        session[key] = value
    
    def delete(self, key: str) -> None:
        """Delete key from session"""
        session.pop(key, None)
    
    def clear(self) -> None:
        """Clear all session data"""
        session.clear()


# Global instance
session_adapter = SessionAdapter()
