from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    app_name: str = "elara-nexus-backend"
    app_auth_token: str = "local-dev-token"

    app_cors_origins: str = "http://localhost:3000"
    app_request_timeout_seconds: float = 10.0
    app_max_request_body_bytes: int = 1_000_000

    app_rate_limit_window_seconds: int = 60
    app_rate_limit_requests_per_ip: int = 120
    app_rate_limit_requests_per_token: int = 240

    app_db_url: str = "sqlite:///./data/elara_nexus.db"
    app_db_engine: str = "sqlite"

    app_vector_dimensions: int = 8

    litellm_base_url: str | None = None
    litellm_api_key: str | None = None
    litellm_model: str = "gpt-4o-mini"

    langfuse_host: str | None = None
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.app_cors_origins.split(",") if item.strip()]

    @property
    def is_postgres(self) -> bool:
        return self.app_db_engine == "postgres" or self.app_db_url.startswith("postgresql")


@lru_cache
def get_settings() -> Settings:
    return Settings()
