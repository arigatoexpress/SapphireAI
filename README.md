# SapphireAI 💎

<div align="center">

[![GCP](https://img.shields.io/badge/Deployed%20on-Google%20Cloud-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

**Autonomous AI Trading System for Aster DEX Perpetual Futures**

[Live Dashboard](https://sapphire-479610.web.app) • [Backend API](https://cloud-trader-267358751314.northamerica-northeast1.run.app)

</div>

---

## Overview

SapphireAI is a **3-agent autonomous trading system** that trades perpetual futures on [Aster DEX](https://aster.exchange). Each agent uses Google's **Gemini 2.0 Flash** for market analysis and self-tunes its parameters based on performance.

### Key Features
- ⚡ **3 Specialized Agents** - Momentum, Market Maker, Swing Trader
- 🧠 **Self-Tuning** - Agents adjust confidence thresholds based on wins/losses
- 📈 **50x Leverage** - Maximum leverage available per agent
- 🔄 **Dynamic Symbols** - Trades all available markets, not a fixed list
- 📊 **Real-time Dashboard** - WebSocket-powered React frontend

---

## Agents

| Agent | Specialization | TP / SL | Default Leverage |
|-------|---------------|---------|------------------|
| 📈 **Momentum Trader** | Breakout hunting | 2.5% / 1.2% | 20x |
| ⚡ **Market Maker** | Bid-ask spreads | 0.8% / 0.4% | 25x |
| 🧠 **Swing Trader** | Multi-day trends | 5% / 2% | 10x |

### Self-Tuning Mechanism
Each agent has `adaptive_params` that adjust after every closed trade:
- **Win** → Lower confidence threshold by 1% (take more trades)
- **Loss** → Raise confidence threshold by 2% (be more selective)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GCP Cloud Run                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │           trading_service.py (2600 LOC)          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │   │
│  │  │ Momentum │ │  Market  │ │  Swing   │        │   │
│  │  │  Trader  │ │  Maker   │ │  Trader  │        │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘        │   │
│  │       └────────────┼────────────┘               │   │
│  │                    ▼                            │   │
│  │            Gemini 2.0 Flash                     │   │
│  │                    │                            │   │
│  │                    ▼                            │   │
│  │            Aster DEX API                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼ WebSocket
┌─────────────────────────────────────────────────────────┐
│                Firebase Hosting                         │
│              React Dashboard (Vite)                     │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
AIAster/
├── cloud_trader/           # Python backend (FastAPI)
│   ├── trading_service.py  # Main trading loop (2600 lines)
│   ├── definitions.py      # Agent definitions & MinimalAgentState
│   ├── api.py              # FastAPI endpoints
│   ├── mcp.py              # MCP messaging
│   └── client.py           # Aster DEX API client
├── trading-dashboard/      # React frontend (Vite)
├── Dockerfile              # Backend container
├── cloudbuild.yaml         # GCP Cloud Build config
└── terraform/              # Infrastructure as Code
```

---

## Trading Logic

1. **Every ~60 seconds:** Sample 20 random symbols from Aster market structure
2. **For each symbol:** 
   - Skip if already have open position
   - Skip if traded in last 30 minutes (cooldown)
3. **For each agent:**
   - Fetch OHLCV data
   - Run Gemini analysis
   - If `confidence >= threshold` → execute trade
4. **Place TP/SL** as limit/stop orders on Aster DEX
5. **After trade closes:** Call `adjust_params()` for self-tuning

---

## Deployment

### Backend (Cloud Run)
```bash
gcloud builds submit --config cloudbuild.yaml .
```

### Frontend (Firebase)
```bash
cd trading-dashboard && npm run build && firebase deploy
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ASTER_API_KEY` | Aster DEX API key |
| `ASTER_SECRET_KEY` | Aster DEX secret |
| `GEMINI_API_KEY` | Google Gemini API key |
| `TELEGRAM_BOT_TOKEN` | Optional: Telegram alerts |
| `TELEGRAM_CHAT_ID` | Optional: Telegram chat ID |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/snapshot` | GET | Full dashboard data |
| `/api/agents` | GET | Agent list |
| `/ws/dashboard` | WS | Real-time WebSocket |

---

## License

Proprietary - All Rights Reserved

---

<div align="center">
<sub>Built with 💎 by Sapphire Team | December 2025</sub>
</div>
