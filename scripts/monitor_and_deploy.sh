#!/bin/bash
# Comprehensive Monitoring and Deployment Script
# Monitors trading service, deploys frontend, checks Telegram, and handles DNS

set -e

PROJECT_ID="sapphireinfinite"
NAMESPACE="trading-system-live"
FIREBASE_SITE="sapphire-trading"
DEPLOYMENT_NAME="sapphire-trading-service"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        error "$1 not found. Please install it."
        return 1
    fi
}

# Check deployment health
check_deployment() {
    log "Checking deployment health..."
    
    POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT_NAME -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$POD_NAME" ]; then
        error "No pods found for $DEPLOYMENT_NAME"
        return 1
    fi
    
    STATUS=$(kubectl get pod $POD_NAME -n $NAMESPACE -o jsonpath='{.status.phase}' 2>/dev/null)
    
    if [ "$STATUS" != "Running" ]; then
        error "Pod $POD_NAME is not running. Status: $STATUS"
        kubectl describe pod $POD_NAME -n $NAMESPACE | tail -20
        return 1
    fi
    
    success "Pod $POD_NAME is running"
    
    # Check health endpoint
    HEALTH=$(kubectl exec -n $NAMESPACE $POD_NAME -- curl -s http://localhost:8080/health 2>/dev/null || echo "{}")
    PAPER_TRADING=$(echo $HEALTH | jq -r '.paper_trading // "unknown"' 2>/dev/null || echo "unknown")
    RUNNING=$(echo $HEALTH | jq -r '.running // false' 2>/dev/null || echo "false")
    
    if [ "$PAPER_TRADING" = "false" ] && [ "$RUNNING" = "true" ]; then
        success "Service is running in LIVE trading mode"
    else
        warning "Service status - Running: $RUNNING, Paper Trading: $PAPER_TRADING"
    fi
    
    return 0
}

# Check Telegram configuration
check_telegram() {
    log "Checking Telegram configuration..."
    
    POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT_NAME -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$POD_NAME" ]; then
        error "No pods found"
        return 1
    fi
    
    BOT_TOKEN=$(kubectl exec -n $NAMESPACE $POD_NAME -- printenv TELEGRAM_BOT_TOKEN 2>/dev/null || echo "")
    CHAT_ID=$(kubectl exec -n $NAMESPACE $POD_NAME -- printenv TELEGRAM_CHAT_ID 2>/dev/null || echo "")
    
    if [ -z "$BOT_TOKEN" ] || [ -z "$CHAT_ID" ]; then
        error "Telegram not configured properly"
        return 1
    fi
    
    if [[ "$BOT_TOKEN" == *"dummy"* ]] || [[ "$BOT_TOKEN" == "" ]]; then
        error "Telegram bot token appears to be dummy or empty"
        return 1
    fi
    
    success "Telegram configured - Bot Token: ${BOT_TOKEN:0:10}..., Chat ID: $CHAT_ID"
    return 0
}

# Check trading activity
check_trading_activity() {
    log "Checking trading activity..."
    
    POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT_NAME -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$POD_NAME" ]; then
        error "No pods found"
        return 1
    fi
    
    # Check recent logs for trading activity
    RECENT_TRADES=$(kubectl logs -n $NAMESPACE $POD_NAME --tail=100 2>&1 | grep -iE "(trade|signal|execute|decision|BUY|SELL)" | wc -l)
    RECENT_ERRORS=$(kubectl logs -n $NAMESPACE $POD_NAME --tail=100 2>&1 | grep -iE "(error|exception|failed)" | wc -l)
    
    log "Recent trading activity: $RECENT_TRADES mentions in last 100 log lines"
    
    if [ $RECENT_ERRORS -gt 5 ]; then
        warning "$RECENT_ERRORS errors found in recent logs"
        kubectl logs -n $NAMESPACE $POD_NAME --tail=50 2>&1 | grep -iE "(error|exception)" | tail -5
    else
        success "No significant errors in recent logs"
    fi
    
    return 0
}

# Deploy frontend to Firebase
deploy_frontend() {
    log "Deploying frontend to Firebase..."
    
    if [ ! -d "trading-dashboard" ]; then
        error "trading-dashboard directory not found"
        return 1
    fi
    
    cd trading-dashboard
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log "Installing dependencies..."
        npm install
    fi
    
    # Build the frontend
    log "Building frontend..."
    npm run build
    
    if [ ! -d "dist" ]; then
        error "Build failed - dist directory not found"
        cd ..
        return 1
    fi
    
    # Deploy to Firebase (use default hosting if site not in firebase.json)
    log "Deploying to Firebase Hosting..."
    if grep -q "\"site\".*$FIREBASE_SITE" firebase.json 2>/dev/null; then
        firebase deploy --only hosting:$FIREBASE_SITE --project $PROJECT_ID --non-interactive
    else
        # Deploy to default hosting (will deploy to sapphire-trading if it's the default)
        firebase deploy --only hosting --project $PROJECT_ID --non-interactive
    fi
    
    if [ $? -eq 0 ]; then
        success "Frontend deployed successfully"
        cd ..
        return 0
    else
        error "Firebase deployment failed"
        cd ..
        return 1
    fi
}

# Check DNS and website status
check_dns() {
    log "Checking DNS and website status..."
    
    MAIN_DOMAIN_IP=$(dig +short sapphiretrade.xyz 2>/dev/null | head -1)
    API_DOMAIN_IP=$(dig +short api.sapphiretrade.xyz 2>/dev/null | head -1)
    FIREBASE_URL="https://$FIREBASE_SITE.web.app"
    
    log "DNS Resolution:"
    echo "  - sapphiretrade.xyz → $MAIN_DOMAIN_IP"
    echo "  - api.sapphiretrade.xyz → $API_DOMAIN_IP"
    
    # Test Firebase URL
    if curl -s -o /dev/null -w "%{http_code}" $FIREBASE_URL | grep -q "200"; then
        success "Firebase site is accessible: $FIREBASE_URL"
    else
        warning "Firebase site may not be accessible: $FIREBASE_URL"
    fi
    
    # Test main domain
    MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://sapphiretrade.xyz 2>/dev/null || echo "000")
    if [ "$MAIN_STATUS" = "200" ]; then
        success "Main domain is accessible: https://sapphiretrade.xyz"
    else
        warning "Main domain returned status: $MAIN_STATUS"
    fi
    
    return 0
}

# Update Kubernetes secret if needed
update_secrets() {
    log "Checking and updating Kubernetes secrets if needed..."
    
    # Check if secret exists and has all keys
    KEYS=$(kubectl get secret cloud-trader-secrets -n $NAMESPACE -o json 2>/dev/null | jq -r '.data | keys[]' 2>/dev/null || echo "")
    
    if [ -z "$KEYS" ]; then
        error "Secret cloud-trader-secrets not found"
        return 1
    fi
    
    REQUIRED_KEYS=("ASTER_API_KEY" "ASTER_SECRET_KEY" "TELEGRAM_BOT_TOKEN" "TELEGRAM_CHAT_ID")
    MISSING_KEYS=()
    
    for KEY in "${REQUIRED_KEYS[@]}"; do
        if ! echo "$KEYS" | grep -q "^$KEY$"; then
            MISSING_KEYS+=("$KEY")
        fi
    done
    
    if [ ${#MISSING_KEYS[@]} -gt 0 ]; then
        warning "Missing keys in secret: ${MISSING_KEYS[*]}"
        log "Updating secret from Secret Manager..."
        
        # Get values from Secret Manager
        ASTER_API_KEY=$(gcloud secrets versions access latest --secret="ASTER_API_KEY" --project=$PROJECT_ID 2>/dev/null)
        ASTER_SECRET_KEY=$(gcloud secrets versions access latest --secret="ASTER_SECRET_KEY" --project=$PROJECT_ID 2>/dev/null)
        TELEGRAM_BOT_TOKEN=$(gcloud secrets versions access latest --secret="TELEGRAM_BOT_TOKEN" --project=$PROJECT_ID 2>/dev/null)
        TELEGRAM_CHAT_ID=$(gcloud secrets versions access latest --secret="TELEGRAM_CHAT_ID" --project=$PROJECT_ID 2>/dev/null)
        
        if [ -z "$ASTER_API_KEY" ] || [ -z "$ASTER_SECRET_KEY" ]; then
            error "Failed to retrieve Aster credentials from Secret Manager"
            return 1
        fi
        
        # Update secret
        kubectl create secret generic cloud-trader-secrets -n $NAMESPACE \
            --from-literal=ASTER_API_KEY="$ASTER_API_KEY" \
            --from-literal=ASTER_SECRET_KEY="$ASTER_SECRET_KEY" \
            --from-literal=TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" \
            --from-literal=TELEGRAM_CHAT_ID="$TELEGRAM_CHAT_ID" \
            --dry-run=client -o yaml | kubectl apply -f -
        
        success "Secret updated"
    else
        success "All required keys present in secret"
    fi
    
    return 0
}

# Restart deployment if needed
restart_deployment() {
    log "Checking if deployment restart is needed..."
    
    # Check for pods in error state
    ERROR_PODS=$(kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT_NAME -o json 2>/dev/null | \
        jq -r '.items[] | select(.status.phase != "Running") | .metadata.name' 2>/dev/null || echo "")
    
    if [ -n "$ERROR_PODS" ]; then
        warning "Found pods in error state. Restarting deployment..."
        kubectl rollout restart deployment/$DEPLOYMENT_NAME -n $NAMESPACE
        kubectl rollout status deployment/$DEPLOYMENT_NAME -n $NAMESPACE --timeout=300s
        success "Deployment restarted"
    else
        success "No restart needed"
    fi
    
    return 0
}

# Main monitoring loop
monitor_loop() {
    log "Starting monitoring loop (every 5 minutes)..."
    
    while true; do
        echo ""
        log "=== Monitoring Check $(date +'%Y-%m-%d %H:%M:%S') ==="
        
        check_deployment
        check_telegram
        check_trading_activity
        
        sleep 300  # 5 minutes
    done
}

# Main execution
main() {
    log "Starting Monitoring and Deployment Script"
    log "Project: $PROJECT_ID"
    log "Namespace: $NAMESPACE"
    log "Firebase Site: $FIREBASE_SITE"
    
    # Check required commands
    check_command kubectl || exit 1
    check_command gcloud || exit 1
    check_command jq || exit 1
    
    # Parse arguments
    MODE=${1:-"all"}
    
    case $MODE in
        "deploy")
            update_secrets
            restart_deployment
            deploy_frontend
            ;;
        "monitor")
            check_deployment
            check_telegram
            check_trading_activity
            check_dns
            ;;
        "frontend")
            deploy_frontend
            ;;
        "secrets")
            update_secrets
            restart_deployment
            ;;
        "watch")
            monitor_loop
            ;;
        "all"|*)
            update_secrets
            restart_deployment
            check_deployment
            check_telegram
            check_trading_activity
            deploy_frontend
            check_dns
            ;;
    esac
    
    success "Script completed"
}

# Run main function
main "$@"

