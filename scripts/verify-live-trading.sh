#!/bin/bash
# Verify live trading is enabled and running

set -e

echo "🔍 Verifying Live Trading Status"
echo "================================="
echo ""

PROJECT_ID="sapphireinfinite"
NAMESPACE="trading"

# Check Kubernetes deployments
echo "☸️  Checking Kubernetes Deployments..."
if kubectl get deployment -n $NAMESPACE &>/dev/null; then
    echo ""
    echo "Environment Variables:"
    kubectl get deployment -n $NAMESPACE -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{range .spec.template.spec.containers[*]}{"\tENABLE_PAPER_TRADING: "}{.env[?(@.name=="ENABLE_PAPER_TRADING")].value}{"\n"}{"\tPAPER_TRADING_ENABLED: "}{.env[?(@.name=="PAPER_TRADING_ENABLED")].value}{"\n"}{end}{end}' 2>/dev/null | head -20

    echo ""
    echo "Pod Status:"
    kubectl get pods -n $NAMESPACE -o wide | grep -E "NAME|Running|Error|ImagePull"
else
    echo "⚠️  No deployments found in namespace $NAMESPACE"
fi

# Check Cloud Run
echo ""
echo "☁️  Checking Cloud Run Services..."
if gcloud run services list --platform=managed --project=$PROJECT_ID --format="table(name,status.url)" 2>/dev/null | grep -E "cloud-trader|NAME"; then
    SERVICE_NAME=$(gcloud run services list --platform=managed --project=$PROJECT_ID --format="value(name)" 2>/dev/null | grep cloud-trader | head -1)
    if [ ! -z "$SERVICE_NAME" ]; then
        echo ""
        echo "Environment Configuration:"
        gcloud run services describe $SERVICE_NAME --region=us-central1 --project=$PROJECT_ID --format="value(spec.template.spec.containers[0].env)" 2>/dev/null | grep -E "PAPER|ENABLE" || echo "   No paper trading config found"
    fi
else
    echo "⚠️  No Cloud Run services found"
fi

# Check logs for trading activity
echo ""
echo "📊 Recent Trading Activity (last 5 minutes):"
gcloud logging read \
  'resource.type=cloud_run_revision AND (textPayload:"trade" OR textPayload:"order" OR textPayload:"executed") AND timestamp>="2025-11-19T17:45:00Z"' \
  --limit=5 \
  --format="table(timestamp.date('%H:%M:%S'), textPayload)" \
  --project=$PROJECT_ID 2>/dev/null | head -10 || echo "   No recent activity found"

echo ""
echo "✅ Verification complete!"
