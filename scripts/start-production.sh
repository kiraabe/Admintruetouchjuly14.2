#!/bin/bash

# True Touch - Production Startup Script
# This script builds and starts the application in production mode

set -e

echo "🚀 Starting True Touch in production mode..."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found!"
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "Please update .env with your configuration and run this script again."
  exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies..."
  npm ci
fi

# Build frontend and backend
echo "🔨 Building application..."
npm run build:production

# Check if dist directory exists
if [ ! -d dist ]; then
  echo "❌ Build failed! dist directory not found."
  exit 1
fi

echo "✅ Build completed successfully"
echo "🌐 Starting server on port ${PORT:-3000}..."

# Start the application
npm run start:production
