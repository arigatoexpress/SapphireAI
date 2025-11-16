# Monitoring and Auto-Deployment Guide

## Quick Start

### Start Auto-Monitoring
```bash
./scripts/start_monitoring.sh
```

This will:
- Monitor deployment health every 10 minutes
- Auto-fix common issues (secrets, restarts)
- Log everything to `/tmp/sapphire_monitor.log`
- Continue running in background

### Stop Monitoring
```bash
./scripts/stop_monitoring.sh
```

### Manual Commands

#### Run Full Check and Deploy
```bash
./scripts/monitor_and_deploy.sh all
```

#### Deploy Frontend Only
```bash
./scripts/monitor_and_deploy.sh frontend
```

#### Check Status Only
```bash
./scripts/monitor_and_deploy.sh monitor
```

#### Update Secrets and Restart
```bash
./scripts/monitor_and_deploy.sh secrets
```

## What Gets Monitored

1. **Deployment Health**
   - Pod status and readiness
   - Health endpoint responses
   - Live trading mode verification

2. **Telegram Configuration**
   - Bot token and chat ID presence
   - Verification that real credentials are used

3. **Trading Activity**
   - Recent trade signals in logs
   - Error detection and reporting

4. **DNS and Website**
   - Domain accessibility
   - Firebase hosting status

## Auto-Fixes

The monitoring script automatically:
- Updates Kubernetes secrets from Secret Manager if missing
- Restarts deployments with error pods
- Detects and reports configuration issues

## Log Files

- **Main log**: `/tmp/sapphire_monitor.log`
- **Error log**: `/tmp/sapphire_monitor_errors.log`
- **Output log**: `/tmp/sapphire_monitor_output.log`

## View Logs

```bash
# View main log
tail -f /tmp/sapphire_monitor.log

# View errors only
tail -f /tmp/sapphire_monitor_errors.log

# View recent activity
tail -50 /tmp/sapphire_monitor.log
```

## Troubleshooting

### Check if Monitoring is Running
```bash
ps aux | grep auto_monitor
cat /tmp/sapphire_monitor.pid
```

### Restart Monitoring
```bash
./scripts/stop_monitoring.sh
./scripts/start_monitoring.sh
```

### Manual Health Check
```bash
kubectl get pods -n trading-system-live -l app=sapphire-trading-service
kubectl logs -n trading-system-live -l app=sapphire-trading-service --tail=50
```

## Next Steps While Away

1. ✅ Monitoring script is running
2. ⏳ Will auto-fix deployment issues
3. ⏳ Will detect and report Telegram problems
4. ⏳ Will monitor trading activity
5. ⏳ Check logs when you return

All fixes are logged, so you can review what happened while you were away.
