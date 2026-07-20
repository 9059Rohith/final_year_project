"""Application configuration."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://mitra:mitrapass@localhost:5432/mitradb"
    SYNC_DATABASE_URL: str = "postgresql://mitra:mitrapass@localhost:5432/mitradb"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = "mitra-super-secret-jwt-key-change-in-production-minimum-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # App
    APP_ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 50

    # Admin
    ADMIN_EMAIL: str = "admin@mitra.app"
    ADMIN_PASSWORD: str = "Admin@2024"

    # TTS
    TTS_CACHE_DIR: str = "uploads/tts_cache"

    # Whisper
    WHISPER_MODEL: str = "base"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
