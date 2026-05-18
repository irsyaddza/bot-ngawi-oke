#!/bin/bash
set -e

# Ensure /app/data exists and has correct permissions
if [ ! -d /app/data ]; then
    echo "[Entrypoint] Creating /app/data directory"
    mkdir -p /app/data
fi

# Ensure we can write to /app/data (for volume mounts from host)
echo "[Entrypoint] Ensuring /app/data is writable"
chmod 777 /app/data 2>/dev/null || true

# Also create bot-specific directories if needed
mkdir -p /app/bot/src/assets 2>/dev/null || true
chmod 777 /app/bot/src/assets 2>/dev/null || true

# Log current permissions for debugging
echo "[Entrypoint] Data directory info:"
ls -la /app/data 2>/dev/null || echo "[Entrypoint] Warning: Cannot list /app/data"

# Start the application
echo "[Entrypoint] Starting Discord bot"
exec npm start
