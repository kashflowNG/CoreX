#!/bin/bash

# Exit on any error
set -e

# Install dependencies including dev dependencies for build tools
npm ci --include=dev

# Build the application
npm run build

# Copy built files to the correct location for the server
node post-build.js

echo "Build completed successfully"