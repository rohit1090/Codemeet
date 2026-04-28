FROM node:18-alpine

# Set production mode — disables dev-only packages and enables optimisations
ENV NODE_ENV=production

WORKDIR /app

# Install deps first (layer-cached unless package.json changes)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY . .

EXPOSE 4000

# Use exec form so signals (SIGTERM from Railway/Docker) reach the Node process
CMD ["node", "server.js"]
