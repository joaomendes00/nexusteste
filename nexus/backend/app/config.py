from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    DATABASE_URL: str = "postgresql+asyncpg://nexus:nexus@localhost:5432/nexus"
    SECRET_KEY: str = "change-me-in-production"
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"
    REDIS_URL: str = "redis://localhost:6379/0"


settings = Settings()
