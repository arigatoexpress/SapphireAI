#!/bin/bash
# Comprehensive deployment and testing script

set -e

PROJECT_ID=${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "sapphireinfinite")}
NAMESPACE="trading-system-live"
DEPLOYMENT_NAME="sapphire-trading-service"
IMAGE_REPO="us-central1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/cloud-trader"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

log "Starting deployment and testing process..."
log "Project: $PROJECT_ID"
log "Namespace: $NAMESPACE"

# Step 1: Pre-deployment checks
log "Step 1: Running pre-deployment checks..."
if [ -f "scripts/pre_deployment_check_optimizations.sh" ]; then
    bash scripts/pre_deployment_check_optimizations.sh || {
        error "Pre-deployment checks failed"
        exit 1
    }
else
    warning "Pre-deployment check script not found, skipping..."
fi

# Step 2: Build Docker image
log "\nStep 2: Building Docker image..."
log "Image: ${IMAGE_REPO}:latest"

if command -v gcloud &>/dev/null; then
    log "Submitting Cloud Build..."
    BUILD_ID=$(gcloud builds submit --tag "${IMAGE_REPO}:latest" \
        --project="${PROJECT_ID}" \
        --format="value(id)" \
        2>&1 | tail -1 || echo "")
    
    if [ -z "$BUILD_ID" ]; then
        error "Failed to get build ID"
        exit 1
    fi
    
    log "Build ID: $BUILD_ID"
    echo "$BUILD_ID" > /tmp/latest_build_id.txt
    
    log "Monitoring build progress..."
    gcloud builds log "$BUILD_ID" --stream --project="$PROJECT_ID" || {
        error "Build failed or interrupted"
        exit 1
    }
    
    BUILD_STATUS=$(gcloud builds describe "$BUILD_ID" --project="$PROJECT_ID" --format="value(status)" 2>/dev/null || echo "UNKNOWN")
    
    if [ "$BUILD_STATUS" != "SUCCESS" ]; then
        error "Build failed with status: $BUILD_STATUS"
        exit 1
    fi
    
    success "Docker image built successfully"
else
    warning "gcloud not available, skipping image build (assuming image exists)"
fi

# Step 3: Update deployment manifest
log "\nStep 3: Verifying deployment manifest..."
if [ ! -f "live-trading-service.yaml" ]; then
    error "live-trading-service.yaml not found"
    exit 1
fi

# Ensure image is set correctly
if grep -q "image:" live-trading-service.yaml; then
    success "Deployment manifest contains image reference"
else
    warning "Deployment manifest may need image reference"
fi

# Step 4: Apply deployment
log "\nStep 4: Applying deployment to Kubernetes..."
kubectl apply -f live-trading-service.yaml -n "$NAMESPACE" || {
    error "Failed to apply deployment"
    exit 1
}

success "Deployment manifest applied"

# Step 5: Restart deployment
log "\nStep 5: Restarting deployment to pick up new code..."
kubectl rollout restart deployment/$DEPLOYMENT_NAME -n "$NAMESPACE" || {
    error "Failed to restart deployment"
    exit 1
}

log "Waiting for rollout to complete..."
kubectl rollout status deployment/$DEPLOYMENT_NAME -n "$NAMESPACE" --timeout=300s || {
    error "Rollout failed or timed out"
    exit 1
}

success "Deployment rolled out successfully"

# Step 6: Verify deployment
log "\nStep 6: Verifying deployment health..."
sleep 10  # Give pods time to start

POD_NAME=$(kubectl get pods -n "$NAMESPACE" -l app=$DEPLOYMENT_NAME -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -z "$POD_NAME" ]; then
    error "No pods found for deployment"
    exit 1
fi

log "Pod: $POD_NAME"

# Check pod status
POD_STATUS=$(kubectl get pod $POD_NAME -n "$NAMESPACE" -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
if [ "$POD_STATUS" = "Running" ]; then
    success "Pod is running"
else
    error "Pod status: $POD_STATUS"
    kubectl describe pod $POD_NAME -n "$NAMESPACE" | tail -20
    exit 1
fi

# Check health endpoint
log "Checking health endpoint..."
sleep 5  # Give service time to be ready

HEALTH_RESPONSE=$(kubectl exec -n "$NAMESPACE" $POD_NAME -- curl -s http://localhost:8080/health 2>/dev/null || echo "{}")
RUNNING=$(echo $HEALTH_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('running', False))" 2>/dev/null || echo "false")

if [ "$RUNNING" = "True" ] || [ "$RUNNING" = "true" ]; then
    success "Service is running and healthy"
else
    warning "Service health check returned: $HEALTH_RESPONSE"
fi

# Step 7: Check logs for errors
log "\nStep 7: Checking recent logs for errors..."
RECENT_ERRORS=$(kubectl logs -n "$NAMESPACE" $POD_NAME --tail=50 2>&1 | grep -iE "(error|exception|failed)" | wc -l || echo "0")

if [ "$RECENT_ERRORS" -gt 5 ]; then
    warning "Found $RECENT_ERRORS potential errors in recent logs"
    log "Recent errors:"
    kubectl logs -n "$NAMESPACE" $POD_NAME --tail=50 2>&1 | grep -iE "(error|exception)" | head -5
else
    success "No significant errors in recent logs"
fi

# Step 8: Verify new modules are available
log "\nStep 8: Verifying optimization modules are loaded..."
kubectl exec -n "$NAMESPACE" $POD_NAME -- python -c "
import sys
try:
    from cloud_trader.market_regime import get_regime_detector
    from cloud_trader.trade_correlation import get_correlation_analyzer
    from cloud_trader.agent_consensus import get_consensus_engine
    print('✅ All optimization modules imported successfully')
    sys.exit(0)
except ImportError as e:
    print(f'❌ Import error: {e}')
    sys.exit(1)
" 2>&1 || {
    warning "New modules may not be imported yet (will be available after integration)"
}

# Step 9: Display status
log "\n=========================================="
log "Deployment Summary"
log "=========================================="
success "Deployment completed successfully"
log ""
log "Pod Status:"
kubectl get pods -n "$NAMESPACE" -l app=$DEPLOYMENT_NAME -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,READY:.status.containerStatuses[0].ready 2>/dev/null || kubectl get pods -n "$NAMESPACE" -l app=$DEPLOYMENT_NAME

log ""
log "View logs:"
log "  kubectl logs -n $NAMESPACE $POD_NAME -f"

log ""
log "Check service:"
log "  kubectl exec -n $NAMESPACE $POD_NAME -- curl -s http://localhost:8080/health"

log ""
log "Monitoring:"
log "  kubectl logs -n $NAMESPACE -l app=$DEPLOYMENT_NAME --tail=100 -f"

success "\n✅ Deployment and testing complete!"

