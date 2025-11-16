#!/bin/bash
# Auto-monitoring script - runs continuously and fixes issues automatically

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_SCRIPT="$SCRIPT_DIR/monitor_and_deploy.sh"
LOG_FILE="/tmp/sapphire_monitor.log"
ERROR_LOG="/tmp/sapphire_monitor_errors.log"

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$ERROR_LOG"
}

# Trap to ensure cleanup
trap 'log "Monitoring stopped"; exit 0' SIGINT SIGTERM

log "Starting auto-monitoring service..."
log "Main script: $MAIN_SCRIPT"
log "Log file: $LOG_FILE"
log "Error log: $ERROR_LOG"

# Initial deployment check and fix
log "Running initial checks and fixes..."
"$MAIN_SCRIPT" all >> "$LOG_FILE" 2>> "$ERROR_LOG" || {
    error_log "Initial check failed"
}

# Main monitoring loop - runs every 10 minutes
while true; do
    log "=== Monitoring cycle ==="
    
    # Check deployment health
    "$MAIN_SCRIPT" monitor >> "$LOG_FILE" 2>> "$ERROR_LOG" || {
        error_log "Health check failed, attempting fixes..."
        "$MAIN_SCRIPT" secrets >> "$LOG_FILE" 2>> "$ERROR_LOG"
    }
    
    # Check for errors and auto-fix
    ERROR_COUNT=$(kubectl get pods -n trading-system-live -l app=sapphire-trading-service -o json 2>/dev/null | \
        jq -r '.items[] | select(.status.phase != "Running") | .metadata.name' 2>/dev/null | wc -l || echo "0")
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        error_log "Found $ERROR_COUNT pods in error state. Restarting..."
        "$MAIN_SCRIPT" secrets >> "$LOG_FILE" 2>> "$ERROR_LOG"
    fi
    
    log "Next check in 10 minutes..."
    sleep 600  # 10 minutes
done

