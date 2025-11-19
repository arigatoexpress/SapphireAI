#!/bin/bash
# Setup security hooks to prevent credential commits

set -e

echo "🔒 Setting up security hooks to prevent credential commits..."

# Check if git-secrets is installed
if ! command -v git-secrets &> /dev/null; then
    echo "⚠️  git-secrets not found. Installing..."
    echo "   Install from: https://github.com/awslabs/git-secrets"
    echo ""
    echo "   macOS: brew install git-secrets"
    echo "   Or follow: https://github.com/awslabs/git-secrets#installing"
    echo ""
    read -p "Press Enter to continue without git-secrets or Ctrl+C to cancel..."
else
    echo "✅ git-secrets found, configuring..."
    
    # Install git-secrets hooks
    git secrets --install || true
    git secrets --register-aws || true
    
    # Add custom patterns from .git-secrets-patterns
    if [ -f ".git-secrets-patterns" ]; then
        echo "   Adding custom patterns..."
        while IFS= read -r pattern; do
            if [ -n "$pattern" ] && [[ ! "$pattern" =~ ^# ]]; then
                git secrets --add "$pattern" || true
            fi
        done < .git-secrets-patterns
    fi
    
    echo "✅ git-secrets configured"
fi

# Setup pre-commit hooks
if command -v pre-commit &> /dev/null; then
    echo "✅ pre-commit found, installing hooks..."
    pre-commit install
    pre-commit install --hook-type commit-msg || true
    echo "✅ pre-commit hooks installed"
else
    echo "⚠️  pre-commit not found. Install with: pip install pre-commit"
    echo "   Then run: pre-commit install"
fi

# Create secrets baseline if detect-secrets is used
if command -v detect-secrets &> /dev/null && [ ! -f ".secrets.baseline" ]; then
    echo "✅ detect-secrets found, creating baseline..."
    detect-secrets scan > .secrets.baseline || true
    echo "✅ .secrets.baseline created"
fi

echo ""
echo "✅ Security hooks setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Test hooks: git commit --allow-empty -m 'test hooks'"
echo "   2. Review .secrets.baseline if using detect-secrets"
echo "   3. Ensure .secrets.baseline is committed to git"
echo ""

