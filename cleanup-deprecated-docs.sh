#!/bin/bash
# Script to identify and archive deprecated documentation files

echo "🔍 Identifying deprecated documentation files..."

# Create archive directory for deprecated docs
ARCHIVE_DIR="docs/archive/deprecated-$(date +%Y%m%d)"
mkdir -p "$ARCHIVE_DIR"

# List of deprecated file patterns (deployment/migration status files that are no longer relevant)
DEPRECATED_PATTERNS=(
  "*DEPLOYMENT_STATUS*.md"
  "*DEPLOYMENT_*STATUS*.md"
  "*LIVE_*STATUS*.md"
  "*LIVE_DEPLOYMENT*.md"
  "*DEPLOYMENT_COMPLETE*.md"
  "*DEPLOYMENT_READY*.md"
  "*MIGRATION_*.md"
  "*FIREBASE_*.md"
  "*DOMAIN_*.md"
  "*DNS_*.md"
  "*FRONTEND_*.md"
  "*NEW_PROJECT*.md"
  "*DEPLOY_*.md"
  "*SETUP_*.md"
  "*STEP_*.md"
  "*OPTION_*.md"
  "*ADD_*.md"
  "*CONSOLE_*.md"
  "*FIX_*.md"
  "*CHECK_*.md"
  "*VERIFY_*.md"
  "*FINAL_STATUS*.md"
  "*FINAL_DEPLOYMENT*.md"
  "*FINAL_MIGRATION*.md"
  "*COMPLETE_MIGRATION*.md"
  "*PRE_LIVE*.md"
  "*GEMINI_PROMPT*.md"
  "*RUN_GEMINI*.md"
  "*NEXT_STEPS*.md"
  "*ERROR_CHECK*.md"
  "*TROUBLESHOOTING_SUMMARY*.md"
  "*DEPLOYMENT_TROUBLESHOOTING*.md"
  "*PROMPT_ENGINEERING*.md"
  "*DEPLOYMENT_ISSUES*.md"
  "*DEPLOYMENT_AND_DNS*.md"
  "*INFRASTRUCTURE_SOLUTION*.md"
  "*FINAL_COMPREHENSIVE*.md"
  "*FINAL_OPTIMIZATION*.md"
  "*GRANULAR_OPTIMIZATION*.md"
  "*MAJOR_UPGRADES*.md"
  "*OPTIMIZATION_SUMMARY*.md"
  "*IMPLEMENTATION_ROADMAP*.md"
  "*IMPLEMENTATION_SUMMARY*.md"
  "*PRESENTATION_SUMMARY*.md"
  "*COMPETITION_NARRATIVE*.md"
  "*NEW_MICROSERVICE*.md"
  "*ARCHITECTURE_DOCUMENTATION*.md"
  "*DEPLOYMENT_READINESS*.md"
  "*COST_BUDGET*.md"
)

# Files to keep (important current documentation)
KEEP_FILES=(
  "README.md"
  "ARCHITECTURE.md"
  "SECURITY.md"
  "CONTRIBUTING.md"
  "MONITORING_GUIDE.md"
  "OPERATIONAL_RUNBOOK.md"
  "ASTER_API_WHITELIST_IPS.md"
  "ASTER_CREDENTIALS_README.md"
  "backup-recovery-plan.md"
  "docs/README.md"
  "docs/guides/*.md"
  "docs/security_review.md"
  "docs/MULTI_AGENT_FEATURES.md"
  "trading-dashboard/README.md"
  "helm/sapphire-trading-system/README.md"
)

echo "📦 Archiving deprecated files..."

count=0
for pattern in "${DEPRECATED_PATTERNS[@]}"; do
  for file in $pattern; do
    if [ -f "$file" ]; then
      # Check if file should be kept
      keep=false
      for keep_file in "${KEEP_FILES[@]}"; do
        if [[ "$file" == $keep_file ]]; then
          keep=true
          break
        fi
      done
      
      if [ "$keep" = false ]; then
        echo "  → Moving $file to archive..."
        mv "$file" "$ARCHIVE_DIR/"
        ((count++))
      fi
    fi
  done
done

if [ $count -gt 0 ]; then
  echo "✅ Archived $count deprecated documentation files to $ARCHIVE_DIR"
  echo "📝 Creating archive manifest..."
  echo "# Deprecated Documentation Archive" > "$ARCHIVE_DIR/README.md"
  echo "Archived on: $(date)" >> "$ARCHIVE_DIR/README.md"
  echo "" >> "$ARCHIVE_DIR/README.md"
  echo "These files were archived as they contain outdated deployment/migration status information." >> "$ARCHIVE_DIR/README.md"
  echo "Current documentation can be found in the main README.md and docs/ directory." >> "$ARCHIVE_DIR/README.md"
else
  echo "ℹ️  No deprecated files found matching patterns"
  rmdir "$ARCHIVE_DIR"
fi

echo ""
echo "✨ Cleanup complete!"

