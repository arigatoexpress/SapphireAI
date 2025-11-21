#!/bin/bash
# Script to start live trading services

set -e

echo "🚀 Starting Live Trading Services"
echo "=================================="
echo ""

PROJECT_ID="sapphireinfinite"
REGION="us-central1"
NAMESPACE="trading"

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Set project
echo "📋 Setting GCP project: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Check if Cloud Run service exists
echo "🔍 Checking Cloud Run service..."
if gcloud run services describe cloud-trader --region=$REGION --project=$PROJECT_ID &>/dev/null; then
    echo "✅ Cloud Run service exists"

    # Update service to ensure live trading is enabled
    echo "⚙️  Updating Cloud Run service with live trading settings..."
    gcloud run services update cloud-trader \
        --region=$REGION \
        --project=$PROJECT_ID \
        --update-env-vars ENABLE_PAPER_TRADING=false,PAPER_TRADING_ENABLED=false \
        --set-secrets ASTER_API_KEY=ASTER_API_KEY:latest,ASTER_SECRET_KEY=ASTER_SECRET_KEY:latest,TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN:latest,TELEGRAM_CHAT_ID=TELEGRAM_CHAT_ID:latest \
        --cpu-boost \
        --cpu-throttling

    SERVICE_URL=$(gcloud run services describe cloud-trader --region=$REGION --project=$PROJECT_ID --format="value(status.url)")
    echo "✅ Cloud Run service updated: $SERVICE_URL"
else
    echo "⚠️  Cloud Run service not found. Deploying..."
    echo "   Run: ./deploy_cloud_run.sh"
fi

# Check Kubernetes deployment
echo ""
echo "🔍 Checking Kubernetes deployment..."
if kubectl get namespace $NAMESPACE &>/dev/null; then
    echo "✅ Namespace exists"

    # Check if deployment exists
    if kubectl get deployment cloud-trader -n $NAMESPACE &>/dev/null; then
        echo "✅ Deployment exists"

        # Update deployment to ensure live trading
        echo "⚙️  Updating Kubernetes deployment..."
        kubectl set env deployment/cloud-trader \
            -n $NAMESPACE \
            ENABLE_PAPER_TRADING=false \
            PAPER_TRADING_ENABLED=false

        # Restart deployment
        echo "🔄 Restarting deployment..."
        kubectl rollout restart deployment/cloud-trader -n $NAMESPACE

        echo "⏳ Waiting for rollout..."
        kubectl rollout status deployment/cloud-trader -n $NAMESPACE --timeout=5m

        echo "✅ Kubernetes deployment updated and restarted"
    else
        echo "⚠️  Deployment not found. Creating..."
        # You may need to apply deployment YAML here
        echo "   Run: kubectl apply -f helm/trading-system/"
    fi
else
    echo "⚠️  Namespace not found. Creating..."
    kubectl create namespace $NAMESPACE
fi

# Verify services are running
echo ""
echo "📊 Service Status:"
echo "=================="

# Check Cloud Run
if gcloud run services describe cloud-trader --region=$REGION --project=$PROJECT_ID &>/dev/null; then
    SERVICE_URL=$(gcloud run services describe cloud-trader --region=$REGION --project=$PROJECT_ID --format="value(status.url)")
    echo "🌐 Cloud Run: $SERVICE_URL"

    # Test health endpoint
    echo -n "   Health: "
    if curl -s -f "$SERVICE_URL/healthz" &>/dev/null; then
        echo "✅ Healthy"
    else
        echo "⚠️  Check manually"
    fi
fi

# Check Kubernetes pods
echo ""
echo "☸️  Kubernetes Pods:"
if kubectl get pods -n $NAMESPACE -l app=cloud-trader 2>/dev/null | grep -v NAME; then
    echo "   Pods found"
    kubectl get pods -n $NAMESPACE -l app=cloud-trader
else
    echo "   No cloud-trader pods found"
fi

echo ""
echo "✅ Live Trading Startup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Monitor trades: ./monitor-trading.sh"
echo "   2. Check health: ./check-trading-health.sh"
echo "   3. View dashboard: https://sapphiretrade.xyz"
echo "   4. Check logs: gcloud logging tail --project=$PROJECT_ID"
