#!/bin/bash
# Pre-deployment check for new optimization modules

set -e

echo "=========================================="
echo "Pre-Deployment Check: Optimizations"
echo "=========================================="

OVERALL_STATUS=0
WARNINGS=0

echo "\n1. Checking new optimization modules..."
REQUIRED_MODULES=(
    "cloud_trader/market_regime.py"
    "cloud_trader/trade_correlation.py"
    "cloud_trader/agent_consensus.py"
)

for module in "${REQUIRED_MODULES[@]}"; do
    if [ -f "$module" ]; then
        echo "  ✅ $module"
        # Check Python syntax (try python3 first, fallback to python)
        if command -v python3 &>/dev/null; then
            PYTHON_CMD=python3
        elif command -v python &>/dev/null; then
            PYTHON_CMD=python
        else
            echo "    ⚠️  Python not found, skipping syntax check"
            WARNINGS=$((WARNINGS+1))
            continue
        fi
        
        if $PYTHON_CMD -m py_compile "$module" 2>/dev/null; then
            echo "    ✅ Valid Python syntax"
        else
            echo "    ❌ Invalid Python syntax"
            OVERALL_STATUS=1
        fi
    else
        echo "  ❌ $module - NOT FOUND"
        OVERALL_STATUS=1
    fi
done

echo "\n2. Checking dependencies..."
# Check if numpy and pandas are in requirements
if grep -q "^numpy\|^pandas" requirements.txt 2>/dev/null; then
    echo "  ✅ numpy and pandas in requirements.txt"
else
    echo "  ⚠️  numpy/pandas not in requirements.txt (may need addition)"
    WARNINGS=$((WARNINGS+1))
fi

echo "\n3. Checking deployment manifest..."
if [ -f "live-trading-service.yaml" ]; then
    echo "  ✅ live-trading-service.yaml exists"
    if grep -q "ENABLE_VERTEX_AI" live-trading-service.yaml; then
        echo "    ✅ Vertex AI enabled"
    else
        echo "    ⚠️  Vertex AI not found in manifest"
        WARNINGS=$((WARNINGS+1))
    fi
else
    echo "  ❌ live-trading-service.yaml not found"
    OVERALL_STATUS=1
fi

echo "\n4. Checking Kubernetes cluster connection..."
if kubectl cluster-info &>/dev/null; then
    echo "  ✅ Kubernetes cluster accessible"
    if kubectl get namespace trading-system-live &>/dev/null; then
        echo "    ✅ trading-system-live namespace exists"
    else
        echo "    ❌ trading-system-live namespace not found"
        OVERALL_STATUS=1
    fi
else
    echo "  ❌ Cannot connect to Kubernetes cluster"
    OVERALL_STATUS=1
fi

echo "\n5. Checking Docker/Cloud Build setup..."
if command -v gcloud &>/dev/null; then
    echo "  ✅ gcloud CLI available"
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
    if [ -n "$PROJECT_ID" ]; then
        echo "    ✅ Project ID: $PROJECT_ID"
    else
        echo "    ⚠️  No GCP project configured"
        WARNINGS=$((WARNINGS+1))
    fi
else
    echo "  ⚠️  gcloud CLI not found (may not be needed for local testing)"
    WARNINGS=$((WARNINGS+1))
fi

echo "\n=========================================="
echo "Pre-Deployment Check Summary"
echo "=========================================="
echo "Errors: $OVERALL_STATUS"
echo "Warnings: $WARNINGS"

if [ $OVERALL_STATUS -eq 0 ]; then
    echo "\n✅ Pre-deployment check PASSED"
    echo "\nReady for deployment!"
    exit 0
else
    echo "\n❌ Pre-deployment check FAILED. Please address the errors above."
    exit 1
fi

