# Cloud Trader

Minimal, production-focused trading service for executing strategies on the Aster DEX. The repository has been redesigned from first principles to keep only the pieces required to run a lean cloud deployment.

## What’s Inside

```
cloud_trader/            # Core package (config, secrets, REST client, risk + strategy, service)
cloud_trader/orchestrator/ # Wallet-level risk gateway (single API key, guardrails, kill switch)
infra/model_serving/     # Dockerized llama.cpp + vLLM sandboxes for model experimentation
run_live_trader.py       # FastAPI entrypoint exposing /healthz, /start, /stop
Dockerfile               # Container image tailored for Cloud Run / GKE Autopilot
requirements.txt         # Slim dependency set (FastAPI, aiohttp, pydantic, redis, etc.)
pyproject.toml           # Packaging metadata for the new module layout
cloud-trader-dashboard   # React + Vite operational dashboard
```

Everything else from the historical project (dashboards, ML training loops, arena orchestration, GPU toolchains, dashboards, etc.) has been removed to reduce attack surface and maintenance overhead.

## Quick Start

```bash
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Optional: export credentials locally instead of using Secret Manager
export ASTER_API_KEY="your-key"
export ASTER_SECRET_KEY="your-secret"

python run_live_trader.py --host 0.0.0.0 --port 8080

# Optional: start wallet orchestrator on :8082
python run_orchestrator.py --host 0.0.0.0 --port 8082
```

Endpoints:

- `GET /healthz` – service state & last error
- `POST /start` / `POST /stop` – control the trading loop lifecycle
- `POST /inference/decisions` – record model outputs for telemetry fan-out
- `POST /inference/chat` – proxy OpenAI-compatible chat requests to llama.cpp/vLLM
- `GET /streams/{decisions|positions|reasoning}` – inspect Redis Streams snapshots

Orchestrator API (optional, default `:8082`):

- `POST /order/{bot_id}` – route validated orders through the centralized wallet
- `POST /emergency_stop` – cancel open orders and flatten exposure
- `POST /register_decision` – persist model rationales without executing trades

If keys are not present or `ENABLE_PAPER_TRADING=true`, the bot runs in deterministic paper-trading mode with generated data so the deployment pipeline can still be exercised safely.

## Configuration & Secrets

Configuration lives in `cloud_trader.config.Settings`. Values come from environment variables (or `.env`) and include:

- `ASTER_API_KEY`, `ASTER_SECRET_KEY`
- `ASTER_REST_URL`, `ASTER_WS_URL`
- Trading inputs such as `symbols`, `decision_interval_seconds`, risk limits
- Messaging & inference:
  - `REDIS_URL` (Redis Streams telemetry, defaults to `redis://localhost:6379`)
  - `MODEL_ENDPOINT` (OpenAI-compatible base URL for llama.cpp/vLLM)
  - `BOT_ID` (tag embedded in client order IDs/telemetry)
- Optimisation knobs:
  - `MOMENTUM_THRESHOLD`, `NOTIONAL_FRACTION`
  - `BANDIT_EPSILON`, `TRAILING_STOP_BUFFER`, `TRAILING_STEP`
  - `EXPECTED_WIN_RATE`, `REWARD_TO_RISK`
  - `VOLATILITY_DELEVER_THRESHOLD`, `AUTO_DELEVER_FACTOR`

`cloud_trader.secrets.load_credentials()` loads credentials from env variables first, and falls back to Google Secret Manager when the `GCP_PROJECT`/`GOOGLE_CLOUD_PROJECT` env var is defined.

## Deployment

### Container Image

```bash
docker build -t cloud-trader:latest .
docker run -p 8080:8080 cloud-trader:latest
```

### Google Cloud Run

```bash
gcloud builds submit --tag gcr.io/$PROJECT_ID/cloud-trader
gcloud run deploy cloud-trader \
  --image gcr.io/$PROJECT_ID/cloud-trader \
  --platform managed \
  --region us-central1 \
  --set-secrets ASTER_API_KEY=ASTER_API_KEY:latest,ASTER_SECRET_KEY=ASTER_SECRET_KEY:latest
```

### GCP Secret Manager

```bash
# Preferred: helper script adds new secret versions and updates local .env copies
scripts/update_aster_credentials.sh "$ASTER_API_KEY" "$ASTER_SECRET_KEY" $PROJECT_ID

# Manual alternative
echo -n "$ASTER_API_KEY" | gcloud secrets versions add ASTER_API_KEY --data-file=- --project $PROJECT_ID
echo -n "$ASTER_SECRET_KEY" | gcloud secrets versions add ASTER_SECRET_KEY --data-file=- --project $PROJECT_ID
```

## Service Internals

- **client:** thin async wrapper for the REST `fapi` routes (ping, ticker, market orders, cancel-all)
- **strategy:** momentum signal with configurable threshold/notional fraction
- **risk:** guards to cap total exposure, per-position risk, and concurrency
- **service:** orchestrates the loop, wiring together secrets, strategy, Redis Streams telemetry, and order execution
- **api:** FastAPI façade exposing lifecycle, inference proxy, and stream inspection endpoints
- **orchestrator:** wallet-level gateway enforcing centralized guardrails, idempotent order routing, and kill switch endpoints
- **optimization:** utilities (Optuna tuner, epsilon-greedy bandit) for auto-tuning trailing stops, capital allocation, and auto-delever logic (see `cloud_trader/optimization/optuna_runner.py`)

The code intentionally avoids complex frameworks, background schedulers, or deep inheritance trees to keep behaviour transparent and debuggable.

See [ARCHITECTURE.md](ARCHITECTURE.md) for a diagrammed overview of the components and deployment flow.

## Security & Reliability

- Secrets fetched at runtime and never committed
- Single-wallet architecture enforced by the orchestrator (centralized guardrails + deterministic client order IDs)
- Redis Stream telemetry for auditable decision/position trails
- Paper-trading mode lets CI/CD smoke-test without live capital

## Contributing

1. Fork the repo & create a feature branch
2. Keep changes tightly scoped to the lean architecture
3. Run `pytest` (or `python -m compileall cloud_trader`) to sanity-check
4. Open a PR describing the behaviour change

## License

MIT — see [LICENSE](LICENSE).

## Optimisation Toolkit

The `cloud_trader.optimization` package exposes helpers for tuning the live trader:

- `optimisation.bandit.EpsilonGreedyBandit` keeps track of per-symbol returns with reward clipping.
- `optimisation.trailing.optimise_trailing_stop` wraps Optuna to discover optimal trailing buffers.
- `python -m cloud_trader.optimization.optuna_runner --csv backtests/pnl.csv` tunes trailing stops against historical backtests.

Results can be written back to `.env` (`TRAILING_STOP_BUFFER`, `TRAILING_STEP`, `NOTIONAL_FRACTION`) before redeploying the trading service.