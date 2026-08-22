from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment / .env."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Supabase. Accept several common env var names for the same value so the
    # backend works whether the project uses SUPABASE_* or NEXT_PUBLIC_* naming.
    supabase_url: str = Field(
        default="",
        validation_alias=AliasChoices(
            "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"
        ),
    )
    # The backend requires a SECRET / service_role key (bypasses RLS). The
    # publishable/anon key is NOT sufficient for server-side writes.
    supabase_secret_key: str = Field(
        default="",
        validation_alias=AliasChoices(
            "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"
        ),
    )
    supabase_jwks_url: str = ""
    supabase_jwt_secret: str = ""

    # World Labs
    world_labs_api_key: str = ""
    world_labs_base_url: str = "https://api.worldlabs.ai"

    # Weather
    open_meteo_base_url: str = "https://api.open-meteo.com"

    # n8n
    n8n_webhook_secret: str = ""

    # App
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"
    app_env: str = "development"

    # Mock flags
    mock_world_labs: bool = True
    mock_weather: bool = True

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_secret_key)

    @property
    def cors_origins(self) -> list[str]:
        origins = {self.frontend_url, "http://localhost:5173", "http://127.0.0.1:5173"}
        return [o for o in origins if o]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
