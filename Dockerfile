FROM node:22-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && pip3 install --break-system-packages yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Start bot
CMD ["npm", "start"]
