#!/bin/bash
# Script to enable all trading agents for live trading

set -e

echo "🚀 Enabling All Trading Agents"
echo "==============================="
echo ""

API_URL="${API_URL:-https://api.sapphiretrade.xyz}"

# Check if API is accessible
if ! curl -s -f "${API_URL}/healthz" > /dev/null 2>&1; then
    # Try alternative endpoint
    if curl -s -f "https://trader.sapphiretrade.xyz/healthz" > /dev/null 2>&1; then
        API_URL="https://trader.sapphiretrade.xyz"
    else
        echo "❌ Trading service not accessible"
        exit 1
    fi
fi

echo "✅ Connected to: ${API_URL}"
echo ""

# List of all agent IDs
AGENT_IDS=(
    "trend-momentum-agent"
    "strategy-optimization-agent"
    "financial-sentiment-agent"
    "market-prediction-agent"
    "volume-microstructure-agent"
    "vpin-hft"
)

echo "📋 Enabling ${#AGENT_IDS[@]} trading agents..."
echo ""

ENABLED_COUNT=0
FAILED_COUNT=0

for agent_id in "${AGENT_IDS[@]}"; do
    echo -n "   Enabling ${agent_id}... "

    # Check if agent is already enabled
    STATUS=$(curl -s "${API_URL}/api/agents" 2>/dev/null | grep -o "\"id\":\"${agent_id}\"" || echo "")

    if [ -n "$STATUS" ]; then
        # Try to enable via API (requires admin token if configured)
        RESPONSE=$(curl -s -X POST "${API_URL}/api/agents/${agent_id}/enable" \
            -H "Content-Type: application/json" \
            -w "\n%{http_code}" 2>/dev/null || echo "ERROR")

        HTTP_CODE=$(echo "$RESPONSE" | tail -1)
        BODY=$(echo "$RESPONSE" | sed '$d')

        if [ "$HTTP_CODE" = "200" ] || echo "$BODY" | grep -q "enabled"; then
            echo "✅"
            ((ENABLED_COUNT++))
        elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
            echo "⚠️  (Admin auth required - use dashboard)"
        else
            echo "⚠️  (HTTP $HTTP_CODE)"
            ((FAILED_COUNT++))
        fi
    else
        echo "⚠️  (Agent not found)"
        ((FAILED_COUNT++))
    fi
done

echo ""
echo "📊 Summary:"
echo "   ✅ Enabled: $ENABLED_COUNT"
echo "   ⚠️  Issues: $FAILED_COUNT"
echo "   📋 Total: ${#AGENT_IDS[@]}"
echo ""

if [ $ENABLED_COUNT -eq ${#AGENT_IDS[@]} ]; then
    echo "✅ All agents enabled successfully!"
elif [ $ENABLED_COUNT -gt 0 ]; then
    echo "⚠️  Some agents enabled. Check dashboard or logs for details."
else
    echo "⚠️  No agents enabled. This may require:"
    echo "   1. Admin authentication token"
    echo "   2. Access via dashboard: https://sapphiretrade.xyz"
    echo "   3. Verify service is running and accessible"
fi

echo ""
echo "💡 Tip: Enable agents via dashboard at https://sapphiretrade.xyz for easier control"
echo ""
