#!/bin/bash
# Stop monitoring

PID_FILE="/tmp/sapphire_monitor.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "⚠️  No monitoring process found"
    exit 1
fi

PID=$(cat "$PID_FILE")

if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "⚠️  Monitoring process not running (PID: $PID)"
    rm -f "$PID_FILE"
    exit 1
fi

echo "🛑 Stopping monitoring (PID: $PID)..."
kill "$PID"

# Wait for process to stop
for i in {1..10}; do
    if ! ps -p "$PID" > /dev/null 2>&1; then
        break
    fi
    sleep 1
done

if ps -p "$PID" > /dev/null 2>&1; then
    echo "⚠️  Force killing..."
    kill -9 "$PID"
fi

rm -f "$PID_FILE"
echo "✅ Monitoring stopped"

