#!/bin/bash
set -e

echo "========================================="
echo "🏏 Fantasy Cricket Docker Deployment"
echo "========================================="

# 1. Pull latest code
echo "📥 Pulling latest code from git..."
git pull origin main

# 2. Rebuild and launch containers in background
echo "🐳 Building and starting containers..."
docker compose up -d --build

# 3. Clean up dangling images to keep EC2 disk healthy
echo "🧹 Pruning unused images..."
docker image prune -f

# 4. Display status
echo "✅ Deployment successful! Active containers:"
docker compose ps
