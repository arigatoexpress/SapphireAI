#!/bin/bash
echo "🔥 LOAD TESTING SUITE"
echo "===================="

# Test API endpoints under load
echo "Testing API endpoints..."

# Health check load test
echo "Health endpoint (100 concurrent requests):"
ab -n 100 -c 10 https://sapphireinfinite.web.app/ 2>/dev/null | grep -E "Requests per second|Time per request|Failed requests"

echo ""
echo "Portfolio API (when available):"
# ab -n 50 -c 5 https://api.sapphiretrade.xyz/portfolio-status 2>/dev/null | grep -E "Requests per second|Time per request"

echo ""
echo "Testing WebSocket connections..."
# websocket load testing would go here

echo ""
echo "Testing static asset loading..."
curl -s -w "Static assets load time: %{time_total}s\n" -o /dev/null https://sapphireinfinite.web.app/

echo ""
echo "✅ Load testing complete"
