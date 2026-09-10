# ==========================================
# 1. Builder Stage
# ==========================================
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies for compiling TypeScript)
RUN npm ci

# Copy source files
COPY src ./src

# Build TypeScript to JavaScript
RUN npm run build

# ==========================================
# 2. Production Runner Stage
# ==========================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Non-root user for security
USER node

EXPOSE 5000

# Native Node 20 healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/v1/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start the Express server
CMD ["node", "dist/server.js"]

