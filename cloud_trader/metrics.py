"""Prometheus metrics used across the Cloud Trader service."""

from __future__ import annotations

from prometheus_client import Counter, Gauge, Histogram


# --- Trading loop level metrics -------------------------------------------------

TRADING_DECISIONS = Counter(
    "trading_decisions_total",
    "Total trading decisions emitted by the trading loop",
    labelnames=["bot_id", "symbol", "action"],
)

PORTFOLIO_BALANCE = Gauge(
    "trading_portfolio_balance_usd",
    "Current portfolio balance reported by the trading service",
)

PORTFOLIO_LEVERAGE = Gauge(
    "trading_portfolio_leverage_ratio",
    "Current portfolio leverage based on total exposure / balance",
)

POSITION_SIZE = Gauge(
    "trading_open_position_notional",
    "Latest notional exposure per symbol",
    labelnames=["symbol"],
)

RISK_LIMITS_BREACHED = Counter(
    "trading_risk_limits_breached_total",
    "Count of events where risk checks prevented an action",
    labelnames=["limit_type"],
)

RATE_LIMIT_EVENTS = Counter(
    "aster_rate_limit_events_total",
    "Occurrences of 429 responses from the Aster API",
    labelnames=["component", "endpoint"],
)


# --- External integration metrics ------------------------------------------------

ASTER_API_REQUESTS = Counter(
    "aster_api_requests_total",
    "Number of requests performed against the Aster REST API",
    labelnames=["component", "method", "endpoint", "status"],
)

ASTER_API_LATENCY = Histogram(
    "aster_api_request_duration_seconds",
    "Latency distribution for Aster REST API calls",
    labelnames=["component", "method", "endpoint"],
    buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0),
)

REDIS_STREAM_FAILURES = Counter(
    "redis_stream_failures_total",
    "Telemetry publish attempts that failed due to Redis errors",
    labelnames=["stream"],
)


# --- LLM related telemetry -------------------------------------------------------

LLM_CONFIDENCE = Histogram(
    "trading_llm_confidence",
    "Confidence distribution for LLM generated decisions",
    buckets=(0.1, 0.3, 0.5, 0.7, 0.9, 1.0),
)

LLM_INFERENCE_TIME = Histogram(
    "trading_llm_inference_duration_seconds",
    "Duration for external LLM inference calls",
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0),
)


