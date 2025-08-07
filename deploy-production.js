#!/usr/bin/env node

/**
 * Production Deployment Script
 * Ensures production environment matches development exactly
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting production deployment...');

// Step 1: Clean previous build
console.log('📁 Cleaning previous build...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}

// Step 2: Build frontend and backend
console.log('🔨 Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Verify build files exist
const requiredFiles = [
  'dist/public/index.html',
  'dist/public/assets',
  'dist/index.js'
];

console.log('🔍 Verifying build files...');
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required file: ${file}`);
    process.exit(1);
  }
}

console.log('✅ All required files present');

// Step 4: Start production server
console.log('🌐 Starting production server...');
console.log('Environment: PRODUCTION');
console.log('Port: 5000');
console.log('Static files: dist/public/');
console.log('WebSocket: /ws');
console.log('');

try {
  execSync('NODE_ENV=production node dist/index.js', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
} catch (error) {
  console.error('❌ Production server failed:', error.message);
  process.exit(1);
}