#!/bin/bash
# Cleanup script for old Docker images and build artifacts
# Keeps only the last 10 builds + latest tag

set -e

PROJECT_ID="${PROJECT_ID:-sapphireinfinite}"
REPO="us-central1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/cloud-trader"
KEEP_COUNT=10

echo "🧹 Cleaning up old Docker images from ${REPO}"

# Get all tags sorted by creation time (newest first), exclude 'latest'
TAGS=$(gcloud artifacts docker tags list ${REPO} \
  --format="value(tag)" \
  --filter="tag!=latest" \
  --sort-by="~CREATE_TIME" \
  --limit=100 2>/dev/null || echo "")

if [ -z "$TAGS" ]; then
  echo "No tags to clean up"
  exit 0
fi

# Convert to array
TAG_ARRAY=($TAGS)
TOTAL_TAGS=${#TAG_ARRAY[@]}

if [ $TOTAL_TAGS -le $KEEP_COUNT ]; then
  echo "Only $TOTAL_TAGS tags found, keeping all"
  exit 0
fi

# Delete old tags (skip first $KEEP_COUNT)
# Use double quotes to prevent shell interpretation issues
DELETED=0
for i in $(seq $KEEP_COUNT $((TOTAL_TAGS - 1))); do
  OLD_TAG="${TAG_ARRAY[$i]}"
  # Validate OLD_TAG is not empty before using
  if [ -n "$OLD_TAG" ]; then
    echo "Deleting old tag: $OLD_TAG"
    gcloud artifacts docker tags delete "${REPO}:${OLD_TAG}" --quiet 2>/dev/null || true
    DELETED=$((DELETED + 1))
  fi
done

echo "✅ Cleaned up $DELETED old image tags (kept latest $KEEP_COUNT + latest tag)"

# Cleanup Firebase hosting versions (keep last 5)
if command -v firebase &> /dev/null; then
  echo "🧹 Cleaning up old Firebase hosting versions..."
  firebase hosting:channel:list --json 2>/dev/null | jq -r '.result.channels[] | select(.name != "live" and .name != "default") | .name' | tail -n +6 | \
    xargs -I {} firebase hosting:channel:delete {} --force 2>/dev/null || true
  echo "✅ Firebase hosting cleanup completed"
fi

# Cleanup old Kubernetes resources (optional)
if command -v kubectl &> /dev/null; then
  echo "🧹 Cleaning up old Kubernetes resources..."
  
  # Clean up old ConfigMaps (older than 7 days)
  kubectl get configmaps -n trading-system-live -o json | \
    jq -r '.items[] | select(.metadata.creationTimestamp < "'$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ)'") | .metadata.name' | \
    xargs -I {} kubectl delete configmap {} -n trading-system-live --ignore-not-found=true 2>/dev/null || true
  
  # Clean up old Secrets (older than 30 days, but keep system secrets)
  kubectl get secrets -n trading-system-live -o json | \
    jq -r '.items[] | select(.metadata.creationTimestamp < "'$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ)'") | select(.type != "kubernetes.io/service-account-token") | .metadata.name' | \
    grep -v "default-token" | \
    xargs -I {} kubectl delete secret {} -n trading-system-live --ignore-not-found=true 2>/dev/null || true
  
  echo "✅ Kubernetes cleanup completed"
fi

echo "✅ All cleanup tasks completed"

