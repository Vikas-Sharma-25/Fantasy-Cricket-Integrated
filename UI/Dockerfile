# ==========================================
# 1. Builder Stage
# ==========================================
FROM node:20-slim AS builder

WORKDIR /app

ENV NITRO_PRESET=node-server

# Copy dependency manifests and configs
COPY package*.json tsconfig.json vite.config.ts components.json ./

# Install dependencies for build
RUN npm ci

# Copy application source code and assets
COPY src ./src
COPY public ./public

# Build TanStack Start / Vite SSR application with explicit node-server preset
RUN NITRO_PRESET=node-server npm run build

# ==========================================
# 2. Production Runner Stage
# ==========================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_PORT=3000

# Copy built server output and manifests
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./

# Non-root user for security
USER node

EXPOSE 3000

# Native Node 20 healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start the TanStack Start SSR server
CMD ["node", ".output/server/index.mjs"]
