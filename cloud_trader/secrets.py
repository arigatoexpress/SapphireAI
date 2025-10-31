"""Utilities for loading secrets from environment or Google Secret Manager."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Optional


@dataclass(frozen=True)
class Credentials:
    api_key: Optional[str]
    api_secret: Optional[str]


def _load_from_env() -> Credentials:
    """Load credentials from process environment."""

    return Credentials(
        api_key=os.getenv("ASTER_API_KEY"),
        api_secret=os.getenv("ASTER_SECRET_KEY"),
    )


def _load_from_secret_manager() -> Credentials:
    """Attempt to load credentials from Google Secret Manager.

    Returns empty credentials if the SDK is unavailable or access fails.
    """

    try:
        from google.cloud import secretmanager  # type: ignore
    except Exception:
        return Credentials(api_key=None, api_secret=None)

    client = secretmanager.SecretManagerServiceClient()
    project_id = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
    if not project_id:
        return Credentials(api_key=None, api_secret=None)

    def access_secret(name: str) -> Optional[str]:
        secret_name = f"projects/{project_id}/secrets/{name}/versions/latest"
        try:
            response = client.access_secret_version(name=secret_name)
            return response.payload.data.decode("utf-8").strip()
        except Exception:
            return None

    return Credentials(
        api_key=access_secret("ASTER_API_KEY"),
        api_secret=access_secret("ASTER_SECRET_KEY"),
    )


@lru_cache(maxsize=1)
def load_credentials() -> Credentials:
    """Load credentials using env first, then fall back to Secret Manager."""

    env_creds = _load_from_env()
    if env_creds.api_key and env_creds.api_secret:
        return env_creds

    gcp_creds = _load_from_secret_manager()
    api_key = env_creds.api_key or gcp_creds.api_key
    api_secret = env_creds.api_secret or gcp_creds.api_secret
    return Credentials(api_key=api_key, api_secret=api_secret)
