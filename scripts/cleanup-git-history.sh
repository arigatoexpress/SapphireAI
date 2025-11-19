#!/bin/bash
# Script to help remove sensitive information from git history
# WARNING: This rewrites git history. Use with caution!

set -e

echo "⚠️  WARNING: This script will rewrite git history!"
echo "   All collaborators must re-clone the repository after this."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cancelled."
    exit 1
fi

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo "⚠️  git-filter-repo not found."
    echo "   Install with: pip install git-filter-repo"
    echo "   Or use BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/"
    exit 1
fi

echo "✅ git-filter-repo found"
echo ""
echo "🔍 Removing sensitive files from git history..."

# Remove .envrc from history
if git log --all --full-history --source -- ".envrc" | grep -q .; then
    echo "   Removing .envrc from history..."
    git filter-repo --path .envrc --invert-paths --force
    echo "   ✅ .envrc removed from history"
fi

# Remove any files matching patterns
PATTERNS=(
    "*.env"
    "*.env.local"
    "*.env.production"
    "*.secrets.json"
    "credentials.json"
    "*.pem"
    "*.key"
    "*.p12"
    "*.pfx"
)

for pattern in "${PATTERNS[@]}"; do
    if git log --all --full-history --source -- "$pattern" | grep -q .; then
        echo "   Removing $pattern from history..."
        git filter-repo --path-glob "$pattern" --invert-paths --force || true
    fi
done

# Remove sensitive content from specific files
if [ -f "k8s-secrets.yaml" ]; then
    echo "   Cleaning k8s-secrets.yaml from history..."
    # Remove lines containing base64 encoded values (32+ chars)
    git filter-repo --path k8s-secrets.yaml \
        --use-base-name \
        --replace-text <(echo 'regex:==.*[A-Za-z0-9+/]{32,}==>==PLACEHOLDER==') \
        --force || true
fi

echo ""
echo "✅ Git history cleaned!"
echo ""
echo "📋 IMPORTANT NEXT STEPS:"
echo "   1. Force push to all branches: git push --force --all"
echo "   2. Force push tags: git push --force --tags"
echo "   3. Notify all collaborators to re-clone the repository"
echo "   4. Rotate all exposed credentials:"
echo "      - Redis IP: 10.161.118.219:6379"
echo "      - Service URLs exposed in .envrc"
echo "      - Any API keys that were in git history"
echo ""

