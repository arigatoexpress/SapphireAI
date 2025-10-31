"""Configuration management for the lean cloud trader."""

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration derived from environment variables or .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", env_file_encoding="utf-8")

    # API credentials
    aster_api_key: str | None = Field(default=None, validation_alias="ASTER_API_KEY")
    aster_api_secret: str | None = Field(default=None, validation_alias="ASTER_SECRET_KEY")

    # API endpoints
    rest_base_url: str = Field(default="https://fapi.asterdex.com", validation_alias="ASTER_REST_URL")
    ws_base_url: str = Field(default="wss://fstream.asterdex.com", validation_alias="ASTER_WS_URL")

    # Trading configuration
    symbols: List[str] = Field(default_factory=lambda: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "SUIUSDT"])
    decision_interval_seconds: int = Field(default=30, ge=5, le=300)
    max_concurrent_positions: int = Field(default=3, ge=1, le=10)
    max_position_risk: float = Field(default=0.10, gt=0, le=0.5)
    max_drawdown: float = Field(default=0.20, gt=0, le=0.8)

    # Deployment / observability
    log_level: str = Field(default="INFO")
    health_check_path: str = Field(default="/healthz")

    # Feature flags
    enable_paper_trading: bool = Field(default=True, validation_alias="ENABLE_PAPER_TRADING")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings()
