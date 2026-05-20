#!/bin/bash
# Keep-alive wrapper for Next.js dev server
# Uses double-fork technique to detach from terminal and auto-restart on crash

LOGFILE="/home/z/my-project/dev.log"
PIDFILE="/home/z/my-project/.dev-server.pid"
WORKDIR="/home/z/my-project"
MAX_RESTARTS=10
RESTART_COUNT=0
RESTART_DELAY=3

cleanup() {
    if [ -f "$PIDFILE" ]; then
        OLD_PID=$(cat "$PIDFILE" 2>/dev/null)
        if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
            echo "[$(date)] Stopping old server (PID $OLD_PID)..." >> "$LOGFILE"
            kill -TERM "$OLD_PID" 2>/dev/null
            sleep 2
            kill -9 "$OLD_PID" 2>/dev/null
        fi
        rm -f "$PIDFILE"
    fi
}

# Kill any existing instances
cleanup

# Also kill any leftover bun/next processes on port 3000
fuser -k 3000/tcp 2>/dev/null || true
sleep 1

echo "[$(date)] === Keep-alive wrapper starting ===" >> "$LOGFILE"

while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
    echo "[$(date)] Starting dev server (attempt $((RESTART_COUNT+1))/$MAX_RESTARTS)..." >> "$LOGFILE"
    
    # Start the dev server
    cd "$WORKDIR"
    bun run dev >> "$LOGFILE" 2>&1 &
    SERVER_PID=$!
    echo "$SERVER_PID" > "$PIDFILE"
    
    # Double-fork: disown so it survives parent shell exit
    disown $SERVER_PID 2>/dev/null
    
    echo "[$(date)] Server started with PID $SERVER_PID" >> "$LOGFILE"
    
    # Wait and monitor
    SLEEP_INTERVAL=5
    STABLE_COUNT=0
    
    while true; do
        if ! kill -0 "$SERVER_PID" 2>/dev/null; then
            echo "[$(date)] Server process (PID $SERVER_PID) died!" >> "$LOGFILE"
            break
        fi
        
        # Check if server is actually responding
        if curl -sf http://localhost:3000 > /dev/null 2>&1; then
            STABLE_COUNT=$((STABLE_COUNT + 1))
            if [ $STABLE_COUNT -eq 1 ]; then
                echo "[$(date)] Server is responding ✓" >> "$LOGFILE"
            fi
        fi
        
        sleep $SLEEP_INTERVAL
    done
    
    RESTART_COUNT=$((RESTART_COUNT + 1))
    
    if [ $RESTART_COUNT -lt $MAX_RESTARTS ]; then
        echo "[$(date)] Restarting in ${RESTART_DELAY}s..." >> "$LOGFILE"
        sleep $RESTART_DELAY
        # Clean up port before restart
        fuser -k 3000/tcp 2>/dev/null || true
        sleep 1
    fi
done

echo "[$(date)] Max restarts ($MAX_RESTARTS) reached. Giving up." >> "$LOGFILE"
