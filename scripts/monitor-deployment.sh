#!/bin/bash
# Monitor build and deployment progress

set -e

PROJECT_ID="sapphireinfinite"
BUILD_TIMEOUT=1800  # 30 minutes

echo "🔍 Monitoring Build and Deployment"
echo "==================================="
echo ""

# Get latest build
LATEST_BUILD=$(gcloud builds list --limit=1 --format="value(id)" --project=$PROJECT_ID 2>/dev/null | head -1)

if [ -z "$LATEST_BUILD" ]; then
    echo "❌ No builds found"
    exit 1
fi

echo "📦 Build ID: $LATEST_BUILD"

# Check build status
BUILD_STATUS=$(gcloud builds describe $LATEST_BUILD --project=$PROJECT_ID --format="value(status)" 2>/dev/null)

echo "📊 Build Status: $BUILD_STATUS"
echo ""

if [ "$BUILD_STATUS" = "SUCCESS" ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "⏳ Waiting for Kubernetes deployment..."
    sleep 15

    echo "☸️  Checking pod status..."
    kubectl get pods -n trading -l app=cloud-trader --no-headers 2>/dev/null | head -5
    echo ""

    READY_PODS=$(kubectl get pods -n trading -l app=cloud-trader --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l | tr -d ' ')
    echo "📊 Running pods: $READY_PODS"

    if [ "$READY_PODS" -gt 0 ]; then
        echo ""
        echo "✅ Deployment appears to be in progress!"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Wait 2-3 more minutes for pods to become ready"
        echo "   2. Check: kubectl get pods -n trading -l app=cloud-trader"
        echo "   3. Verify: curl https://trader.sapphiretrade.xyz/healthz"
        echo "   4. View dashboard: https://sapphiretrade.xyz"
    fi

elif [ "$BUILD_STATUS" = "WORKING" ] || [ "$BUILD_STATUS" = "QUEUED" ]; then
    echo "⏳ Build in progress..."
    echo ""
    echo "📋 Monitor with:"
    echo "   gcloud builds describe $LATEST_BUILD --project=$PROJECT_ID"
    echo "   gcloud builds log $LATEST_BUILD --project=$PROJECT_ID --stream"

elif [ "$BUILD_STATUS" = "FAILURE" ] || [ "$BUILD_STATUS" = "CANCELLED" ] || [ "$BUILD_STATUS" = "TIMEOUT" ]; then
    echo "❌ Build failed with status: $BUILD_STATUS"
    echo ""
    echo "📋 Check logs:"
    echo "   gcloud builds log $LATEST_BUILD --project=$PROJECT_ID | tail -50"
    exit 1
else
    echo "⚠️  Unknown build status: $BUILD_STATUS"
fi
