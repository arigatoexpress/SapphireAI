#!/bin/bash
# Domain Fix Verification Script

echo '🔍 SAPPHIRE TRADE DOMAIN VERIFICATION'
echo '====================================='

echo ''
echo '1. DNS Resolution Check:'
nslookup sapphiretrade.xyz

echo ''
echo '2. Firebase Site Status:'
curl -s -I https://sapphire-trading.web.app | head -5

echo ''
echo '3. Custom Domain Status:'
curl -s -I https://sapphiretrade.xyz | head -5

echo ''
echo '4. Content Check (should contain new dashboard):'
curl -s https://sapphiretrade.xyz | grep -i 'sapphire\|trading' | head -3

echo ''
echo '✅ If DNS shows Firebase IPs (199.36.158.100+) and content shows new dashboard, fix is complete!'
echo '⏳ DNS propagation can take 24-48 hours globally'

