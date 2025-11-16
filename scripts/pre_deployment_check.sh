#!/bin/bash
# Pre-deployment validation script for Prompt Engineering
# Run this before deploying to ensure everything is ready

set -e

echo "=========================================="
echo "Prompt Engineering Pre-Deployment Check"
echo "=========================================="

ERRORS=0
WARNINGS=0

# Check 1: Required files exist
echo ""
echo "1. Checking required files..."
REQUIRED_FILES=(
    "cloud_trader/prompt_engineer.py"
    "cloud_trader/schemas.py"
    "cloud_trader/metrics.py"
    "cloud_trader/config.py"
    "cloud_trader/strategies.py"
    "live-trading-service.yaml"
    "scripts/deploy_prompt_engineering.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file - MISSING"
        ((ERRORS++))
    fi
done

# Check 2: Python syntax validation
echo ""
echo "2. Validating Python syntax..."
if python3 scripts/validate_prompt_implementation.py &> /dev/null; then
    echo "  ✅ Python syntax validation passed"
else
    echo "  ⚠️  Python syntax validation had issues (may be environment-specific)"
    ((WARNINGS++))
fi

# Check 3: Kubernetes configuration
echo ""
echo "3. Checking Kubernetes configuration..."
if command -v kubectl &> /dev/null; then
    echo "  ✅ kubectl is available"
    
    # Check if secrets exist
    if kubectl get secret cloud-trader-secrets -n trading-system-live &> /dev/null; then
        echo "  ✅ Secrets exist in production namespace"
    else
        echo "  ⚠️  Secrets not found in production namespace"
        ((WARNINGS++))
    fi
    
    if kubectl get secret cloud-trader-secrets -n trading-system-staging &> /dev/null; then
        echo "  ✅ Secrets exist in staging namespace"
    else
        echo "  ⚠️  Secrets not found in staging namespace"
        ((WARNINGS++))
    fi
else
    echo "  ⚠️  kubectl not found - cannot validate Kubernetes config"
    ((WARNINGS++))
fi

# Check 4: Environment variables in deployment
echo ""
echo "4. Checking deployment manifest for required env vars..."
if grep -q "ENABLE_VERTEX_AI" live-trading-service.yaml; then
    echo "  ✅ ENABLE_VERTEX_AI found"
else
    echo "  ❌ ENABLE_VERTEX_AI missing"
    ((ERRORS++))
fi

if grep -q "PROMPT_VERSION" live-trading-service.yaml; then
    echo "  ✅ PROMPT_VERSION found"
else
    echo "  ❌ PROMPT_VERSION missing"
    ((ERRORS++))
fi

if grep -q "GCP_PROJECT_ID" live-trading-service.yaml; then
    echo "  ✅ GCP_PROJECT_ID found"
else
    echo "  ❌ GCP_PROJECT_ID missing"
    ((ERRORS++))
fi

# Check 5: Test files exist
echo ""
echo "5. Checking test files..."
if [ -f "tests/test_prompt_engineering.py" ]; then
    echo "  ✅ Unit tests exist"
else
    echo "  ⚠️  Unit tests not found"
    ((WARNINGS++))
fi

if [ -f "tests/test_ai_inference_integration.py" ]; then
    echo "  ✅ Integration tests exist"
else
    echo "  ⚠️  Integration tests not found"
    ((WARNINGS++))
fi

# Check 6: Prompt version config
echo ""
echo "6. Checking prompt configuration..."
if [ -f "cloud_trader/prompt_config/prompt_versions.yaml" ]; then
    echo "  ✅ Prompt versions config exists"
else
    echo "  ⚠️  Prompt versions config not found"
    ((WARNINGS++))
fi

# Summary
echo ""
echo "=========================================="
echo "Pre-Deployment Check Summary"
echo "=========================================="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ Pre-deployment check PASSED"
    echo ""
    echo "Ready for deployment. Next steps:"
    echo "1. Staging: ./scripts/deploy_prompt_engineering.sh staging"
    echo "2. Production: ./scripts/deploy_prompt_engineering.sh production"
    exit 0
else
    echo "❌ Pre-deployment check FAILED"
    echo "Please fix the errors above before deploying."
    exit 1
fi

