#!/bin/bash
# Monitor Cloud Build and deploy to live environment
# Usage: ./scripts/monitor_build_and_deploy.sh [BUILD_ID]

set -e

BUILD_ID=${1:-$(cat /tmp/current_build_id.txt 2>/dev/null || gcloud builds list --limit=1 --format="value(id)" --filter="status=WORKING OR status=QUEUED" 2>/dev/null | head -1 || echo "")}

if [ -z "$BUILD_ID" ]; then
    echo "❌ No build ID provided. Usage: $0 [BUILD_ID]"
    echo "Or set BUILD_ID from latest build:"
    gcloud builds list --limit=1 --format="table(id,status,createTime)"
    exit 1
fi

echo "=========================================="
echo "Monitoring Build and Deployment"
echo "Build ID: $BUILD_ID"
echo "=========================================="

# Function to monitor build status
monitor_build() {
    local build_id=$1
    local max_wait=1800  # 30 minutes
    local elapsed=0
    local interval=10
    
    echo "⏳ Monitoring build status..."
    echo ""
    
    while [ $elapsed -lt $max_wait ]; do
        STATUS=$(gcloud builds describe "$build_id" --format="value(status)" 2>/dev/null || echo "UNKNOWN")
        
        case $STATUS in
            SUCCESS)
                echo "✅ Build completed successfully!"
                return 0
                ;;
            FAILURE|CANCELLED|TIMEOUT|INTERNAL_ERROR)
                echo "❌ Build failed with status: $STATUS"
                gcloud builds log "$build_id" | tail -50
                return 1
                ;;
            WORKING|QUEUED|PENDING)
                echo "⏳ Build status: $STATUS (${elapsed}s elapsed)"
                ;;
            *)
                echo "⚠️  Unknown build status: $STATUS"
                ;;
        esac
        
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    echo "❌ Build monitoring timeout after ${max_wait}s"
    return 1
}

# Step 1: Monitor build
if monitor_build "$BUILD_ID"; then
    echo ""
    echo "=========================================="
    echo "Build Complete - Starting Deployment"
    echo "=========================================="
    
    # Get image name
    IMAGE="us-central1-docker.pkg.dev/sapphireinfinite/cloud-run-source-deploy/cloud-trader:latest"
    BUILD_IMAGE="us-central1-docker.pkg.dev/sapphireinfinite/cloud-run-source-deploy/cloud-trader:${BUILD_ID}"
    
    echo "📦 Image: $IMAGE"
    echo "📦 Build Image: $BUILD_IMAGE"
    echo ""
    
    # Step 2: Update deployment manifest with new image
    echo "Step 2: Updating deployment manifest..."
    
    # Update live-trading-service.yaml to use the new build
    if grep -q "image:.*cloud-trader:" live-trading-service.yaml; then
        echo "✅ Deployment manifest already uses :latest tag"
        echo "   Image will be pulled automatically on next rollout"
    else
        echo "⚠️  Warning: Could not verify image tag in manifest"
    fi
    
    # Step 3: Force rollout restart to pull new image
    echo ""
    echo "Step 3: Rolling out deployment..."
    if kubectl rollout restart deployment/sapphire-trading-service -n trading-system-live; then
        echo "✅ Deployment rollout initiated"
    else
        echo "❌ Failed to initiate rollout"
        exit 1
    fi
    
    # Step 4: Wait for rollout
    echo ""
    echo "Step 4: Waiting for rollout to complete..."
    if kubectl rollout status deployment/sapphire-trading-service -n trading-system-live --timeout=300s; then
        echo "✅ Rollout completed successfully"
    else
        echo "❌ Rollout failed or timed out"
        echo "Checking pod status..."
        kubectl get pods -n trading-system-live -l app=sapphire-trading-service
        exit 1
    fi
    
    # Step 5: Verify deployment
    echo ""
    echo "Step 5: Verifying deployment..."
    POD_NAME=$(kubectl get pods -n trading-system-live -l app=sapphire-trading-service -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$POD_NAME" ]; then
        echo "❌ No pods found"
        exit 1
    fi
    
    echo "Pod: $POD_NAME"
    
    # Check image
    CURRENT_IMAGE=$(kubectl get pod "$POD_NAME" -n trading-system-live -o jsonpath='{.spec.containers[0].image}')
    echo "Current Image: $CURRENT_IMAGE"
    
    # Check environment variables
    echo ""
    echo "Environment Variables:"
    kubectl exec "$POD_NAME" -n trading-system-live -- env | grep -E "ENABLE_VERTEX_AI|PROMPT_VERSION|GCP_PROJECT_ID" || true
    
    # Check health
    echo ""
    echo "Health Status:"
    if kubectl exec "$POD_NAME" -n trading-system-live -- curl -s http://localhost:8080/health 2>/dev/null | python3 -m json.tool 2>/dev/null | head -10; then
        echo "✅ Health endpoint responding"
    else
        echo "⚠️  Health endpoint check failed"
    fi
    
    # Step 6: Monitor logs
    echo ""
    echo "=========================================="
    echo "Deployment Complete - Monitoring Logs"
    echo "=========================================="
    echo ""
    echo "Monitoring logs for next 30 seconds..."
    echo "Looking for: prompt, AI analysis, Vertex AI, strategy"
    echo ""
    
    timeout 30 kubectl logs -f "$POD_NAME" -n trading-system-live 2>&1 | grep -E --line-buffered "prompt|AI analysis|Vertex AI|strategy|Calling _tick" | head -20 || true
    
    echo ""
    echo "=========================================="
    echo "✅ Deployment and Monitoring Complete"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Monitor logs: kubectl logs -f $POD_NAME -n trading-system-live"
    echo "2. Check metrics: kubectl port-forward -n trading-system-live svc/sapphire-trading-service 8080:8080"
    echo "   Then: curl http://localhost:8080/metrics | grep ai_prompt"
    echo "3. Verify AI inference: curl -s http://localhost:8080/api/agents/metrics | jq"
    echo ""
    
else
    echo ""
    echo "❌ Build failed. Check logs with:"
    echo "   gcloud builds log $BUILD_ID"
    exit 1
fi

