FROM node:22-slim

# Install system dependencies for voice + download
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libsodium-dev \
    tzdata \
    && pip3 install --break-system-packages yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Create data directory with open permissions (for volume mount)
RUN mkdir -p /app/data && \
    chmod 777 /app/data

# Copy package files
COPY package*.json ./

# Install npm dependencies (including native builds)
RUN npm install

# Copy source code
COPY . .

# Copy entrypoint script
COPY --chmod=755 entrypoint.sh /app/entrypoint.sh

# Start bot
ENTRYPOINT ["/app/entrypoint.sh"]
