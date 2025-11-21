#!/bin/bash
# Comprehensive verification of live trading status

set -e

echo "🔍 Comprehensive Live Trading Status Check"
echo "==========================================="
echo ""

API_URL="${API_URL:-https://api.sapphiretrade.xyz}"
FALLBACK_URL="https://trader.sapphiretrade.xyz"

# Determine which URL works
if curl -s -f "${API_URL}/healthz" > /dev/null 2>&1; then
    ACTIVE_URL="${API_URL}"
elif curl -s -f "${FALLBACK_URL}/healthz" > /dev/null 2>&1; then
    ACTIVE_URL="${FALLBACK_URL}"
else
    echo "❌ No accessible trading service found"
    exit 1
fi

echo "✅ Service accessible at: ${ACTIVE_URL}"
echo ""

# Check health
echo "1. Health Check:"
HEALTH=$(curl -s "${ACTIVE_URL}/healthz" 2>/dev/null || echo "{}")
echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "   Response: $HEALTH"

RUNNING=$(echo "$HEALTH" | grep -o '"running":[^,}]*' | cut -d: -f2 | tr -d ' "' || echo "unknown")
PAPER_TRADING=$(echo "$HEALTH" | grep -o '"paper_trading":[^,}]*' | cut -d: -f2 | tr -d ' "' || echo "unknown")

if [ "$RUNNING" = "true" ] || [ "$RUNNING" = "True" ]; then
    echo "   ✅ Service is RUNNING"
else
    echo "   ⚠️  Service status: $RUNNING"
fi

if [ "$PAPER_TRADING" = "false" ] || [ "$PAPER_TRADING" = "False" ]; then
    echo "   ✅ LIVE TRADING is ENABLED"
elif [ "$PAPER_TRADING" = "true" ] || [ "$PAPER_TRADING" = "True" ]; then
    echo "   ⚠️  PAPER TRADING is active (not live)"
else
    echo "   ⚠️  Paper trading status: $PAPER_TRADING"
fi

echo ""

# Check agents
echo "2. Agent Status:"
AGENTS=$(curl -s "${ACTIVE_URL}/api/agents" 2>/dev/null || echo "{}")
echo "$AGENTS" | python3 -m json.tool 2>/dev/null || echo "   Response: $AGENTS"

ENABLED_COUNT=$(echo "$AGENTS" | grep -o '"total_enabled":[0-9]*' | cut -d: -f2 || echo "0")
TOTAL_AGENTS=$(echo "$AGENTS" | grep -o '"total":[0-9]*' | cut -d: -f2 || echo "6")

if [ -n "$ENABLED_COUNT" ] && [ "$ENABLED_COUNT" -gt 0 ]; then
    echo "   ✅ $ENABLED_COUNT/$TOTAL_AGENTS agents enabled"
else
    echo "   ⚠️  No agents enabled"
    echo "   💡 Run: ./scripts/enable-all-agents.sh"
    echo "   💡 Or enable via dashboard: https://sapphiretrade.xyz"
fi

echo ""

# Check portfolio
echo "3. Portfolio Status:"
PORTFOLIO=$(curl -s "${ACTIVE_URL}/api/portfolio" 2>/dev/null || echo "{}")
echo "$PORTFOLIO" | python3 -m json.tool 2>/dev/null | head -30 || echo "   Response: $PORTFOLIO"

echo ""

# Check recent trades
echo "4. Recent Activity:"
RECENT=$(curl -s "${ACTIVE_URL}/api/trading/recent" 2>/dev/null || echo "{}")
echo "$RECENT" | python3 -m json.tool 2>/dev/null | head -20 || echo "   Response: $RECENT"

echo ""
echo "✅ Status check complete!"
echo ""
echo "📊 Summary:"
echo "   Service: ${ACTIVE_URL}"
echo "   Running: ${RUNNING:-unknown}"
echo "   Paper Trading: ${PAPER_TRADING:-unknown}"
echo "   Enabled Agents: ${ENABLED_COUNT:-0}/${TOTAL_AGENTS:-6}"
echo ""
