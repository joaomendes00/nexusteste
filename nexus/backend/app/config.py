from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    DATABASE_URL: str = "sqlite+aiosqlite:///./nexus.db"
    SECRET_KEY: str = "change-me-in-production"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-70b-8192"


settings = Settings()
