"""Feature ingestion stubs for Feast and embedding pipelines."""

from __future__ import annotations

from datetime import datetime
from typing import Iterable, Mapping, Sequence

import pandas as pd

try:  # Optional dependencies documented in README
    from feast import FeatureStore  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    FeatureStore = None  # type: ignore

try:
    from sentence_transformers import SentenceTransformer  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    SentenceTransformer = None  # type: ignore


def build_feature_repo(repo_path: str) -> FeatureStore | None:
    """Initialise a Feast feature store if the dependency is available."""

    if FeatureStore is None:
        return None
    return FeatureStore(repo_path=repo_path)


def ingest_onchain_metrics(store: FeatureStore, rows: Iterable[Mapping[str, object]]) -> None:
    """Placeholder ingestion hook for Glassnode/on-chain metrics."""

    if FeatureStore is None:
        raise RuntimeError("Feast not installed. See docs/monitoring/SETUP.md")
    store.write_to_online_store("onchain_metrics", list(rows))


def embed_news_headlines(headlines: list[str]) -> list[list[float]]:
    """Embed sentiment/news data using SentenceTransformers."""

    if SentenceTransformer is None:
        raise RuntimeError("sentence-transformers not installed. See docs/monitoring/SETUP.md")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    return model.encode(headlines, convert_to_numpy=False).tolist()


def feature_row(symbol: str, price: float, funding: float, volatility: float) -> Mapping[str, object]:
    return {
        "symbol": symbol,
        "price": price,
        "funding": funding,
        "volatility": volatility,
        "ingested_at": datetime.utcnow(),
    }


def load_feature_df(
    repo_path: str,
    feature_refs: Sequence[str],
    entity_rows: Iterable[Mapping[str, object]],
) -> pd.DataFrame:
    """Fetch historical features from Feast into a DataFrame.

    Parameters
    ----------
    repo_path: str
        Path to the Feast repo (e.g. ``infra/data_toolkit/feast_repo``).
    feature_refs: Sequence[str]
        Feature references (`view:feature` strings).
    entity_rows: Iterable[Mapping[str, object]]
        Iterable of rows containing entity keys and event timestamps.
    """

    if FeatureStore is None:
        raise RuntimeError("Feast not installed. Install optional deps as per infra/data_toolkit/README.md")

    store = FeatureStore(repo_path=repo_path)
    entity_df = pd.DataFrame(list(entity_rows))
    retrieval_job = store.get_historical_features(entity_df=entity_df, features=list(feature_refs))
    return retrieval_job.to_df().sort_values("event_timestamp")

