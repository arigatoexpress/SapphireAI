# Cloud Trader Architecture Overview

## Runtime Flow

```
run_live_trader.py  →  FastAPI app (`cloud_trader.api.build_app`)  →  TradingService
                                                         │
                                                         ├── MomentumStrategy
                                                         ├── RiskManager
                                                         └── AsterClient (REST)
```

1. `run_live_trader.py` boots a FastAPI service exposing `/healthz`, `/start`, and `/stop`.
2. `TradingService` (in `cloud_trader/service.py`) owns the trading loop, fetching market data, running signals, dispatching orders, and updating health state.
3. `MomentumStrategy` issues BUY/SELL decisions based on 24h price change thresholds and allocates 5% of available balance per signal.
4. `RiskManager` enforces maximum total exposure, per-position risk, and concurrent position count before an order is submitted.
5. `AsterClient` is a minimal async REST wrapper around the Aster DEX Futures API (`/fapi` endpoints) with signed requests, reused session handling, and request serialization.

## Configuration & Secrets

- `cloud_trader/config.py` defines all runtime settings via `pydantic-settings`, loaded from environment variables or `.env`.
- `cloud_trader/secrets.py` first reads `ASTER_API_KEY` / `ASTER_SECRET_KEY` from the environment and falls back to Google Secret Manager when `GCP_PROJECT` is present.
- `env.example` documents the minimal set of variables.

## Deployment Pipeline

- `Dockerfile` builds a slim Python 3.11 image containing only the code, `requirements.txt`, and entrypoint.
- `deploy_cloud_run.sh` packages and deploys to Cloud Run, mounting secrets from Secret Manager.
- `.github/workflows/ci.yml` installs dependencies, runs flake8, and executes `pytest` for every push/PR to `main`.

## Tests & Health

- `tests/test_risk_manager.py` verifies that the risk guardrails block oversizing and concurrency violations.
- FastAPI `/healthz` endpoint surfaces service state so Cloud Run health checks can monitor the loop.

## Removed Components

All previous subsystems (arena orchestrator, dashboards, backtesting engines, GPU tooling, historical datasets, etc.) were removed to minimise failure surface area. The repository now consists solely of the code paths required to run the live trading loop on Cloud Run.

