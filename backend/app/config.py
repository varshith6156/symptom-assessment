import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    LLM_MODE: str = "mock"  # "mock" or "live"
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_BASE_URL: str = "https://api.openai.com/v1"
    
    FRONTEND_URL: str = "http://localhost:5173"
    SESSION_TTL_MINUTES: int = 30
    MAX_SESSIONS: int = 500
    MAX_TRANSCRIPT_MESSAGES: int = 40
    
    # Emergency region and dial number configuration
    EMERGENCY_NUMBER: str = "911"
    EMERGENCY_REGION: str = "US / Canada"
    
    # Request limits
    MAX_MESSAGE_LENGTH: int = 1000
    MIN_MESSAGE_LENGTH: int = 1
    
    # Rate limit (max requests per minute per session)
    RATE_LIMIT_PER_MINUTE: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
