#!/bin/bash
# Script to guide credential rotation after security cleanup

set -e

echo "🔄 Credential Rotation Guide"
echo "=============================="
echo ""

# Infrastructure credentials found in git history
echo "📋 Credentials that need rotation:"
echo ""
echo "1. Redis Connection:"
echo "   - IP: 10.161.118.219:6379"
echo "   - Action: Update Redis connection in:"
echo "     * GCP Memorystore settings"
echo "     * Kubernetes services"
echo "     * Environment variables"
echo ""

echo "2. Service URLs:"
echo "   - wallet-orchestrator-880429861698.us-central1.run.app"
echo "   - model-router-880429861698.us-central1.run.app"
echo "   - Action: Update service endpoints in:"
echo "     * Kubernetes deployments"
echo "     * Environment variables"
echo "     * Application configuration"
echo ""

echo "3. API Keys (if any were exposed):"
echo "   - ASTER_API_KEY"
echo "   - ASTER_SECRET_KEY"
echo "   - TELEGRAM_BOT_TOKEN (if real tokens were in git)"
echo "   - Action: Rotate in:"
echo "     * Aster DEX API console"
echo "     * Telegram Bot API"
echo "     * Google Secret Manager"
echo ""

echo "🛠️  Rotation Steps:"
echo ""
echo "1. Generate new credentials:"
echo "   - Aster DEX: Log in and generate new API keys"
echo "   - Telegram: Create new bot token if needed"
echo "   - GCP: Update service accounts if needed"
echo ""

echo "2. Update Google Secret Manager:"
echo "   gcloud secrets versions add ASTER_API_KEY --data-file=-"
echo "   gcloud secrets versions add ASTER_SECRET_KEY --data-file=-"
echo "   gcloud secrets versions add TELEGRAM_BOT_TOKEN --data-file=-"
echo ""

echo "3. Update Kubernetes secrets:"
echo "   kubectl delete secret cloud-trader-secrets -n trading-system-clean"
echo "   kubectl create secret generic cloud-trader-secrets \\"
echo "     --from-literal=ASTER_API_KEY='new_key' \\"
echo "     --from-literal=ASTER_SECRET_KEY='new_secret' \\"
echo "     -n trading-system-clean"
echo ""

echo "4. Update environment variables:"
echo "   - Update .envrc (local) with new values"
echo "   - Update Cloud Run service environment variables"
echo "   - Update Kubernetes ConfigMaps"
echo ""

echo "5. Restart services:"
echo "   kubectl rollout restart deployment/cloud-trader -n trading-system-clean"
echo "   gcloud run services update cloud-trader --region=us-central1"
echo ""

echo "6. Verify connectivity:"
echo "   - Test Redis connection"
echo "   - Test API endpoints"
echo "   - Verify trading functionality"
echo ""

echo "✅ Rotation checklist:"
echo "   [ ] Redis credentials rotated"
echo "   [ ] Service URLs updated"
echo "   [ ] API keys rotated"
echo "   [ ] Secrets updated in GCP Secret Manager"
echo "   [ ] Kubernetes secrets updated"
echo "   [ ] Services restarted"
echo "   [ ] Functionality verified"
echo ""

