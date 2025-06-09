#!/bin/bash

# Exit on any error
set -e

# Install dependencies including dev dependencies for build tools
npm ci --include=dev

# Build the frontend
npx vite build

# Build the backend
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Copy built files to the correct location for the server
node post-build.js

echo "Build completed successfully"