# Prompt Engineering Deployment Steps

## ✅ Pre-Deployment Status: PASSED

All validation checks passed. Ready for deployment.

## 🚀 Deployment Instructions

### Option 1: Automated Deployment (Recommended)

#### Staging Deployment
```bash
./scripts/deploy_prompt_engineering.sh staging
```

#### Production Deployment
```bash
./scripts/deploy_prompt_engineering.sh production
```

### Option 2: Manual Deployment

#### Step 1: Verify Pre-Deployment
```bash
./scripts/pre_deployment_check.sh
```

#### Step 2: Apply Deployment Manifest
```bash
# For production
kubectl apply -f live-trading-service.yaml

# For staging (modify namespace first)
kubectl apply -f live-trading-service.yaml -n trading-system-staging
```

#### Step 3: Wait for Rollout
```bash
kubectl rollout status deployment/sapphire-trading-service -n trading-system-live --timeout=300s
```

#### Step 4: Verify Deployment
```bash
# Get pod name
POD_NAME=$(kubectl get pods -n trading-system-live -l app=sapphire-trading-service -o jsonpath='{.items[0].metadata.name}')

# Check environment variables
kubectl exec $POD_NAME -n trading-system-live -- env | grep -E "ENABLE_VERTEX_AI|PROMPT_VERSION|GCP_PROJECT_ID"

# Check logs
kubectl logs -f $POD_NAME -n trading-system-live
```

## 📊 Post-Deployment Monitoring

### 1. Check Pod Status
```bash
kubectl get pods -n trading-system-live -l app=sapphire-trading-service
```

### 2. Monitor Logs
```bash
kubectl logs -f -n trading-system-live -l app=sapphire-trading-service --tail=100
```

Look for:
- ✅ "Prompt generation" messages
- ✅ "AI response validation" messages
- ❌ "Response validation failed" errors
- ❌ "Vertex AI failed" errors

### 3. Check Prometheus Metrics
```bash
# Access metrics endpoint
kubectl port-forward -n trading-system-live svc/sapphire-trading-service 8080:8080

# Then query metrics
curl http://localhost:8080/metrics | grep ai_prompt
```

Key metrics to monitor:
- `ai_prompt_generation_duration_seconds` - Should be < 0.5s
- `ai_response_parse_errors_total` - Should be low (< 5%)
- `ai_response_validation_errors_total` - Should be low (< 5%)
- `ai_confidence_distribution` - Should show reasonable distribution
- `ai_prompt_version_usage_total` - Should show v1.0 usage

### 4. Verify AI Inference is Working

Check agent metrics:
```bash
curl -s http://localhost:8080/api/agents/metrics | jq '.agents | to_entries[] | select(.value.inference.total_count > 0)'
```

Expected: Agents should show inference counts > 0 after a few minutes.

### 5. Test Health Endpoint
```bash
kubectl exec -n trading-system-live -l app=sapphire-trading-service -- curl -s http://localhost:8080/health | jq
```

Should return:
```json
{
  "running": true,
  "paper_trading": false,
  "mcp_enabled": true,
  ...
}
```

## 🔄 Rollback Procedure

If issues are detected:

### Immediate Rollback
```bash
kubectl rollout undo deployment/sapphire-trading-service -n trading-system-live
kubectl rollout status deployment/sapphire-trading-service -n trading-system-live
```

### Disable AI Inference (without rollback)
```bash
kubectl set env deployment/sapphire-trading-service ENABLE_VERTEX_AI=false -n trading-system-live
kubectl rollout restart deployment/sapphire-trading-service -n trading-system-live
```

This will:
- ✅ Keep the new code deployed
- ✅ Disable AI inference (fallback to traditional strategies)
- ✅ Trading continues normally

## 📈 Success Criteria

### Immediate (First Hour)
- ✅ Pods running and healthy
- ✅ No critical errors in logs
- ✅ Health endpoint responding
- ✅ Environment variables set correctly

### Short-term (First Day)
- ✅ AI inference calls occurring (check metrics)
- ✅ Response parse success rate >95%
- ✅ Response validation rate >90%
- ✅ No increase in error rates

### Medium-term (First Week)
- ✅ Confidence distribution reasonable
- ✅ Latency acceptable (< 2s p95)
- ✅ AI signals contributing to trades
- ✅ No performance degradation

## 🐛 Troubleshooting

### Issue: Pods not starting
```bash
# Check pod status
kubectl describe pod -n trading-system-live -l app=sapphire-trading-service

# Check logs
kubectl logs -n trading-system-live -l app=sapphire-trading-service --previous
```

### Issue: Vertex AI not working
```bash
# Check Vertex AI connectivity
kubectl exec -n trading-system-live -l app=sapphire-trading-service -- \
  python3 -c "from google.cloud import aiplatform; print('OK')"

# Check service account permissions
kubectl get serviceaccount -n trading-system-live
```

### Issue: High error rates
```bash
# Check error logs
kubectl logs -n trading-system-live -l app=sapphire-trading-service | grep -i "error\|exception\|failed"

# Check metrics
curl -s http://localhost:8080/metrics | grep "ai_response.*errors_total"
```

### Issue: No AI inference happening
```bash
# Verify Vertex AI is enabled
kubectl exec -n trading-system-live -l app=sapphire-trading-service -- env | grep ENABLE_VERTEX_AI

# Check if agents are registered
curl -s http://localhost:8080/api/agents | jq '.enabled | length'

# Check strategy selector logs
kubectl logs -n trading-system-live -l app=sapphire-trading-service | grep "AI analysis\|Vertex AI"
```

## 📞 Support

If issues persist:
1. Review logs: `kubectl logs -n trading-system-live -l app=sapphire-trading-service`
2. Check metrics: `curl http://localhost:8080/metrics | grep ai_prompt`
3. Review deployment status: `kubectl get deployment sapphire-trading-service -n trading-system-live -o yaml`

## ✅ Deployment Checklist

- [ ] Pre-deployment check passed
- [ ] Backup current deployment
- [ ] Apply deployment manifest
- [ ] Wait for rollout completion
- [ ] Verify environment variables
- [ ] Check pod health
- [ ] Monitor logs for errors
- [ ] Verify Prometheus metrics
- [ ] Test health endpoint
- [ ] Monitor for first hour
- [ ] Document any issues

---

**Last Updated**: 2025-11-15
**Deployment Status**: Ready

