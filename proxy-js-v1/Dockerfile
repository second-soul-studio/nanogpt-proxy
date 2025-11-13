# Use lightweight Node image
FROM node:20-bullseye AS base

# Create app directory
WORKDIR /app

# Install system certs
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies first (better caching)
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy the rest of the app
COPY . .

# Expose the port the proxy runs on
EXPOSE 3000

# Use non-root user for security
# USER node

# Start the proxy
CMD ["npm", "start"]
