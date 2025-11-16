# DNS Troubleshooting for sapphiretrade.xyz

**Status:** ⚠️ Domain not properly connected to hosting

## Current DNS Status

### DNS Records
- **sapphiretrade.xyz** → `136.110.138.66` (A record)
- **www.sapphiretrade.xyz** → `sapphiretrade.xyz` (CNAME) → `136.110.138.66`
- **api.sapphiretrade.xyz** → `34.49.212.244` (A record) ✅ Working

### Current Situation

1. **Main Domain (sapphiretrade.xyz):**
   - Points to IP: `136.110.138.66` (not a GCP IP)
   - Currently serving a static HTML file (old deployment)
   - **Not connected to Firebase Hosting or GCP Load Balancer**

2. **API Subdomain (api.sapphiretrade.xyz):**
   - Points to IP: `34.49.212.244` (GCP Load Balancer)
   - ⚠️ Connection issues (connection reset)

3. **Firebase Hosting:**
   - Site exists: `sapphire-trading` 
   - Default URL: `https://sapphire-trading.web.app` ✅ Working
   - **Custom domain NOT configured**

4. **GCP Load Balancer:**
   - No URL maps found
   - No forwarding rules configured
   - Backend services exist but not connected

## Issues Identified

### 1. Domain Not Connected to Firebase
The domain `sapphiretrade.xyz` is not connected to Firebase Hosting. The site is accessible at:
- `https://sapphire-trading.web.app` (Firebase default URL)

But NOT at:
- `https://sapphiretrade.xyz` (custom domain)

### 2. DNS Points to Wrong IP
The DNS A record points to `136.110.138.66`, which appears to be:
- A different hosting provider
- Serving an old static version
- Not the Firebase/GCP hosted version

### 3. No GCP Load Balancer for Main Domain
- No URL maps configured
- No forwarding rules for `sapphiretrade.xyz`
- Backend services exist but not properly routed

## Solutions

### Option 1: Connect Domain to Firebase Hosting (Recommended)

1. **Add Custom Domain to Firebase:**
```bash
firebase hosting:channel:deploy production \
  --only hosting:sapphire-trading \
  --project sapphireinfinite
```

2. **Update DNS Records:**
   - Go to your DNS provider
   - Update A record for `sapphiretrade.xyz` to Firebase Hosting IPs
   - Or add CNAME record pointing to Firebase hosting

3. **Verify Domain in Firebase:**
```bash
firebase hosting:site:get sapphire-trading \
  --project sapphireinfinite
```

### Option 2: Set Up GCP Load Balancer

1. **Create URL Map:**
```bash
gcloud compute url-maps create sapphire-url-map \
  --default-service=projects/sapphireinfinite/global/backendBuckets/sapphire-frontend-backend-bucket \
  --project=sapphireinfinite
```

2. **Create HTTPS Proxy:**
```bash
gcloud compute target-https-proxies create sapphire-https-proxy \
  --url-map=sapphire-url-map \
  --ssl-certificates=sapphire-cert \
  --project=sapphireinfinite
```

3. **Create Forwarding Rule:**
```bash
gcloud compute forwarding-rules create sapphire-https-forwarding-rule \
  --global \
  --target-https-proxy=sapphire-https-proxy \
  --ports=443 \
  --address=sapphire-ip \
  --project=sapphireinfinite
```

4. **Update DNS:**
   - Point `sapphiretrade.xyz` A record to the static IP from forwarding rule

### Option 3: Use Firebase Hosting with Custom Domain (Easiest)

1. **In Firebase Console:**
   - Go to Hosting → Custom domains
   - Add `sapphiretrade.xyz`
   - Follow verification steps
   - Update DNS as instructed by Firebase

2. **Deploy Frontend:**
```bash
cd trading-dashboard
npm run build
firebase deploy --only hosting:sapphire-trading \
  --project sapphireinfinite
```

## Recommended Next Steps

1. **Immediate:** Verify Firebase hosting is working at default URL
2. **Short-term:** Connect custom domain to Firebase Hosting
3. **Long-term:** Set up GCP Load Balancer for unified routing

## Current Working URLs

- ✅ Frontend (Firebase): `https://sapphire-trading.web.app`
- ✅ Frontend (Old): `https://sapphiretrade.xyz` (static old version)
- ⚠️ API: `https://api.sapphiretrade.xyz` (connection issues)

## Verification Commands

```bash
# Check DNS
dig sapphiretrade.xyz +short

# Check Firebase sites
firebase hosting:sites:list --project=sapphireinfinite

# Check GCP load balancer
gcloud compute url-maps list --project=sapphireinfinite
gcloud compute forwarding-rules list --global --project=sapphireinfinite

# Test website
curl -I https://sapphiretrade.xyz
curl -I https://sapphire-trading.web.app
```

