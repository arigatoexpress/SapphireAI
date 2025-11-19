# Sapphire Trading System Helm Chart

A production-ready Helm chart for deploying the Sapphire AI Trading System on Kubernetes.

## Overview

This Helm chart deploys a complete AI-powered trading system with:
- **Multi-agent architecture** with 6 specialized trading agents
- **MCP coordinator** for inter-agent communication
- **High-frequency trading engine** with risk management
- **Real-time monitoring** and alerting
- **Production-grade security** and scalability

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Dashboard │────│   Trading API   │────│  AI Agents      │
│   (React)       │    │   (FastAPI)     │    │  (Python)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ MCP Coordinator │
                    │ (WebSocket)     │
                    └─────────────────┘
                             │
                    ┌─────────────────┐
                    │   Redis Cache   │
                    └─────────────────┘
```

## Prerequisites

- Kubernetes 1.25+
- Helm 3.10+
- GKE cluster with appropriate permissions
- Artifact Registry access

## Quick Start

### Development Deployment
```bash
# Deploy to development environment
helm install sapphire-dev . \
  --namespace trading-dev \
  --create-namespace \
  --values values-development.yaml \
  --set global.environment=development \
  --set trading.image.tag=latest
```

### Staging Deployment
```bash
# Deploy to staging environment
helm install sapphire-staging . \
  --namespace trading-staging \
  --create-namespace \
  --values values-staging.yaml \
  --set global.environment=staging \
  --set trading.image.tag=v1.2.3
```

### Production Deployment
```bash
# Deploy to production environment
helm install sapphire-prod . \
  --namespace trading-prod \
  --create-namespace \
  --values values-production.yaml \
  --set global.environment=production \
  --set trading.image.tag=v1.2.3 \
  --set secrets.asterDex.apiKey="your-key" \
  --set secrets.asterDex.apiSecret="your-secret"
```

## Configuration

### Global Settings
```yaml
global:
  imageRegistry: us-central1-docker.pkg.dev
  projectId: your-project-id
  environment: production
  imagePullPolicy: Always
```

### Trading Engine
```yaml
trading:
  enabled: true
  image:
    tag: "latest"
  env:
    - name: ENABLE_PAPER_TRADING
      value: "false"
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 2000m
      memory: 4Gi
```

### AI Agents
```yaml
agents:
  enabled: true
  trendMomentumAgent:
    enabled: true
  strategyOptimizationAgent:
    enabled: true
  # ... other agents
```

### Secrets Management
```yaml
secrets:
  asterDex:
    apiKey: "your-api-key"
    apiSecret: "your-api-secret"
  telegram:
    botToken: "your-bot-token"
    chatId: "your-chat-id"
```

## Deployment Scripts

Use the professional deployment script for automated deployments:

```bash
# Development
ENVIRONMENT=development IMAGE_TAG=latest ./deploy-professional.sh

# Staging
ENVIRONMENT=staging IMAGE_TAG=v1.2.3 ./deploy-professional.sh

# Production
ENVIRONMENT=production IMAGE_TAG=v1.2.3 ./deploy-professional.sh
```

## Environment-Specific Configurations

### Development
- Paper trading enabled
- Debug logging
- Minimal resource allocation
- Selective agents enabled
- No ingress (port-forwarding)

### Staging
- Paper trading enabled
- Info logging
- Moderate resource allocation
- All agents enabled
- No ingress (port-forwarding)

### Production
- **Live trading enabled** (`ENABLE_PAPER_TRADING=false`)
- Info logging
- Full resource allocation
- All agents enabled
- Ingress with SSL
- Autoscaling enabled
- Full monitoring

## Agent Management

### Enable/Disable Agents
```bash
# Enable specific agent
helm upgrade sapphire-prod . \
  --set agents.financialSentimentAgent.enabled=true

# Disable agent
helm upgrade sapphire-prod . \
  --set agents.vpinHftAgent.enabled=false
```

### Agent Resource Tuning
```bash
# Increase agent resources
helm upgrade sapphire-prod . \
  --set agents.common.resources.limits.cpu=1000m \
  --set agents.common.resources.limits.memory=2Gi
```

## Monitoring & Observability

### Health Checks
```bash
# Check all pods
kubectl get pods -n trading-prod

# Check services
kubectl get services -n trading-prod

# Port forward to dashboard
kubectl port-forward svc/sapphire-prod-trading 8080:8080 -n trading-prod
```

### Logs
```bash
# Trading engine logs
kubectl logs -f deployment/sapphire-prod-trading -n trading-prod

# Coordinator logs
kubectl logs -f deployment/sapphire-prod-coordinator -n trading-prod

# Agent logs
kubectl logs -f deployment/sapphire-prod-trend-momentum-agent -n trading-prod
```

### Metrics
```bash
# Prometheus metrics
kubectl port-forward svc/sapphire-prod-prometheus 9090:9090 -n trading-prod

# Grafana dashboard
kubectl port-forward svc/sapphire-prod-grafana 3000:3000 -n trading-prod
```

## Security

### Secrets Management
```bash
# Update API credentials
kubectl create secret generic sapphire-prod-secrets \
  --from-literal=ASTER_API_KEY="new-key" \
  --from-literal=ASTER_SECRET_KEY="new-secret" \
  -n trading-prod --dry-run=client -o yaml | kubectl apply -f -
```

### Network Policies
```yaml
networkPolicy:
  enabled: true
  allowInternalTraffic: true
  denyExternalTraffic: true
```

### RBAC
```yaml
rbac:
  enabled: true
  serviceAccount:
    create: true
    annotations:
      iam.gke.io/gcp-service-account: sapphire-trading@project.iam.gserviceaccount.com
```

## Scaling

### Horizontal Pod Autoscaling
```yaml
trading:
  autoscaling:
    enabled: true
    minReplicas: 1
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70
```

### Vertical Pod Autoscaling
```yaml
vpa:
  enabled: true
  updateMode: "Auto"
```

## Troubleshooting

### Common Issues

#### Pods Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n trading-prod

# Check events
kubectl get events -n trading-prod --sort-by=.metadata.creationTimestamp

# Check logs
kubectl logs <pod-name> -n trading-prod --previous
```

#### Image Pull Errors
```bash
# Check image exists
gcloud container images describe us-central1-docker.pkg.dev/project/sapphire-trader:v1.2.3

# Check permissions
gcloud auth configure-docker us-central1-docker.pkg.dev
```

#### Service Connectivity
```bash
# Test service DNS
kubectl exec -it <pod-name> -n trading-prod -- nslookup sapphire-prod-trading.trading-prod.svc.cluster.local

# Test connectivity
kubectl exec -it <pod-name> -n trading-prod -- curl http://sapphire-prod-trading:8080/health
```

### Rollback Procedures
```bash
# Rollback to previous release
helm rollback sapphire-prod 1 -n trading-prod

# Rollback to specific version
helm rollback sapphire-prod 2 -n trading-prod

# Force upgrade if stuck
helm upgrade --install sapphire-prod . --force -n trading-prod
```

## Version Management

### Release Process
1. **Development**: Feature development and testing
2. **Staging**: Integration testing with all agents
3. **Production**: Live deployment with monitoring

### Version Tracking
```bash
# Check release history
helm history sapphire-prod -n trading-prod

# List all releases
helm list -n trading-prod

# Get release values
helm get values sapphire-prod -n trading-prod
```

## Backup & Recovery

### Configuration Backup
```bash
# Backup Helm values
helm get values sapphire-prod -n trading-prod > backup-values.yaml

# Backup secrets (encrypted)
kubectl get secrets -n trading-prod -o yaml > secrets-backup.yaml
```

### Disaster Recovery
```bash
# Quick recovery
helm rollback sapphire-prod 1 -n trading-prod

# Full redeployment
helm uninstall sapphire-prod -n trading-prod
helm install sapphire-prod . -f backup-values.yaml -n trading-prod
```

## Contributing

### Chart Development
```bash
# Lint chart
helm lint .

# Template chart
helm template sapphire-dev . --values values-development.yaml

# Test installation
helm install sapphire-test . --dry-run --debug
```

### Documentation
- Update this README for new features
- Add examples for common use cases
- Document troubleshooting procedures

---

## Support

For issues and questions:
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: This README and related guides
- **Internal Wiki**: Team-specific procedures

**⚠️ Important**: Always test deployments in staging before production. Never deploy directly to production without verification.
