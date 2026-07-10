FROM node:18-bullseye-slim

# Create app directory
WORKDIR /usr/src/app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci --no-cache

# Copy source
COPY . .

# Build frontend and bundle server
RUN npm run build

# Use production env
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the bundled server
CMD ["node", "dist/server.cjs"]
