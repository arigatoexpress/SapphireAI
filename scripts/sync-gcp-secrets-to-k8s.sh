#!/bin/bash
# Sync GCP Secret Manager secrets to Kubernetes Secret

set -e

PROJECT_ID="sapphireinfinite"
SECRET_NAME="cloud-trader-secrets"
NAMESPACE="trading"

echo "🔄 Syncing GCP secrets to Kubernetes Secret..."
echo "=============================================="
echo ""

# Ensure namespace exists
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f - >/dev/null 2>&1 || true

# List of secrets to sync (using regular array for compatibility)
SECRET_LIST=(
  "ASTER_API_KEY:ASTER_API_KEY"
  "ASTER_SECRET_KEY:ASTER_SECRET_KEY"
  "TELEGRAM_BOT_TOKEN:TELEGRAM_BOT_TOKEN"
  "TELEGRAM_CHAT_ID:TELEGRAM_CHAT_ID"
  "GROK4_API_KEY:GROK4_API_KEY"
  "GEMINI_API_KEY:GEMINI_API_KEY"
)

# Build kubectl create secret command
SECRET_ARGS=()

for SECRET_PAIR in "${SECRET_LIST[@]}"; do
  GCP_SECRET_NAME="${SECRET_PAIR%%:*}"
  K8S_KEY="${SECRET_PAIR##*:}"

  echo "📥 Fetching $GCP_SECRET_NAME from GCP Secret Manager..."
  SECRET_VALUE=$(gcloud secrets versions access latest --secret="$GCP_SECRET_NAME" --project=$PROJECT_ID 2>/dev/null || echo "")

  if [ -n "$SECRET_VALUE" ]; then
    SECRET_ARGS+=("--from-literal=$K8S_KEY=$(echo -n "$SECRET_VALUE")")
    echo "  ✅ Retrieved $GCP_SECRET_NAME"
  else
    echo "  ⚠️  Warning: Could not retrieve $GCP_SECRET_NAME from GCP Secret Manager"
  fi
done

if [ ${#SECRET_ARGS[@]} -eq 0 ]; then
  echo "❌ No secrets retrieved. Check GCP Secret Manager permissions."
  exit 1
fi

echo ""
echo "🔐 Creating/updating Kubernetes Secret: $SECRET_NAME"
kubectl create secret generic $SECRET_NAME \
  "${SECRET_ARGS[@]}" \
  --namespace=$NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "✅ Secret $SECRET_NAME synced successfully!"
echo ""
echo "📋 Verifying secret..."
kubectl get secret $SECRET_NAME -n $NAMESPACE -o jsonpath='{.data}' | jq 'keys' 2>/dev/null || kubectl get secret $SECRET_NAME -n $NAMESPACE
