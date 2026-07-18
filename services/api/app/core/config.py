from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://demeter:demeter@localhost:5432/demeter_carbono"
    cors_origins_raw: str = Field(
        default="http://localhost:8081,http://localhost:19006", alias="CORS_ORIGINS"
    )
    demo_mode: bool = True

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
