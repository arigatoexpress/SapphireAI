# Cloud Trader

Minimal, production-focused trading service for executing strategies on the Aster DEX. The repository has been redesigned from first principles to keep only the pieces required to run a lean cloud deployment.

## What’s Inside

```
cloud_trader/    # Core package (config, secrets, REST client, risk + strategy, service)
run_live_trader.py  # FastAPI entrypoint exposing /healthz, /start, /stop
Dockerfile       # Container image tailored for Cloud Run / GKE Autopilot
requirements.txt # Slim dependency set (FastAPI, aiohttp, pydantic, GCP secrets)
pyproject.toml   # Packaging metadata for the new module layout
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
```

Endpoints:

- `GET /healthz` – service state & last error
- `POST /start` – spins up the trading loop asynchronously
- `POST /stop` – shuts down the loop

If keys are not present or `ENABLE_PAPER_TRADING=true`, the bot runs in deterministic paper-trading mode with generated data so the deployment pipeline can still be exercised safely.

## Configuration & Secrets

Configuration lives in `cloud_trader.config.Settings`. Values come from environment variables (or `.env`) and include:

- `ASTER_API_KEY`, `ASTER_SECRET_KEY`
- `ASTER_REST_URL`, `ASTER_WS_URL`
- Trading inputs such as `symbols`, `decision_interval_seconds`, risk limits

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
echo -n "your-key" | gcloud secrets create ASTER_API_KEY --data-file=-
echo -n "your-secret" | gcloud secrets create ASTER_SECRET_KEY --data-file=-
```

## Service Internals

- **client:** thin async wrapper for the REST `fapi` routes (ping, ticker, market orders, cancel-all)
- **strategy:** single momentum signal that reacts to ±2.5% 24h changes
- **risk:** guards to cap total exposure, per-position risk, and concurrency
- **service:** orchestrates the loop, wiring together secrets, strategy, risk, and order execution
- **api:** FastAPI façade used by `run_live_trader.py`

The code intentionally avoids complex frameworks, background schedulers, or deep inheritance trees to keep behaviour transparent and debuggable.

See [ARCHITECTURE.md](ARCHITECTURE.md) for a diagrammed overview of the components and deployment flow.

## Security & Reliability

- Secrets fetched at runtime and never committed
- Minimal dependency surface (no ML/GPU toolchains, dashboards, or unused SDKs)
- Client requests are serialized via an asyncio lock to avoid throttling issues
- Paper-trading mode lets CI/CD smoke-test without live capital

## Contributing

1. Fork the repo & create a feature branch
2. Keep changes tightly scoped to the lean architecture
3. Run `pytest` (or `python -m compileall cloud_trader`) to sanity-check
4. Open a PR describing the behaviour change

## License

MIT — see [LICENSE](LICENSE).