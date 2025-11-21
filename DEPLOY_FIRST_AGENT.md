# Deploy First Agent with $100 Capital

## 🎯 Ready to Deploy: Trend-Momentum Agent

Your core service is running. Now let's add the first AI agent!

---

## 📋 Pre-Deployment Checklist

✅ Core service deployed and healthy
✅ Capital reduced to $100 per bot
✅ Telegram optimized (no spam)
✅ Frontend enhanced with TradingView charts
✅ Database errors fixed
✅ All new features implemented

---

## 🚀 Option 1: Deploy via Cloud Build (Recommended)

### Update values.yaml for agents

The values are already configured for $100/bot. To deploy, trigger a new build with agents enabled:

```bash
# Update values-emergency-minimal.yaml to enable first agent
# Then submit build
gcloud builds submit --config=cloudbuild.yaml --project=sapphireinfinite
```

Or update via kubectl directly (faster):

```bash
kubectl set env deployment/trading-system-cloud-trader \
  AGENTS_ENABLED=true \
  -n trading

kubectl rollout restart deployment/trading-system-cloud-trader -n trading
```

---

## 🚀 Option 2: Deploy via kubectl (Manual)

### Create Agent Deployment Manually

```bash
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trading-system-trend-momentum-bot
  namespace: trading
  labels:
    app: cloud-trader
    agent: trend-momentum
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cloud-trader
      agent: trend-momentum
  template:
    metadata:
      labels:
        app: cloud-trader
        agent: trend-momentum
    spec:
      serviceAccountName: trading-system
      containers:
        - name: cloud-trader
          image: us-central1-docker.pkg.dev/sapphireinfinite/cloud-run-source-deploy/cloud-trader:34ba9ecc-b6e7-4389-8fa1-00eb654e1785
          imagePullPolicy: Always
          command: ["uvicorn", "cloud_trader.api:build_app", "--host", "0.0.0.0", "--port", "8080"]
          ports:
            - name: http
              containerPort: 8080
          env:
            - name: BOT_ID
              value: "trend-momentum-agent"
            - name: AGENT_CAPITAL
              value: "100"
            - name: MAX_POSITION_SIZE
              value: "20"
            - name: LOG_LEVEL
              value: "INFO"
          envFrom:
            - secretRef:
                name: cloud-trader-secrets
          resources:
            requests:
              cpu: 500m
              memory: 2Gi
            limits:
              cpu: 2000m
              memory: 4Gi
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 120
            periodSeconds: 30
            timeoutSeconds: 30
            failureThreshold: 10
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
EOF
```

---

## 📊 Monitor Deployment

### Check Pod Status

```bash
# Watch pod creation
kubectl get pods -n trading -w

# Check specific agent
kubectl get pods -n trading -l agent=trend-momentum

# Wait for Ready
kubectl wait --for=condition=Ready pod -l agent=trend-momentum -n trading --timeout=5m
```

### View Logs

```bash
# Stream logs
kubectl logs -f -l agent=trend-momentum -n trading

# Check for startup messages
kubectl logs -l agent=trend-momentum -n trading | grep "STARTUP\|Agent\|initialized"
```

### Test Health

```bash
# Get pod name
POD=$(kubectl get pod -n trading -l agent=trend-momentum -o jsonpath='{.items[0].metadata.name}')

# Test health endpoint
kubectl exec -n trading $POD -- curl -s http://localhost:8080/healthz
```

---

## ✅ Expected Behavior

### Pod Startup (2-3 minutes)

```
1. Container starting...
2. Loading Python dependencies (30s)
3. Connecting to Vertex AI (20-40s)
4. Initializing agent state (10s)
5. Connecting to Aster DEX (5s)
6. Health check responding
7. Pod becomes Ready ✅
```

### Logs Should Show

```
✅ "Starting Sapphire AI..."
✅ "Bot ID: trend-momentum-agent"
✅ "Agent capital: $100"
✅ "Vertex AI client ready"
✅ "Aster DEX connected"
✅ "Agent initialized: trend-momentum"
✅ Health endpoint responding 200 OK
```

### What the Agent Will Do

With $100 capital:
- Max position size: $20 (20% of capital)
- Max leverage: 3x
- Risk multiplier: 0.01 (very conservative)
- Strategy: Momentum-based entries
- Model: Gemini 2.0 Flash Exp
- Decisions: Every 10 seconds

---

## 🔍 Troubleshooting

### If Pod Doesn't Start

```bash
# Check pod events
kubectl describe pod -l agent=trend-momentum -n trading | grep Events -A 20

# Check logs for errors
kubectl logs -l agent=trend-momentum -n trading --previous

# Check deployment
kubectl describe deployment -l agent=trend-momentum -n trading
```

### If Health Check Fails

```bash
# Port forward and test locally
kubectl port-forward -n trading pod/$POD 8080:8080
curl http://localhost:8080/healthz

# Check application errors
kubectl logs -l agent=trend-momentum -n trading | grep ERROR
```

---

## 📈 Monitoring First Agent

### First 30 Minutes

Monitor for:
- ✅ Pod stays Running (no crashes)
- ✅ Health checks passing
- ✅ Vertex AI calls succeeding
- ✅ Market data fetching
- ✅ Agent making decisions
- ✅ No error spam in logs

### Performance Metrics

Check:
- CPU usage (should be < 1 core)
- Memory usage (should be < 2Gi)
- Vertex AI latency (should be < 5s)
- Decision frequency (every 10s)

---

## 🎉 After First Agent is Stable

Deploy remaining agents one by one:

```bash
# Use the automated script
./scripts/deploy-agents-incrementally.sh

# Or deploy manually
for agent in strategy-optimization financial-sentiment market-prediction volume-microstructure vpin-hft; do
  kubectl apply -f agent-deployment-$agent.yaml
  kubectl wait --for=condition=Ready pod -l agent=$agent -n trading --timeout=5m
  sleep 60  # Let agent stabilize
done
```

---

## 💰 Capital Allocation Summary

```
Per Bot: $100
Max Position: $20 (20% of capital)
Max Leverage: 3x
Risk Multiplier: 0.01

Total with 6 Bots: $600
Conservative, safe for testing
Can scale to $3,500 after proven stable
```

---

**Status**: Ready to deploy
**Next**: Deploy first agent and monitor
**Timeline**: 5-10 minutes to Running
**Risk**: Very low ($100 only)

🚀 **Let's get your first bot trading!**
