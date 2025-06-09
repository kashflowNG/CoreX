#!/bin/bash
set -e

echo "Starting Render build process..."

# Install dependencies
echo "Installing dependencies..."
npm ci --include=dev --silent

# Check if required tools are available
echo "Checking build tools..."
if ! npx vite --version > /dev/null 2>&1; then
    echo "Error: Vite not found"
    exit 1
fi

if ! npx esbuild --version > /dev/null 2>&1; then
    echo "Error: ESBuild not found"
    exit 1
fi

# Build frontend
echo "Building frontend..."
npx vite build --mode production

# Build backend
echo "Building backend..."
npx esbuild server/index.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outdir=dist \
    --minify

# Copy files to correct location
echo "Copying static files..."
node post-build.js

echo "Build completed successfully!"