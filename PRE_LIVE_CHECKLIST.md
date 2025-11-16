# Pre-Live Trading Checklist

This comprehensive checklist must be completed before enabling live trading with real funds. All items must be verified and checked off by authorized personnel.

## 1. Paper Trading Mode Verification

- [x] Verify `ENABLE_PAPER_TRADING=false` for all 6 agents in Kubernetes deployments
- [x] Check `cloud_trader/config.py` default is `False` for production
- [x] Confirm no paper trading flags in environment variables
- [ ] Test that agents are connecting to live Aster DEX APIs (not testnet)

## 2. Capital Allocation Verification

- [x] Verify each agent has exactly $500 trading capital allocated
- [x] Check agent configurations in `AGENT_DEFINITIONS`: 6 agents × $500 = $3,000 total
- [x] Verify risk limits: MAX_DRAWDOWN_PCT=10%, position size limits configured per agent
- [x] Confirm capital allocation is correctly distributed across all 6 agents

## 3. API Credentials and Connectivity

- [x] Verify Aster DEX API credentials in Kubernetes secrets (`cloud-trader-secrets`)
- [x] API key and secret properly configured with appropriate lengths
- [ ] Confirm IP whitelisting on Aster DEX for all GKE node IPs
- [x] Verify base URL is set to live Aster DEX API (`https://fapi.asterdex.com`)

## 4. Kill Switch and Emergency Procedures

- [x] Kill switch implementation exists in `kill_switch.py` and `safeguards.py`
- [x] Telegram kill switch commands implemented (`/kill_switch activate/deactivate`)
- [x] Emergency stop procedures documented in operational runbook
- [x] Circuit breakers implemented (`VERTEX_AI_BREAKER`, `EXCHANGE_API_BREAKER`, etc.)

## 5. Risk Management Settings

- [x] Drawdown limit set to 10% in `safeguards.py`
- [x] Position size limits configured per agent (0.10-0.28 max_position_size_pct)
- [x] Daily loss threshold set to 3%
- [x] Risk monitoring and kill switch activation implemented

## 6. Monitoring and Alerting

- [x] Telegram notifications implemented for trading operations
- [x] Prometheus metrics collection configured
- [x] Health check endpoints implemented (`/health`)
- [x] Alerting system implemented for risk limit breaches

## 7. Frontend and Public Site

- [x] Frontend shows only bot trading capital ($3,000), not account balances
- [x] All components display "Bot Trading Capital" or "AI agent trading capital"
- [ ] Test site accessibility at `sapphiretrade.xyz`
- [x] No personal account information exposed in any component

## 8. System Health and Stability

- [ ] Check all 6 agent pods are running and healthy (currently in CrashLoopBackOff)
- [ ] Verify MCP coordinator is operational (currently crashing)
- [x] Redis connectivity configured and pod running
- [ ] Test BigQuery streaming functionality
- [ ] Verify no crash loops or OOMKilled pods post-deployment

## 9. Security and Access Control

- [x] API keys stored in Kubernetes secrets, not in code
- [ ] Check network policies for traffic isolation
- [ ] Confirm RBAC permissions are configured
- [x] Verified no hardcoded credentials in codebase

## 10. Documentation and Runbooks

- [x] Created comprehensive `PRE_LIVE_CHECKLIST.md`
- [x] Created detailed `DEPLOYMENT_GUIDE.md` with kubectl procedures
- [x] Created extensive `DEVELOPMENT_GUIDE.md`
- [x] Created `TROUBLESHOOTING_GUIDE.md` for incident response
- [x] Created `QUICK_REFERENCE.md` for common operations

## Verification Signatures

**Pre-Live Review Completed By:**
- [ ] Lead Developer: _______________________ Date: __________
- [ ] DevOps Engineer: _____________________ Date: __________
- [ ] Risk Officer: ________________________ Date: __________
- [ ] Security Officer: ____________________ Date: __________

**Final Approval for Live Trading:**
- [ ] CTO/Technical Lead: __________________ Date: __________

## Emergency Contacts

- **Primary On-Call:** [Name] - [Phone] - [Email]
- **Secondary On-Call:** [Name] - [Phone] - [Email]
- **Exchange Support:** Aster DEX - [Contact Info]
- **Infrastructure Support:** GCP Support - [Case Number]

## Rollback Procedures

If issues are detected after going live:

1. **Immediate Actions:**
   - Execute Telegram kill switch: `/kill_switch activate`
   - Scale down all trading agents: `kubectl scale deployment --all --replicas=0 -n trading-system`
   - Notify all stakeholders

2. **Investigation:**
   - Check agent logs for error patterns
   - Verify API connectivity and rate limits
   - Review risk management alerts

3. **Resolution:**
   - Fix identified issues in staging environment
   - Test fixes thoroughly before re-enabling
   - Gradually scale back up trading agents

## Post-Live Monitoring (First 24 Hours)

- [ ] Monitor trade execution success rate (>95%)
- [ ] Track API error rates (<1%)
- [ ] Verify capital allocation is respected
- [ ] Confirm risk limits are enforced
- [ ] Check system performance (latency <500ms)
- [ ] Validate all monitoring alerts are working

---

**IMPORTANT:** This checklist must be completed in full before any live trading with real funds. Any shortcuts or incomplete verification could result in significant financial losses.