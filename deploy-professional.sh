#!/bin/bash

# Professional Kubernetes Deployment Script for Sapphire Trading System
# Uses Helm charts for version-controlled, reproducible deployments

set -e

# Configuration
NAMESPACE="${NAMESPACE:-trading-system-clean}"
HELM_CHART="./helm/sapphire-trading-system"
RELEASE_NAME="${RELEASE_NAME:-sapphire-trading}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate prerequisites
validate_prerequisites() {
    log_info "Validating prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    # Check helm
    if ! command -v helm &> /dev/null; then
        log_error "helm not found. Please install Helm."
        exit 1
    fi

    # Check gcloud
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud not found. Please install Google Cloud SDK."
        exit 1
    fi

    # Check cluster access
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot access Kubernetes cluster. Please configure kubectl."
        exit 1
    fi

    log_success "Prerequisites validated"
}

# Setup namespace
setup_namespace() {
    log_info "Setting up namespace: $NAMESPACE"

    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

    # Label namespace
    kubectl label namespace "$NAMESPACE" environment="$ENVIRONMENT" --overwrite

    log_success "Namespace ready"
}

# Create secrets
create_secrets() {
    log_info "Creating/updating secrets..."

    # Check if secrets already exist
    if kubectl get secret sapphire-trading-secrets -n "$NAMESPACE" &> /dev/null; then
        log_warning "Secrets already exist. Skipping creation."
        return
    fi

    # Create secrets from environment variables or prompt
    if [ -n "$ASTER_API_KEY" ] && [ -n "$ASTER_API_SECRET" ]; then
        kubectl create secret generic sapphire-trading-secrets \
            --from-literal=ASTER_API_KEY="$ASTER_API_KEY" \
            --from-literal=ASTER_SECRET_KEY="$ASTER_API_SECRET" \
            --from-literal=TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-dummy}" \
            --from-literal=TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-dummy}" \
            --from-literal=GCP_PROJECT_ID="${GCP_PROJECT_ID:-sapphireinfinite}" \
            -n "$NAMESPACE"
        log_success "Secrets created from environment variables"
    else
        log_warning "API credentials not provided. Creating dummy secrets."
        log_warning "Please update secrets manually before enabling live trading:"
        echo "  kubectl create secret generic sapphire-trading-secrets \\"
        echo "    --from-literal=ASTER_API_KEY='your-key' \\"
        echo "    --from-literal=ASTER_SECRET_KEY='your-secret' \\"
        echo "    -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -"

        # Create dummy secrets for now
        kubectl create secret generic sapphire-trading-secrets \
            --from-literal=ASTER_API_KEY="dummy" \
            --from-literal=ASTER_SECRET_KEY="dummy" \
            --from-literal=TELEGRAM_BOT_TOKEN="dummy" \
            --from-literal=TELEGRAM_CHAT_ID="dummy" \
            --from-literal=GCP_PROJECT_ID="sapphireinfinite" \
            -n "$NAMESPACE"
    fi
}

# Deploy with Helm
deploy_with_helm() {
    log_info "Deploying with Helm chart..."
    log_info "Release: $RELEASE_NAME"
    log_info "Namespace: $NAMESPACE"
    log_info "Image Tag: $IMAGE_TAG"
    log_info "Environment: $ENVIRONMENT"

    # Update dependencies
    helm dependency update "$HELM_CHART"

    # Deploy with custom values
    helm upgrade --install "$RELEASE_NAME" "$HELM_CHART" \
        --namespace "$NAMESPACE" \
        --create-namespace \
        --set global.imageRegistry="us-central1-docker.pkg.dev" \
        --set global.projectId="sapphireinfinite" \
        --set global.environment="$ENVIRONMENT" \
        --set trading.image.tag="$IMAGE_TAG" \
        --set coordinator.image.tag="$IMAGE_TAG" \
        --set agents.common.image.tag="$IMAGE_TAG" \
        --wait \
        --timeout 600s

    log_success "Helm deployment completed"
}

# Wait for rollout completion
wait_for_rollout() {
    log_info "Waiting for deployments to be ready..."

    # Wait for core components
    kubectl wait --for=condition=available --timeout=300s deployment/"$RELEASE_NAME-coordinator" -n "$NAMESPACE"
    kubectl wait --for=condition=available --timeout=300s deployment/"$RELEASE_NAME-trading" -n "$NAMESPACE"

    # Wait for agents (optional, they might not be fully functional yet)
    for agent in trend-momentum-agent strategy-optimization-agent financial-sentiment-agent market-prediction-agent volume-microstructure-agent vpin-hft; do
        if kubectl get deployment "$RELEASE_NAME-$agent" -n "$NAMESPACE" &> /dev/null; then
            kubectl wait --for=condition=available --timeout=300s deployment/"$RELEASE_NAME-$agent" -n "$NAMESPACE" || log_warning "Agent $agent failed to start"
        fi
    done

    log_success "Core deployments ready"
}

# Health checks
run_health_checks() {
    log_info "Running post-deployment health checks..."

    # Check pod status
    echo "Pod Status:"
    kubectl get pods -n "$NAMESPACE" --no-headers | head -10

    # Check services
    echo -e "\nService Status:"
    kubectl get services -n "$NAMESPACE" --no-headers | head -10

    # Test core service health
    echo -e "\nHealth Checks:"
    if kubectl get service "$RELEASE_NAME-coordinator" -n "$NAMESPACE" &> /dev/null; then
        COORD_IP=$(kubectl get service "$RELEASE_NAME-coordinator" -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
        echo "Coordinator service: $COORD_IP"
    fi

    if kubectl get service "$RELEASE_NAME-trading" -n "$NAMESPACE" &> /dev/null; then
        TRADING_IP=$(kubectl get service "$RELEASE_NAME-trading" -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
        echo "Trading service: $TRADING_IP"
    fi

    log_success "Health checks completed"
}

# Show deployment summary
show_summary() {
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📊 Deployment Summary:"
    echo "  Namespace: $NAMESPACE"
    echo "  Release: $RELEASE_NAME"
    echo "  Environment: $ENVIRONMENT"
    echo "  Image Tag: $IMAGE_TAG"
    echo ""
    echo "🔍 Check deployment status:"
    echo "  kubectl get pods -n $NAMESPACE"
    echo "  kubectl get services -n $NAMESPACE"
    echo ""
    echo "📈 Monitor application:"
    echo "  kubectl logs -f deployment/$RELEASE_NAME-trading -n $NAMESPACE"
    echo "  kubectl logs -f deployment/$RELEASE_NAME-coordinator -n $NAMESPACE"
    echo ""
    echo "🚨 For live trading, ensure:"
    echo "  1. API credentials are updated in secrets"
    echo "  2. ENABLE_PAPER_TRADING=false in config"
    echo "  3. All pre-live checklist items verified"
    echo ""
}

# Main deployment flow
main() {
    echo "🚀 Sapphire Trading System - Professional Deployment"
    echo "=================================================="
    echo "Namespace: $NAMESPACE"
    echo "Release: $RELEASE_NAME"
    echo "Image Tag: $IMAGE_TAG"
    echo "Environment: $ENVIRONMENT"
    echo ""

    validate_prerequisites
    setup_namespace
    create_secrets
    deploy_with_helm
    wait_for_rollout
    run_health_checks
    show_summary

    log_success "Professional deployment completed! 🎯"
}

# Run main function
main "$@"
