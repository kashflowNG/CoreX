#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting production build...');

try {
  // Build frontend
  console.log('Building frontend with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Build backend
  console.log('Building backend with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

  // Copy frontend files to server directory
  const sourcePath = './dist/public';
  const destPath = './server/public';

  if (fs.existsSync(sourcePath)) {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    console.log('Copying frontend files...');
    execSync(`cp -r ${sourcePath}/* ${destPath}/`, { stdio: 'inherit' });
  }

  console.log('Production build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}