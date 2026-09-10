# Lightweight Production Dockerfile for Fantasy Cricket UI (TanStack Start SSR)
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_PORT=3000

# Copy built server output and manifests
COPY .output ./.output
COPY package*.json ./

# Non-root user for security
USER node

EXPOSE 3000

# Native Node 20 healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start the TanStack Start SSR server
CMD ["node", ".output/server/index.mjs"]
