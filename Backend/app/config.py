"""
app/config.py — Pydantic-Settings configuration for all environments.
"""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ────────────────────────────────────────────────────────────────
    app_env: str = Field(default="development")
    secret_key: str = Field(default="dev-secret-key-change-me")
    cors_origins: str = Field(default="http://localhost:5173,http://localhost:3000")

    # ── Database ───────────────────────────────────────────────────────────
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/codeaudit"
    )

    # ── Redis ──────────────────────────────────────────────────────────────
    redis_url: str = Field(default="redis://localhost:6379/0")

    # ── External APIs ──────────────────────────────────────────────────────
    github_token: str = Field(default="")
    anthropic_api_key: str = Field(default="")
    supabase_url: str = Field(default="")

    # ── Analysis weights ───────────────────────────────────────────────────
    weight_code_quality: float = Field(default=0.30)
    weight_architecture: float = Field(default=0.20)
    weight_testing: float = Field(default=0.25)
    weight_performance: float = Field(default=0.15)
    weight_deployment: float = Field(default=0.10)

    # ── Computed properties ────────────────────────────────────────────────
    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @field_validator("weight_code_quality", "weight_architecture",
                     "weight_testing", "weight_performance", "weight_deployment",
                     mode="before")
    @classmethod
    def validate_weight(cls, v: float) -> float:
        v = float(v)
        if not (0.0 <= v <= 1.0):
            raise ValueError("Weight must be between 0.0 and 1.0")
        return v


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — call this everywhere."""
    return Settings()


settings = get_settings()
