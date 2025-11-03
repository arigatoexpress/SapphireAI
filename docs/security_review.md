# Sapphire AI Platform – Security Review

_Run date: 2025-11-03_

## Scope
- Cloud Run services: `cloud-trader`, `wallet-orchestrator`
- Cloud Load Balancer + managed certificates (`aster-cert`, `sapphiretrade-cert`)
- Supporting resources: Redis, Prometheus metrics, MCP coordinator, Firebase auth + dashboard

## Dependency posture
- **Python backend** – `pip-audit -r requirements.txt`
  - Result: _No known vulnerabilities found_
  - Libraries: FastAPI, uvicorn, aiohttp, redis, structlog, etc.
- **Frontend** – `npm audit --production`
  - Result: _0 vulnerabilities_
  - Dependencies limited to React, Vite, Tailwind, Firebase SDK, charting libs.

## Secrets & configuration
- All Aster, Redis, Telegram, and Firebase secrets stored in **Secret Manager**; mounted via Cloud Run runtime env vars.
- `.env` example updated to include new Firebase + MCP keys; ensure `.env` never committed.
- Cloud Run services currently accept all ingress (pending final LB validation). Once `sapphiretrade.xyz` cert is **ACTIVE**, restrict to `internal-and-cloud-load-balancing`.

## Network & perimeter
- External access terminates at HTTPS LB with managed certs.
- Static IP `34.117.165.111` preserved for Aster API allow-lists.
- Pending items:
  - Cloud Armor policy (optional) to rate-limit and geo-fence API ingress.
  - DNS delegation for `sapphiretrade.xyz` to activate `sapphiretrade-cert`.

## Authentication & authorization
- Firebase Auth (Google provider) gating community feedback widget; dashboard still read-only for unauthenticated visitors.
- MCP coordinator endpoints protected by shared secrets (`MCP_SESSION_ID`) and restricted network path (Cloud Run service-to-service).
- Recommend enabling Identity-Aware Proxy (IAP) or Firebase token enforcement for admin routes if public exposure is a concern.

## Logging & observability
- Structured logging via `structlog` for backend services.
- Prometheus instrumentation available; ensure metrics endpoint secured behind authenticated ingress or service mesh.
- MCP transcripts persisted for forensic replay.

## IAM review
- Service accounts scoped per service: verify least privilege (Secret Manager Accessor, Cloud Run Invoker, Pub/Sub if used).
- Disable default `allUsers` Cloud Run access once LB routing is finalized.

## Next security actions
1. Complete DNS delegation → confirm `sapphiretrade-cert` becomes `ACTIVE`, tighten Cloud Run ingress, remove legacy `aster-cert`.
2. Configure Cloud Armor policy + optional WAF rules.
3. Enable artifact/GCR vulnerability scanning for container builds (Cloud Build or Artifact Registry).
4. Document key rotation cadence (Aster API secret, Firebase keys, Telegram token).
5. Consider SOC2-style logging retention plan (duration, storage bucket with retention lock).


