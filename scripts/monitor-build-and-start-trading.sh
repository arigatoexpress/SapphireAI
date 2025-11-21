#!/bin/bash
# Monitor Cloud Build and start trading when ready

set -e

PROJECT_ID="sapphireinfinite"
BUILD_TIMEOUT=1800  # 30 minutes

echo "🚀 Monitoring Build and Starting Live Trading"
echo "=============================================="
echo ""

# Get latest build
echo "🔍 Checking latest build..."
LATEST_BUILD=$(gcloud builds list --limit=1 --format="value(id)" --project=$PROJECT_ID 2>/dev/null | head -1)

if [ -z "$LATEST_BUILD" ]; then
    echo "⚠️  No recent builds found. Starting new build..."
    gcloud builds submit --config=cloudbuild.yaml \
        --substitutions=_ENABLE_PAPER_TRADING=false,_PAPER_TRADING_ENABLED=false \
        --project=$PROJECT_ID \
        --async
    echo "✅ Build started. Monitor with: gcloud builds list"
    exit 0
fi

echo "📦 Latest build: $LATEST_BUILD"

# Check build status
BUILD_STATUS=$(gcloud builds describe $LATEST_BUILD --project=$PROJECT_ID --format="value(status)" 2>/dev/null)

echo "📊 Build Status: $BUILD_STATUS"

if [ "$BUILD_STATUS" = "SUCCESS" ]; then
    echo "✅ Build completed successfully!"

    # Wait for Helm deployment to complete
    echo "⏳ Waiting for Kubernetes deployment..."
    sleep 10

    # Check if cloud-trader deployment is ready
    if kubectl get deployment trading-system-cloud-trader -n trading &>/dev/null; then
        echo "🔄 Ensuring live trading is enabled..."
        kubectl set env deployment/trading-system-cloud-trader \
            -n trading \
            ENABLE_PAPER_TRADING=false \
            PAPER_TRADING_ENABLED=false

        echo "🔄 Restarting deployment..."
        kubectl rollout restart deployment/trading-system-cloud-trader -n trading

        echo "⏳ Waiting for rollout..."
        kubectl rollout status deployment/trading-system-cloud-trader -n trading --timeout=300s

        echo "✅ Live trading started!"

        # Verify
        echo ""
        echo "📊 Verification:"
        ./scripts/verify-live-trading.sh
    else
        echo "⚠️  Deployment not found. Build may still be deploying via Helm..."
    fi

elif [ "$BUILD_STATUS" = "WORKING" ] || [ "$BUILD_STATUS" = "QUEUED" ]; then
    echo "⏳ Build in progress. Status: $BUILD_STATUS"
    echo "   Monitor with: gcloud builds describe $LATEST_BUILD --project=$PROJECT_ID"
    echo "   Or: gcloud builds log $LATEST_BUILD --project=$PROJECT_ID"
elif [ "$BUILD_STATUS" = "FAILURE" ] || [ "$BUILD_STATUS" = "CANCELLED" ] || [ "$BUILD_STATUS" = "TIMEOUT" ]; then
    echo "❌ Build failed with status: $BUILD_STATUS"
    echo "   Check logs: gcloud builds log $LATEST_BUILD --project=$PROJECT_ID"
    exit 1
else
    echo "⚠️  Unknown build status: $BUILD_STATUS"
fi
