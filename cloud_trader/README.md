# Cloud Trader 🤖

The main trading engine for SapphireAI.

## Overview

Cloud Trader is a Python FastAPI service that:
- Manages **3 specialized AI trading agents**
- Executes perpetual futures trades on Aster DEX
- Provides WebSocket connections for the dashboard
- Sends Telegram notifications (optional)
- Self-tunes agent parameters based on performance

## Agents

| Agent | TP / SL | Specialization |
|-------|---------|----------------|
| Momentum Trader | 2.5% / 1.2% | Breakout hunting |
| Market Maker | 0.8% / 0.4% | Bid-ask spreads |
| Swing Trader | 5% / 2% | Multi-day trends |

## Key Files

| File | Description |
|------|-------------|
| `trading_service.py` | Main trading loop (2600 lines) |
| `definitions.py` | Agent definitions & MinimalAgentState |
| `api.py` | FastAPI application & WebSocket |
| `client.py` | Aster DEX API client |
| `mcp.py` | MCP messaging for agent coordination |

## Running Locally

```bash
# From project root
python -m cloud_trader.api
```

## Environment Variables

```bash
ASTER_API_KEY=your_key
ASTER_SECRET_KEY=your_secret
GEMINI_API_KEY=your_gemini_key
TELEGRAM_BOT_TOKEN=optional
TELEGRAM_CHAT_ID=optional
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/snapshot` | GET | Full dashboard data |
| `/api/agents` | GET | Agent list with stats |
| `/ws/dashboard` | WS | Real-time WebSocket updates |

## Deployment

```bash
gcloud builds submit --config cloudbuild.yaml .
```
