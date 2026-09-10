#!/bin/bash
set -e

echo "========================================="
echo "🏏 Fantasy Cricket Docker Deployment"
echo "========================================="

# 1. Pull latest code
echo "📥 Pulling latest code from git..."
git pull origin main

# 2. Build frontend production bundle for container
echo "⚙️ Building UI production bundle..."
(cd UI && npm run build)

# 3. Rebuild and launch containers in background
echo "🐳 Starting Docker containers..."
docker compose up -d --build --force-recreate

# 4. Clean up dangling images and build cache to keep EC2 disk healthy
echo "🧹 Pruning unused images and builder cache..."
docker image prune -f
docker builder prune -a -f

# 5. Display status
echo "✅ Deployment successful! Active containers:"
docker compose ps

