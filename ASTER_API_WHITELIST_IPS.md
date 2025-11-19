# Aster DEX API Whitelist IPs

## ⚠️ CURRENT IP ADDRESSES TO WHITELIST

### 🔴 CRITICAL - GKE Node External IPs (Required)
**These are the IPs Aster API will see when trading service makes API calls from GKE pods.**

1. **104.154.90.215** - `gke-hft-trading-cluster-default-pool-cca23a60-mvsi`
2. **34.9.133.10** - `gke-hft-trading-cluster-default-pool-cca23a60-zjff`
3. **35.188.43.171** - `gke-hft-trading-cluster-default-pool-cca23a60-8ye9`

**Status**: ✅ Verified - Test pod confirmed egress uses node external IPs
**Note**: All pods in the cluster use their node's external IP for outbound API calls

### 🟡 OPTIONAL - Static IPs (If using Load Balancer)
4. **34.144.213.188** - `cloud-trader-ip` (Global static IP)
   - Used for load balancer/ingress if configured
   - May not be necessary if trading service only uses node IPs

## ⚠️ DO NOT WHITELIST

### Internal Network IPs (Private, not visible to Aster API)
- ❌ Pod IPs: `10.0.x.x` (internal cluster network)
- ❌ Node internal IPs: `10.128.x.x` (private GKE network)
- ❌ Service IPs: `10.x.x.x` (all internal cluster networking)

**Why**: These are private network addresses that Aster API cannot see. Only external IPs are visible to external APIs.

## 📋 How to Whitelist

### For Aster DEX Dashboard:
1. Log into your Aster DEX account
2. Go to **API Settings** → **Security** → **IP Whitelist**
3. Add the **3 node external IPs** listed above:
   - `104.154.90.215`
   - `34.9.133.10`
   - `35.188.43.171`
4. Save changes

### Important Notes:
- **All 3 node IPs must be whitelisted** - pods can run on any node
- If nodes are added/removed, update whitelist accordingly
- Static IP `34.144.213.188` is optional (only if load balancer makes API calls)

## 🔍 Verification Commands

### Check Current Node IPs:
```bash
kubectl get nodes -o jsonpath='{range .items[*]}{.status.addresses[?(@.type=="ExternalIP")].address}{"\n"}{end}'
```

### Test Actual Egress IP:
```bash
kubectl run test-ip -n trading-system-live --image=curlimages/curl --rm -i --restart=Never -- curl -s https://api.ipify.org
```

### Check Static IPs:
```bash
gcloud compute addresses list --global --format="table(name,address,status)"
```

## ⚠️ IP Address Changes

### Node IPs May Change If:
- Nodes are deleted and recreated
- Cluster is resized
- Nodes are upgraded/replaced

### How to Detect Changes:
1. Monitor Aster API logs for 403/429 errors
2. Check if new nodes are added: `kubectl get nodes`
3. Compare current IPs with whitelisted IPs
4. Update whitelist immediately if changes detected

## 🚨 Emergency Update Process

If you lose API access:

1. **Check current node IPs**:
   ```bash
   kubectl get nodes -o jsonpath='{range .items[*]}{.status.addresses[?(@.type=="ExternalIP")].address}{"\n"}{end}'
   ```

2. **Update Aster DEX whitelist** with new IPs

3. **Test connectivity**:
   ```bash
   kubectl exec -n trading-system-live deployment/sapphire-trading-service -- curl -s https://fapi.asterdex.com/fapi/v1/ping
   ```

4. **Monitor logs**:
   ```bash
   kubectl logs -n trading-system-live deployment/sapphire-trading-service --tail=50 | grep -i "aster\|api\|403\|429"
   ```

## 📊 Current Configuration (as of 2025-11-18)

- **Cluster**: `hft-trading-cluster` (us-central1-a)
- **Node Pool**: `default-pool`
- **Nodes**: 3 nodes running trading service pods
- **Egress**: Pods use node external IPs (no Cloud NAT configured)
- **Status**: ✅ All 3 node IPs need to be whitelisted

## 🔒 Security Considerations

- ✅ Only whitelist the minimum required IPs (3 node IPs)
- ✅ Regularly audit API access logs in Aster DEX
- ✅ Monitor for unauthorized access attempts
- ✅ Consider API key rotation periodically
- ✅ If using Cloud NAT in future, whitelist NAT IP instead
