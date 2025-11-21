#!/bin/bash
# Verification script for Sapphire AI deployment
# Checks pod status, health endpoints, and service connectivity

set -e

NAMESPACE="${NAMESPACE:-trading}"
PROJECT_ID="${PROJECT_ID:-sapphireinfinite}"

echo "🔍 Verifying Sapphire AI deployment in namespace: $NAMESPACE"

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" &>/dev/null; then
  echo "❌ Namespace $NAMESPACE does not exist"
  exit 1
fi

echo "✅ Namespace exists"

# Check pod status
echo ""
echo "📦 Checking pod status..."
PODS_NOT_READY=$(kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[?(@.status.phase!="Running" || @.status.conditions[?(@.type=="Ready")].status!="True")].metadata.name}')

if [ -n "$PODS_NOT_READY" ]; then
  echo "❌ The following pods are not ready:"
  echo "$PODS_NOT_READY"

  # Show pod status for debugging
  echo ""
  echo "Pod status details:"
  kubectl get pods -n "$NAMESPACE" -o wide
  exit 1
fi

echo "✅ All pods are running and ready"

# Check deployments
echo ""
echo "🚀 Checking deployment status..."
DEPLOYMENTS=$(kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')

for deployment in $DEPLOYMENTS; do
  READY_REPLICAS=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
  DESIRED_REPLICAS=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')

  if [ "$READY_REPLICAS" != "$DESIRED_REPLICAS" ]; then
    echo "❌ Deployment $deployment: $READY_REPLICAS/$DESIRED_REPLICAS replicas ready"
    exit 1
  fi

  echo "✅ Deployment $deployment: $READY_REPLICAS/$DESIRED_REPLICAS replicas ready"
done

# Check health endpoints
echo ""
echo "🏥 Checking health endpoints..."

# Cloud Trader
CLOUD_TRADER_POD=$(kubectl get pod -n "$NAMESPACE" -l app=cloud-trader -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$CLOUD_TRADER_POD" ]; then
  echo "Testing cloud-trader health endpoint..."
  if kubectl exec -n "$NAMESPACE" "$CLOUD_TRADER_POD" -- curl -f http://localhost:8080/healthz &>/dev/null; then
    echo "✅ cloud-trader health endpoint responding"
  else
    echo "❌ cloud-trader health endpoint not responding"
    exit 1
  fi
else
  echo "⚠️  No cloud-trader pod found"
fi

# MCP Coordinator
MCP_POD=$(kubectl get pod -n "$NAMESPACE" -l app=mcp-coordinator -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$MCP_POD" ]; then
  echo "Testing mcp-coordinator health endpoint..."
  if kubectl exec -n "$NAMESPACE" "$MCP_POD" -- curl -f http://localhost:8081/healthz &>/dev/null; then
    echo "✅ mcp-coordinator health endpoint responding"
  else
    echo "❌ mcp-coordinator health endpoint not responding"
    exit 1
  fi
else
  echo "⚠️  No mcp-coordinator pod found"
fi

# Check services
echo ""
echo "🌐 Checking services..."
SERVICES=$(kubectl get services -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')

for service in $SERVICES; do
  ENDPOINTS=$(kubectl get endpoints "$service" -n "$NAMESPACE" -o jsonpath='{.subsets[0].addresses[*].ip}' 2>/dev/null || echo "")

  if [ -z "$ENDPOINTS" ]; then
    echo "⚠️  Service $service has no endpoints"
  else
    echo "✅ Service $service has endpoints: $ENDPOINTS"
  fi
done

# Check Redis connectivity (if Redis is deployed)
echo ""
echo "🔴 Checking Redis connectivity..."
REDIS_POD=$(kubectl get pod -n "$NAMESPACE" -l app.kubernetes.io/name=redis -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$REDIS_POD" ]; then
  if kubectl exec -n "$NAMESPACE" "$REDIS_POD" -- redis-cli ping &>/dev/null; then
    echo "✅ Redis is accessible"
  else
    echo "⚠️  Redis pod exists but is not responding to ping"
  fi
else
  echo "ℹ️  Redis not deployed (this is OK for minimal deployments)"
fi

echo ""
echo "✅ All verification checks passed!"
echo "🎉 Deployment is healthy and operational"
