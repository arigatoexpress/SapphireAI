#!/bin/bash
# Build Docker image only (skip Helm deployment)
# This builds and pushes the image, then we'll deploy manually

set -e

echo "=========================================="
echo "Building Docker Image (Prompt Engineering)"
echo "=========================================="

PROJECT_ID=${PROJECT_ID:-sapphireinfinite}
IMAGE="us-central1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/cloud-trader"
BUILD_ID=$(date +%Y%m%d-%H%M%S)

echo "Project: $PROJECT_ID"
echo "Image: $IMAGE"
echo "Build ID: $BUILD_ID"
echo ""

# Build and push image
echo "🔨 Building Docker image..."
gcloud builds submit --tag "${IMAGE}:${BUILD_ID}" --tag "${IMAGE}:latest" \
    --timeout=900s \
    --machine-type=E2_HIGHCPU_32 \
    --disk-size=500

echo ""
echo "✅ Image built successfully!"
echo "   ${IMAGE}:${BUILD_ID}"
echo "   ${IMAGE}:latest"
echo ""
echo "📦 Deploying to live environment..."

# Deploy to live
kubectl rollout restart deployment/sapphire-trading-service -n trading-system-live

echo "⏳ Waiting for rollout..."
kubectl rollout status deployment/sapphire-trading-service -n trading-system-live --timeout=300s

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Verify with:"
echo "  kubectl get pods -n trading-system-live -l app=sapphire-trading-service"
echo "  kubectl logs -f -n trading-system-live -l app=sapphire-trading-service"

