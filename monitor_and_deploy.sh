#!/bin/bash
echo "🚀 SAPPHIRE TRADING - MONITOR & DEPLOY"
echo "====================================="

# Function to check Cloud Build status
check_build_status() {
    BUILD_STATUS=$(gcloud builds list --project=sapphireinfinite --limit=1 --format="value(status)")
    echo "Cloud Build Status: $BUILD_STATUS"
    echo "$BUILD_STATUS"
}

# Function to get latest build details
get_build_info() {
    gcloud builds list --project=sapphireinfinite --limit=1 --format="table(name,status,startTime,duration,results.images[0].name)"
}

# Function to check pod rollout status
check_pod_rollout() {
    echo "📊 Pod Status:"
    kubectl get pods -n trading --no-headers | awk '{print $1 ": " $3}' | sort
    
    READY_COUNT=$(kubectl get pods -n trading --no-headers | grep "1/1" | wc -l)
    TOTAL_COUNT=$(kubectl get pods -n trading --no-headers | wc -l)
    PENDING_COUNT=$(kubectl get pods -n trading --no-headers | grep "Pending" | wc -l)
    
    echo "Ready: $READY_COUNT/$TOTAL_COUNT pods"
    [ "$PENDING_COUNT" -gt 0 ] && echo "⚠️  Pending: $PENDING_COUNT pods"
}

# Function to check infrastructure
check_infrastructure() {
    echo "🌐 Infrastructure Status:"
    
    LB_IP=$(kubectl get ingress -n trading -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    if [ -n "$LB_IP" ]; then
        echo "✅ Load Balancer: $LB_IP"
    else
        echo "⏳ Load Balancer: Still provisioning"
    fi
    
    CERT_STATUS=$(kubectl get managedcertificate -n trading -o jsonpath='{.items[0].status.certificateStatus}' 2>/dev/null)
    if [ "$CERT_STATUS" = "Active" ]; then
        echo "✅ SSL Certificate: Active"
    else
        echo "⏳ SSL Certificate: $CERT_STATUS"
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    LB_IP=$(kubectl get ingress -n trading -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    
    if [ -n "$LB_IP" ]; then
        echo "🧪 Testing API Endpoints:"
        
        # Test health endpoint
        HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 https://api.sapphiretrade.xyz/healthz 2>/dev/null || echo "failed")
        if [ "$HEALTH_CODE" = "200" ]; then
            echo "✅ Health Check: PASSED"
            
            # Check for trading errors
            HEALTH_RESPONSE=$(curl -s https://api.sapphiretrade.xyz/healthz 2>/dev/null)
            if echo "$HEALTH_RESPONSE" | grep -q '"last_error":null'; then
                echo "✅ Trading Logic: NO ERRORS"
            else
                echo "⚠️  Trading Logic: ERRORS DETECTED"
                ERROR_MSG=$(echo "$HEALTH_RESPONSE" | jq -r '.last_error' 2>/dev/null || echo "Parse error")
                echo "   Error: $ERROR_MSG"
            fi
        else
            echo "❌ Health Check: FAILED (HTTP $HEALTH_CODE)"
        fi
        
        # Test portfolio endpoint
        PORTFOLIO_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 https://api.sapphiretrade.xyz/portfolio-status 2>/dev/null || echo "failed")
        if [ "$PORTFOLIO_CODE" = "200" ]; then
            echo "✅ Portfolio API: RESPONDING"
        else
            echo "❌ Portfolio API: FAILED (HTTP $PORTFOLIO_CODE)"
        fi
    else
        echo "⏳ API Testing: Load balancer not ready yet"
    fi
}

# Function to execute DNS updates
execute_dns_updates() {
    LB_IP=$(kubectl get ingress -n trading -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    
    if [ -n "$LB_IP" ]; then
        echo "🌐 DNS UPDATE REQUIRED:"
        echo "======================"
        echo "Please update these DNS records:"
        echo ""
        echo "1. api.sapphiretrade.xyz → A record: $LB_IP"
        echo "2. sapphiretrade.xyz → CNAME: sapphireinfinite.web.app"
        echo ""
        echo "After DNS updates (5-30 min propagation):"
        echo "- Frontend: https://sapphiretrade.xyz"
        echo "- API: https://api.sapphiretrade.xyz"
        echo ""
        echo "⚠️  IMPORTANT: Test endpoints before deleting old project!"
    else
        echo "⏳ DNS Updates: Waiting for load balancer IP"
    fi
}

# Main monitoring loop
echo "🔍 Monitoring Cloud Build completion..."
BUILD_COMPLETE=false
ATTEMPTS=0
MAX_ATTEMPTS=60  # 10 minutes

while [ "$BUILD_COMPLETE" = false ] && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    echo ""
    echo "📡 Check #$((ATTEMPTS+1)) - $(date '+%H:%M:%S')"
    
    BUILD_STATUS=$(check_build_status)
    
    if [ "$BUILD_STATUS" = "SUCCESS" ]; then
        echo ""
        echo "🎉 CLOUD BUILD COMPLETED SUCCESSFULLY!"
        echo "===================================="
        
        get_build_info
        
        echo ""
        echo "🚀 DEPLOYING NEW CONTAINER IMAGE..."
        
        # Trigger deployment (the deployment should auto-update with the new image)
        kubectl rollout restart deployment/cloud-trader -n trading
        
        echo "⏳ Waiting for deployment rollout..."
        sleep 30
        
        check_pod_rollout
        
        echo ""
        echo "🔧 Checking for infrastructure readiness..."
        check_infrastructure
        
        echo ""
        test_api_endpoints
        
        echo ""
        execute_dns_updates
        
        BUILD_COMPLETE=true
        
    elif [ "$BUILD_STATUS" = "FAILURE" ] || [ "$BUILD_STATUS" = "TIMEOUT" ] || [ "$BUILD_STATUS" = "CANCELLED" ]; then
        echo ""
        echo "❌ CLOUD BUILD FAILED!"
        echo "==================="
        get_build_info
        
        echo ""
        echo "🔍 TROUBLESHOOTING STEPS:"
        echo "1. Check build logs: gcloud builds log <build-id>"
        echo "2. Verify Dockerfile syntax"
        echo "3. Check Artifact Registry permissions"
        echo "4. Review recent code changes"
        
        exit 1
        
    else
        echo "⏳ Still building... ($BUILD_STATUS)"
        sleep 10
        ((ATTEMPTS++))
    fi
done

if [ "$BUILD_COMPLETE" = false ]; then
    echo ""
    echo "⏰ TIMEOUT: Cloud Build taking longer than expected"
    echo "   Check status manually: gcloud builds list --project=sapphireinfinite"
    exit 1
fi

echo ""
echo "🎯 DEPLOYMENT COMPLETE!"
echo "====================="
echo "✅ Code fixes deployed"
echo "✅ Container image updated"  
echo "✅ Pod rollout initiated"
echo "⏳ Infrastructure provisioning ongoing"
echo ""
echo "📋 NEXT: Update DNS records when infrastructure is ready"
