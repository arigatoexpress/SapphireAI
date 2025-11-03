# Sapphire AI Rollout Plan

## 1. Pre-flight checklist
- ✅ Unit & integration tests (`pytest`, `vitest`, `playwright test`)
- ✅ Dependency audits (`npm audit --production`, `pip-audit -r requirements.txt`)
- ✅ Observability configured (Prometheus, structured logs, MCP transcripts)
- ⏳ DNS delegation for `sapphiretrade.xyz` (required for final LB validation)
- ⏳ Cloud Run ingress lockdown after certificate activation

## 2. Environments
- **Staging (current Cloud Run services)** – latest code deployed via `deploy_cloud_run.sh`
- **Production** – same services promoted once DNS + SSL validated; use identical images for parity

## 3. Deployment sequence
1. Confirm `sapphiretrade-cert` status is `ACTIVE`; update Cloud Run ingress to `internal-and-cloud-load-balancing`.
2. Redeploy `cloud-trader` and `wallet-orchestrator` with latest container digests (`deploy_cloud_run.sh`).
3. Run smoke tests:
   - `curl -I https://trader.sapphiretrade.xyz`
   - `curl https://api.sapphiretrade.xyz/orchestrator/health`
   - `npm run test:e2e` against LB hostname.
4. Verify MCP websocket connectivity from dashboard (live council feed).
5. Update Aster API IP whitelist with `34.117.165.111`.

## 4. Monitoring & alerting
- Enable Cloud Monitoring uptime checks for both hostnames.
- Track Prometheus dashboard for latency, error rates, and MCP throughput.
- Configure log-based alerts for `ERROR` severity entries and Aster API 4xx/5xx spikes.

## 5. Rollback strategy
- Maintain previous container revisions (Cloud Run keeps last 100) – `gcloud run services update-traffic --to-revisions=REV=100` to revert.
- For infra rollback: detach `sapphiretrade-cert` and reattach `aster-cert` + revert DNS to prior zone if required.
- Keep `.env` snapshots and secret versions to restore earlier credentials.

## 6. Post-launch
- Hold 24h hypercare with increased logging retention.
- Schedule key rotation (Aster, Firebase, Telegram) within first week.
- Publish public roadmap & security summary to community to reinforce transparency.


