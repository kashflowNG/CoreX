#!/bin/bash

# Exit on any error
set -e

# Install dependencies including dev dependencies for build tools
npm ci --include=dev

# Build the application
npm run build

echo "Build completed successfully"