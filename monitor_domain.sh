#!/bin/bash
# Monitor domain connection until it's working

echo '🔍 MONITORING SAPPHIRETRADE.XYZ DOMAIN CONNECTION'
echo '================================================'

while true; do
    echo ''
    echo "Sat Nov 15 23:29:17 CST 2025: Checking domain status..."
    
    # Test DNS
    DNS_RESULT=$(nslookup sapphiretrade.xyz 2>/dev/null | grep -A 1 'Name:' | tail -1 | awk '{print $2}')
    
    if [[ "$DNS_RESULT" == "199.36.158.100" ]]; then
        echo "✅ DNS: Correctly pointing to Firebase ($DNS_RESULT)"
        
        # Test domain access
        HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' https://sapphiretrade.xyz 2>/dev/null)
        
        if [[ "$HTTP_CODE" == "200" ]]; then
            echo "✅ DOMAIN: Successfully connected! ($HTTP_CODE)"
            
            # Check if it serves the new dashboard
            CONTENT_CHECK=$(curl -s https://sapphiretrade.xyz | grep -i 'sapphire.*ai.*trading' | head -1)
            
            if [[ -n "$CONTENT_CHECK" ]]; then
                echo "✅ CONTENT: New advanced dashboard detected!"
                echo ''
                echo '🎊 DOMAIN CONNECTION COMPLETE!'
                echo 'sapphiretrade.xyz now serves your advanced AI trading system!'
                echo ''
                echo '🚀 Ready to trade with real money!'
                break
            else
                echo "⏳ CONTENT: Still loading... (HTTP $HTTP_CODE)"
            fi
        else
            echo "⏳ DOMAIN: Still connecting... (HTTP $HTTP_CODE)"
        fi
    else
        echo "⏳ DNS: Still propagating... (Current: $DNS_RESULT, Expected: 199.36.158.100)"
    fi
    
    echo '⏳ Checking again in 5 minutes...'
    sleep 300
done

