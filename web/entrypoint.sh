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

# Log current permissions for debugging
ls -la /app/data 2>/dev/null || echo "[Entrypoint] Warning: Cannot list /app/data"

# Start the application
echo "[Entrypoint] Starting Next.js server"
exec node server.js
