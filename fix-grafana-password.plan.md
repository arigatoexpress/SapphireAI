# Fix Grafana Hardcoded Password Plan

## 1. Secure Values Configuration
- **values-cleanup**: Update `helm/trading-system/values.yaml` to remove the plaintext `adminPassword`.
  - Change `adminPassword: "sapphire-trading-2024"` to `adminPassword: ""` or remove the field.
  - Add a comment indicating the password must be provided via the `cloud-trader-secrets` Kubernetes Secret.

## 2. Secret Management Update
- **secret-template**: Update `helm/trading-system/templates/secret-gcp-sync.yaml`.
  - Add a new key `GRAFANA_ADMIN_PASSWORD` to the `data` section, initialized to an empty string `""`.
  - This ensures the secret key exists and can be populated by the GCP secret sync script or manual `kubectl` commands without being committed to version control.

## 3. Verification
- **dry-run**: Run a `helm template` command to verify that the rendered values no longer contain the hardcoded password.
- **secret-check**: Verify that the generated Secret manifest includes the new `GRAFANA_ADMIN_PASSWORD` key.
