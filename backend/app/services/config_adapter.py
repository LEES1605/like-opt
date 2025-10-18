"""
Configuration adapter for environment variables and settings
"""
import os
from typing import Any, Optional


class ConfigAdapter:
    """Configuration adapter"""
    
    def get_secret(self, key: str, default: Any = None) -> Any:
        """Get secret from environment variables"""
        return os.getenv(key, default)
    
    def get_config(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        return os.getenv(key, default)
    
    def set_config(self, key: str, value: Any) -> None:
        """Set configuration value (environment variable)"""
        os.environ[key] = str(value)


# Global instance
config_adapter = ConfigAdapter()
