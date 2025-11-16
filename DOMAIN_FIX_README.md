# SAPPHIRETRADE.XYZ DOMAIN FIX PLAN

## CURRENT STATUS
- Domain: sapphiretrade.xyz
- Current DNS: Points to 136.110.138.66 (old hosting provider)
- Firebase Site: sapphire-trading.web.app (working)
- Issue: Domain shows old trading dashboard

## REQUIRED ACTIONS

### 1. Firebase Console Domain Setup
1. Go to https://console.firebase.google.com/project/sapphireinfinite/hosting/sites
2. Select 'sapphire-trading' site
3. Click 'Add custom domain'
4. Enter 'sapphiretrade.xyz'
5. Firebase will provide DNS records to add

### 2. DNS Records to Update
Firebase will provide records like:
- A record: sapphiretrade.xyz -> Firebase IPs
- CNAME: www.sapphiretrade.xyz -> firebase hosting target

### 3. Current DNS Provider
Find where sapphiretrade.xyz DNS is managed (GoDaddy, Namecheap, etc.)
Replace existing A/CNAME records with Firebase records

## VERIFICATION STEPS
1. nslookup sapphiretrade.xyz should return Firebase IPs
2. curl -I https://sapphiretrade.xyz should show Firebase hosting headers
3. Site should show new advanced trading dashboard

## IMMEDIATE WORKAROUND
Until DNS propagates, use: https://sapphire-trading.web.app

