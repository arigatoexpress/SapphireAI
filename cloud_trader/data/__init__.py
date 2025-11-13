"""Data ingestion and feature-preparation utilities for the trading stack."""

from .feature_pipeline import (
    build_feature_repo,
    embed_news_headlines,
    feature_row,
    ingest_onchain_metrics,
    load_feature_df,
)

__all__ = [
    "build_feature_repo",
    "load_feature_df",
    "ingest_onchain_metrics",
    "feature_row",
    "embed_news_headlines",
]

