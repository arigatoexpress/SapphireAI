# Current Architecture Documentation

## 1. Trading Pods Overview

### Core Services
- **cloud-trader**: Main API service (2 replicas, namespace: trading)
  - Image: `us-central1-docker.pkg.dev/sapphireinfinite/cloud-run-source-deploy/cloud-trader:latest`
  - Port: 8080
  - Resources: No limits (MVP)
  - Features: Paper trading enabled, MCP integration, Redis caching

### LLM Agent Pods
- **deepseek-momentum-bot**: DeepSeek v3 agent (1 replica)
  - Vertex AI endpoint: `deepseek-momentum-endpoint`
  - MCP coordinator integration enabled
- **qwen-momentum-bot**: Qwen agent (1 replica)
  - Vertex AI endpoint: `qwen-momentum-endpoint`
  - MCP coordinator integration enabled
- **fingpt-alpha-bot**: FinGPT agent (1 replica)
  - Vertex AI endpoint: `fingpt-alpha-endpoint`
  - MCP coordinator integration enabled
- **lagllama-degen-bot**: Lag-LLaMA agent (1 replica)
  - Vertex AI endpoint: `lagllama-degen-endpoint`
  - MCP coordinator integration enabled

### Trading Framework Pods
- **freqtrade-hft-bot**: Freqtrade HFT framework (1 replica)
  - Image: `us-central1-docker.pkg.dev/sapphireinfinite/cloud-run-source-deploy/freqtrade:latest`
  - Resources: CPU 500m-2000m, Memory 1Gi-4Gi
  - Strategy: AsterHFTStrategy
  - Exchange: AsterDex

- **hummingbot-market-maker**: Hummingbot market making (1 replica)
  - Image: `us-central1-docker.pkg.dev/sapphireinfinite/cloud-run-source-deploy/hummingbot:latest`
  - Resources: CPU 250m-1000m, Memory 512Mi-2Gi
  - Script: aster_market_maker.py
  - Exchange: AsterDex

### Infrastructure Pods
- **mcp-coordinator**: Multi-Component Protocol coordinator (1 replica)
  - Port: 8081
  - Resources: CPU 100m-500m, Memory 256Mi-1Gi
  - Purpose: Inter-agent communication and collaboration

- **redis-service**: Redis caching (not shown in deployments above, but referenced)

## 2. Vertex AI Endpoints

Current configured endpoints:
- `deepseek-momentum-endpoint`: DeepSeek v3 model for momentum trading
- `qwen-momentum-endpoint`: Qwen model for momentum trading
- `fingpt-alpha-endpoint`: FinGPT model for financial analysis
- `lagllama-degen-endpoint`: Lag-LLaMA model for time series prediction
- `profit-maximizer-endpoint`: Profit maximization model

All endpoints hosted in: `us-central1-aiplatform.googleapis.com/v1/projects/sapphireinfinite/locations/us-central1/endpoints/`

## 3. MCP Topics

### Pub/Sub Topics (from config.py):
- `decisions_topic`: Trading decisions and signals
- `positions_topic`: Position updates and management
- `reasoning_topic`: Agent reasoning and analysis

### Extended MCP Message Types (from mcp.py):
- HFT_SIGNAL: High-frequency trading signals
- MARKET_DATA: Real-time market data
- ORDER_EXECUTION: Order execution confirmations
- RISK_UPDATE: Risk management updates
- STRATEGY_ADJUSTMENT: Strategy parameter adjustments

## 4. Current Resource Allocation

### CPU/Memory Usage:
- Total baseline: ~2.35 CPU cores, ~7.5 GiB memory
- With GPU: Single L4 GPU for Vertex AI inference
- Budget target: <$1,000/month

### Autoscaling:
- HPA configured for Freqtrade and Hummingbot
- Custom metrics-based scaling planned

## 5. Networking and Communication

### Service Discovery:
- Kubernetes DNS for internal communication
- MCP coordinator at: `mcp-coordinator.trading.svc.cluster.local:8081`
- Redis at: `redis-service.trading.svc.cluster.local:6379`

### External APIs:
- AsterDex exchange API
- Telegram bot notifications
- Vertex AI endpoints
- BigQuery for data warehousing

## 6. Configuration Management

### ConfigMaps:
- `freqtrade-config`: Freqtrade configuration
- `freqtrade-strategies`: Trading strategies
- `hummingbot-config`: Hummingbot global config
- `hummingbot-scripts`: Market making scripts

### Secrets:
- `cloud-trader-secrets`: API keys, tokens, and credentials

## 7. Monitoring and Observability

### Health Checks:
- HTTP liveness/readiness probes on all services
- Startup probes for complex services

### Metrics:
- Prometheus exporters for HFT metrics
- BigQuery sinks for trade data
- Cloud Monitoring integration

## 8. Current Limitations

### MVP Constraints:
- No resource limits on main API service
- Single replicas for most services (except main API)
- Paper trading only
- Simplified networking

### Architecture Gaps:
- No dedicated portfolio orchestrator service
- Limited cross-agent communication beyond MCP
- No advanced risk management integration
- Basic monitoring setup
