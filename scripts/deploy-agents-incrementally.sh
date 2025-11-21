#!/bin/bash
# Deploy agents one at a time with verification

set -e

AGENTS=("trend-momentum" "strategy-optimization" "financial-sentiment" "market-prediction" "volume-microstructure" "vpin-hft")

echo "🤖 Deploying Sapphire AI agents incrementally..."
echo "================================================"

for agent in "${AGENTS[@]}"; do
  echo ""
  echo "🚀 Deploying $agent agent..."

  helm upgrade trading-system ./helm/trading-system \
    --namespace trading \
    --set agents.enabled=true \
    --set agents.$agent.enabled=true \
    --reuse-values

  echo "⏳ Waiting for $agent pod to become Ready..."
  kubectl wait --for=condition=Ready pod \
    -l agent=$agent \
    -n trading \
    --timeout=5m || {
      echo "❌ $agent failed to become Ready"
      echo "Pod status:"
      kubectl get pods -l agent=$agent -n trading
      echo "Pod logs:"
      kubectl logs -l agent=$agent -n trading --tail=50
      exit 1
    }

  echo "✅ $agent deployed successfully"
  echo "Letting agent stabilize for 30 seconds..."
  sleep 30
done

echo ""
echo "================================================"
echo "🎉 All agents deployed successfully!"
echo ""
kubectl get pods -n trading
