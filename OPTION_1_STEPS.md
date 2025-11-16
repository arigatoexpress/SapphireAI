# OPTION 1: Move Domain to New Project
## Step-by-Step Guide

### STEP 1: Disconnect Domain from OLD Project
1. Go to: https://console.firebase.google.com/project/quant-ai-trader-credits/hosting/sites
2. Click on 'sapphiretrade' site
3. Find 'sapphiretrade.xyz' in the domains list
4. Click the '...' menu next to it
5. Select 'Delete domain'
6. Confirm deletion

### STEP 2: Connect Domain to NEW Project  
1. Go to: https://console.firebase.google.com/project/sapphireinfinite/hosting/sites
2. Click on 'sapphire-trading' site
3. Click 'Add custom domain'
4. Enter 'sapphiretrade.xyz'
5. Click 'Continue'
6. Firebase will show DNS records to add

### STEP 3: Update DNS Records
At your domain registrar (where sapphiretrade.xyz is registered):
- DELETE the old A record pointing to old hosting IPs
- ADD the new A records that Firebase provides
- ADD CNAME record if Firebase requires it

### STEP 4: Verify
Run: ./verify_domain_fix.sh

