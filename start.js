#!/usr/bin/env node

// Simple production starter script
const { spawn } = require('child_process');
const path = require('path');

const distPath = path.join(__dirname, 'dist', 'index.js');

console.log('Starting CoreX Bitcoin Investment Platform...');
console.log('Environment:', process.env.NODE_ENV || 'production');

const server = spawn('node', [distPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production'
  }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});