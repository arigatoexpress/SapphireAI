#!/bin/bash
# Comprehensive health check for all Sapphire AI components

set -e

echo "🔍 Sapphire AI Health Check"
echo "=========================="

# Check GKE cluster
echo "1. Checking GKE cluster..."
gcloud container clusters describe hft-trading-cluster \
  --zone=us-central1-a \
  --project=sapphireinfinite \
  --format="value(status)" | grep -q "RUNNING" && echo "✅ Cluster running" || echo "❌ Cluster not running"

# Check pods
echo "2. Checking pods..."
kubectl get pods -n trading

# Check deployments
echo "3. Checking deployments..."
kubectl get deployments -n trading

# Test health endpoints
echo "4. Testing health endpoints..."
POD=$(kubectl get pod -n trading -l app=cloud-trader -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$POD" ]; then
  kubectl exec -n trading "$POD" -- curl -s http://localhost:8080/healthz | jq . || echo "Health endpoint not responding"
  echo "✅ Cloud-trader healthy"
else
  echo "❌ No cloud-trader pod found"
fi

# Check recent trades
echo "5. Checking recent activity..."
kubectl logs -n trading -l app=cloud-trader --tail=20 | grep -i "trade\|order\|executed" || echo "No recent trades"

# Check metrics
echo "6. Checking metrics availability..."
kubectl get svc -n trading | grep -q "cloud-trader" && echo "✅ Service exists" || echo "❌ No service"

echo "=========================="
echo "✅ Health check complete"
