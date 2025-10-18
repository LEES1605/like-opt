# ============== [01] imports & docstring — START ==============
"""
Persist path resolver (SSOT) - PathResolver 클래스 사용

이 모듈은 이제 PathResolver 클래스를 사용하여 경로 해석을 수행합니다.
기존 함수들은 호환성을 위해 유지되지만, 내부적으로는 PathResolver를 사용합니다.
"""
from __future__ import annotations

from pathlib import Path

__all__ = ["effective_persist_dir", "share_persist_dir_to_session"]
# ============== [01] imports & docstring — END ==============


# ============== [02] effective dir — START ==============
def effective_persist_dir() -> Path:
    """
    Single source of truth (SSOT) for persist directory.
    계획에 맞는 단순한 경로 반환.
    """
    return Path("data/persist")
# ============== [02] effective dir — END ==============


# ============== [03] share to session — START ==============
def share_persist_dir_to_session(p: Path) -> None:
    """Flask 환경에서는 세션 공유 불필요 (no-op)."""
    # Flask 환경에서는 persist 디렉토리를 세션에 공유할 필요 없음
    pass
# ============== [03] share to session — END ==============
