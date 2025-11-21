# Firebase DNS Verification Instructions

## Current Issue

Firebase is unable to verify `sapphiretrade.xyz` domain ownership.

**Required TXT Record**:
- Domain: `sapphiretrade.xyz`
- Type: TXT
- Value: `hosting-site=sapphire-trading`

**Old TXT Record to Remove**:
- Domain: `sapphiretrade.xyz`
- Type: TXT
- Value: `hosting-site=sapphiretrade`

## Steps to Fix

### 1. Access Your DNS Provider

Go to Google Domains (or your DNS provider) and log in.

### 2. Navigate to DNS Settings

- Select domain: `sapphiretrade.xyz`
- Go to "DNS" or "Manage DNS" section
- Find "Custom resource records" or "TXT Records"

### 3. Remove Old TXT Record

Find and **DELETE** the TXT record with value:
```
hosting-site=sapphiretrade
```

### 4. Add New TXT Record

**Add new TXT record**:
```
Type: TXT
Name: @ (or leave blank for root domain)
Value: hosting-site=sapphire-trading
TTL: 3600 (1 hour) or Auto
```

### 5. Wait for Propagation

DNS changes take 5-60 minutes to propagate. You can check status with:

```bash
# Check TXT records
dig TXT sapphiretrade.xyz +short

# Should show:
# "hosting-site=sapphire-trading"
```

### 6. Verify in Firebase Console

After DNS propagates:
1. Go to Firebase Console → Hosting
2. Click on `sapphiretrade.xyz` domain
3. Click "Verify" or refresh the page
4. Status should change to "Connected" ✅

## Current DNS Records (Reference)

From your domain, you should have:

```
A records:
  sapphiretrade.xyz → [Firebase hosting IPs]

TXT records:
  sapphiretrade.xyz → "hosting-site=sapphire-trading" ← NEW (ADD THIS)

CNAME records:
  www.sapphiretrade.xyz → sapphiretrade.xyz
```

## Verification Command

After making changes, verify propagation:

```bash
# Method 1: Using dig
dig TXT sapphiretrade.xyz +short

# Method 2: Using nslookup
nslookup -type=TXT sapphiretrade.xyz

# Method 3: Online tool
# Visit: https://dnschecker.org
# Enter: sapphiretrade.xyz
# Type: TXT
```

## Timeline

- **DNS Update**: 2 minutes
- **Propagation**: 5-60 minutes
- **Firebase Verification**: Immediate after propagation

## What This Enables

Once verified:
- ✅ Frontend deploys to https://sapphiretrade.xyz
- ✅ SSL certificate auto-provisioned
- ✅ CDN caching enabled
- ✅ Custom domain fully functional

---

**Action Required**: Update DNS records manually in your DNS provider
**Expected Resolution**: 5-60 minutes
**Priority**: Medium (doesn't block backend deployment)
