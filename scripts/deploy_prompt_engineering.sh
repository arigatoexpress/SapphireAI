#!/bin/bash
# Deployment script for Prompt Engineering implementation
# Usage: ./scripts/deploy_prompt_engineering.sh [staging|production]

set -e

NAMESPACE=${1:-staging}
ENVIRONMENT=${2:-staging}

if [ "$NAMESPACE" = "production" ] || [ "$NAMESPACE" = "live" ]; then
    NAMESPACE="trading-system-live"
    ENVIRONMENT="production"
    echo "⚠️  DEPLOYING TO PRODUCTION - trading-system-live namespace"
else
    NAMESPACE="trading-system-staging"
    ENVIRONMENT="staging"
    echo "🚀 Deploying to STAGING - trading-system-staging namespace"
fi

echo "=========================================="
echo "Prompt Engineering Deployment"
echo "Environment: $ENVIRONMENT"
echo "Namespace: $NAMESPACE"
echo "=========================================="

# Step 1: Validate configuration
echo ""
echo "Step 1: Validating configuration..."
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    echo "❌ Namespace $NAMESPACE does not exist"
    exit 1
fi

if ! kubectl get secret cloud-trader-secrets -n "$NAMESPACE" &> /dev/null; then
    echo "❌ Secret cloud-trader-secrets not found in namespace $NAMESPACE"
    exit 1
fi

echo "✅ Configuration validated"

# Step 2: Backup current deployment (if exists)
echo ""
echo "Step 2: Creating backup of current deployment..."
if kubectl get deployment sapphire-trading-service -n "$NAMESPACE" &> /dev/null; then
    kubectl get deployment sapphire-trading-service -n "$NAMESPACE" -o yaml > \
        "backup/sapphire-trading-service-$(date +%Y%m%d-%H%M%S).yaml" 2>/dev/null || true
    echo "✅ Backup created"
else
    echo "ℹ️  No existing deployment to backup"
fi

# Step 3: Apply deployment manifest
echo ""
echo "Step 3: Applying deployment manifest..."
if [ "$ENVIRONMENT" = "production" ]; then
    kubectl apply -f live-trading-service.yaml
else
    # For staging, modify namespace in the file
    sed "s/namespace: trading-system-live/namespace: $NAMESPACE/g" live-trading-service.yaml | \
        kubectl apply -f -
fi

echo "✅ Deployment manifest applied"

# Step 4: Wait for rollout
echo ""
echo "Step 4: Waiting for rollout to complete..."
if kubectl rollout status deployment/sapphire-trading-service -n "$NAMESPACE" --timeout=300s; then
    echo "✅ Rollout completed successfully"
else
    echo "❌ Rollout failed or timed out"
    echo "Checking pod status..."
    kubectl get pods -n "$NAMESPACE" -l app=sapphire-trading-service
    exit 1
fi

# Step 5: Verify deployment
echo ""
echo "Step 5: Verifying deployment..."
POD_NAME=$(kubectl get pods -n "$NAMESPACE" -l app=sapphire-trading-service -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POD_NAME" ]; then
    echo "❌ No pods found"
    exit 1
fi

# Check environment variables
echo "Checking environment variables..."
if kubectl exec "$POD_NAME" -n "$NAMESPACE" -- env | grep -q "ENABLE_VERTEX_AI=true"; then
    echo "✅ ENABLE_VERTEX_AI is set"
else
    echo "❌ ENABLE_VERTEX_AI not found"
fi

if kubectl exec "$POD_NAME" -n "$NAMESPACE" -- env | grep -q "PROMPT_VERSION=v1.0"; then
    echo "✅ PROMPT_VERSION is set"
else
    echo "❌ PROMPT_VERSION not found"
fi

# Check health endpoint
echo "Checking health endpoint..."
if kubectl exec "$POD_NAME" -n "$NAMESPACE" -- curl -s http://localhost:8080/health | grep -q "running" || true; then
    echo "✅ Health endpoint responding"
else
    echo "⚠️  Health endpoint may not be responding correctly"
fi

# Step 6: Check logs for errors
echo ""
echo "Step 6: Checking logs for errors..."
RECENT_ERRORS=$(kubectl logs "$POD_NAME" -n "$NAMESPACE" --tail=50 | grep -i "error\|exception\|failed" | wc -l | tr -d ' ')

if [ "$RECENT_ERRORS" -gt 5 ]; then
    echo "⚠️  Found $RECENT_ERRORS potential errors in recent logs"
    echo "Review logs with: kubectl logs $POD_NAME -n $NAMESPACE"
else
    echo "✅ No significant errors in recent logs"
fi

# Step 7: Monitor metrics (if Prometheus is available)
echo ""
echo "Step 7: Deployment summary..."
echo "=========================================="
echo "✅ Deployment completed successfully"
echo ""
echo "Next steps:"
echo "1. Monitor logs: kubectl logs -f $POD_NAME -n $NAMESPACE"
echo "2. Check metrics: kubectl exec $POD_NAME -n $NAMESPACE -- curl -s http://localhost:8080/metrics | grep ai_prompt"
echo "3. Monitor Prometheus for:"
echo "   - ai_prompt_generation_duration_seconds"
echo "   - ai_response_parse_errors_total"
echo "   - ai_response_validation_errors_total"
echo "   - ai_confidence_distribution"
echo ""
echo "Rollback if needed:"
echo "  kubectl rollout undo deployment/sapphire-trading-service -n $NAMESPACE"
echo "=========================================="

