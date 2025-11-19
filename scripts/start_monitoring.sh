#!/bin/bash
# Start monitoring in background

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTO_MONITOR="$SCRIPT_DIR/auto_monitor.sh"
PID_FILE="/tmp/sapphire_monitor.pid"

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "⚠️  Monitoring already running (PID: $OLD_PID)"
        echo "To stop: kill $OLD_PID"
        exit 1
    else
        rm -f "$PID_FILE"
    fi
fi

# Start monitoring in background
echo "🚀 Starting auto-monitoring in background..."
nohup "$AUTO_MONITOR" > /tmp/sapphire_monitor_output.log 2>&1 &
MONITOR_PID=$!

echo $MONITOR_PID > "$PID_FILE"
echo "✅ Monitoring started (PID: $MONITOR_PID)"
echo "📋 Logs: /tmp/sapphire_monitor.log"
echo "❌ Errors: /tmp/sapphire_monitor_errors.log"
echo "📊 Output: /tmp/sapphire_monitor_output.log"
echo ""
echo "To stop monitoring: ./scripts/stop_monitoring.sh"
echo "To view logs: tail -f /tmp/sapphire_monitor.log"

