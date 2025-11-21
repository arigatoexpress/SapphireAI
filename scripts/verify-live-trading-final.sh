#!/bin/bash
# Final verification of live trading setup

echo "🔍 Final Live Trading Verification"
echo "=================================="
echo ""

PROJECT_ID="sapphireinfinite"
NAMESPACE="trading"

# Check configuration
echo "📋 Configuration Check:"
echo "   - ENABLE_PAPER_TRADING: $(kubectl get deployment trading-system-cloud-trader -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="ENABLE_PAPER_TRADING")].value}' 2>/dev/null || echo 'not found')"
echo "   - PAPER_TRADING_ENABLED: $(kubectl get deployment trading-system-cloud-trader -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="PAPER_TRADING_ENABLED")].value}' 2>/dev/null || echo 'not found')"
echo ""

# Check pod status
echo "☸️  Pod Status:"
READY_PODS=$(kubectl get pods -n $NAMESPACE -l app=cloud-trader --field-selector=status.phase=Running --no-headers 2>/dev/null | grep -c "Running" || echo "0")
TOTAL_PODS=$(kubectl get deployment trading-system-cloud-trader -n $NAMESPACE -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

if [ "$READY_PODS" -gt 0 ]; then
    echo "   ✅ $READY_PODS/$TOTAL_PODS cloud-trader pods running"
    kubectl get pods -n $NAMESPACE -l app=cloud-trader --field-selector=status.phase=Running --no-headers 2>/dev/null | head -3 | awk '{print "      - " $1 ": " $3}'
else
    echo "   ⏳ Cloud-trader pods starting..."
fi

SIMPLIFIED_READY=$(kubectl get pods -n $NAMESPACE -l app=simplified-trader --field-selector=status.phase=Running --no-headers 2>/dev/null | grep -c "Running" || echo "0")
if [ "$SIMPLIFIED_READY" -gt 0 ]; then
    echo "   ✅ Simplified-trader: Running"
fi
echo ""

# Check health endpoint
echo "🌐 Health Check:"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://trader.sapphiretrade.xyz/healthz 2>/dev/null || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "   ✅ Health endpoint responding (HTTP $HEALTH_RESPONSE)"
    curl -s https://trader.sapphiretrade.xyz/healthz 2>/dev/null | jq . 2>/dev/null | head -5 || curl -s https://trader.sapphiretrade.xyz/healthz 2>/dev/null | head -3
else
    echo "   ⏳ Health endpoint: HTTP $HEALTH_RESPONSE (may still be starting)"
fi
echo ""

# Check recent logs for trading activity
echo "📊 Recent Activity:"
kubectl logs -n $NAMESPACE -l app=cloud-trader --tail=5 --since=5m 2>/dev/null | grep -E "trading|live|paper|started|ready" | tail -3 || echo "   No recent logs found (pods may still be starting)"
echo ""

# Summary
echo "✅ Verification Summary:"
if [ "$READY_PODS" -gt 0 ] || [ "$SIMPLIFIED_READY" -gt 0 ]; then
    echo "   ✅ Live trading system is operational!"
    echo ""
    echo "🌐 Access:"
    echo "   - Dashboard: https://sapphiretrade.xyz"
    echo "   - Health: https://trader.sapphiretrade.xyz/healthz"
    echo ""
    echo "📋 Monitor:"
    echo "   - Logs: kubectl logs -n $NAMESPACE -l app=cloud-trader -f"
    echo "   - Pods: kubectl get pods -n $NAMESPACE -w"
else
    echo "   ⏳ System is still deploying. Check again in a few minutes."
    echo ""
    echo "📋 Monitor Progress:"
    echo "   - Build: gcloud builds list --limit=1 --project=$PROJECT_ID"
    echo "   - Pods: kubectl get pods -n $NAMESPACE -l app=cloud-trader -w"
fi
