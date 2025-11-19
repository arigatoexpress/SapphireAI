#!/bin/bash
# Monitor for suspicious activity related to exposed credentials

set -e

echo "🔍 Monitoring for Suspicious Activity"
echo "======================================"
echo ""

echo "📋 Check the following for suspicious activity:"
echo ""
echo "1. GCP Cloud Logging:"
echo "   - Check for unauthorized access to exposed IPs"
echo "   - Monitor Redis access logs"
echo "   - Review Cloud Run service logs"
echo ""

echo "2. Aster DEX API:"
echo "   - Review API access logs in Aster DEX console"
echo "   - Check for unexpected API calls"
echo "   - Monitor for unauthorized trades"
echo ""

echo "3. Kubernetes:"
echo "   kubectl get events --all-namespaces --sort-by='.lastTimestamp'"
echo "   kubectl logs -n trading-system-clean --tail=100 -l app=cloud-trader"
echo ""

echo "4. Redis:"
echo "   - Check connection logs"
echo "   - Monitor for unusual access patterns"
echo "   - Review authentication attempts"
echo ""

echo "5. Cloud Run Services:"
echo "   gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=wallet-orchestrator' --limit=50"
echo "   gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=model-router' --limit=50"
echo ""

echo "6. Network Security:"
echo "   - Review firewall rules"
echo "   - Check for unauthorized connections"
echo "   - Monitor VPC flow logs"
echo ""

echo "⚠️  Watch for:"
echo "   - Failed authentication attempts"
echo "   - Unusual API call patterns"
echo "   - Unexpected network connections"
echo "   - Unauthorized service access"
echo ""

echo "📊 Recommended monitoring period: 30 days from exposure date"
echo ""

