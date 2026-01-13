"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path

# Get the project root directory (two levels up from this file)
# my-crm-app/backend/app/config.py -> my-crm-app/
PROJECT_ROOT = Path(__file__).parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database
    DATABASE_URL: str = "postgresql://crm_user:crm_password@localhost:5432/crm_database"

    # API Keys
    GEMINI_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # App Settings
    APP_NAME: str = "AI CRM API"
    DEBUG: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        # Use the centralized .env file at project root
        env_file = str(ENV_FILE)
        extra = "allow"


# Global settings instance
settings = Settings()
