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

# Create persistent sounds directory
mkdir -p /app/data/sounds 2>/dev/null || true
chmod 777 /app/data/sounds 2>/dev/null || true

# One-time migration: copy uploaded sounds from old location (src/assets/) to new location (data/sounds/)
# This handles files that were uploaded before the fix
ASSETS_DIR="/app/src/assets"
SOUNDS_DIR="/app/data/sounds"
if [ -d "$ASSETS_DIR" ]; then
    for f in "$ASSETS_DIR"/*.mp3 "$ASSETS_DIR"/*.wav "$ASSETS_DIR"/*.ogg; do
        [ -f "$f" ] || continue
        basename=$(basename "$f")
        # Skip built-in sounds (they stay in src/assets)
        case "$basename" in
            bell1.mp3|my-lord.mp3|okaeri.mp3|tutturu.mp3) continue ;;
        esac
        # Only copy if not already in sounds dir
        if [ ! -f "$SOUNDS_DIR/$basename" ]; then
            echo "[Entrypoint] Migrating sound: $basename -> $SOUNDS_DIR/"
            cp "$f" "$SOUNDS_DIR/$basename"
        fi
    done
fi

# Log current permissions for debugging
echo "[Entrypoint] Data directory info:"
ls -la /app/data 2>/dev/null || echo "[Entrypoint] Warning: Cannot list /app/data"
echo "[Entrypoint] Sounds directory info:"
ls -la /app/data/sounds 2>/dev/null || echo "[Entrypoint] Warning: Cannot list /app/data/sounds"

# Start the application
echo "[Entrypoint] Starting Discord bot"
exec npm start
