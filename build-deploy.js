#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting deployment build...');

try {
  // Step 1: Clean the dist directory
  console.log('🧹 Cleaning dist directory...');
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
  }
  fs.mkdirSync(distPath, { recursive: true });

  // Step 2: Build the client with Vite
  console.log('📦 Building frontend with Vite...');
  execSync('vite build', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  // Step 3: Wait a moment for filesystem to sync
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 4: Build the server
  console.log('🔧 Building server...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  // Step 5: Copy any additional static assets
  console.log('📁 Copying static assets...');
  const copyAssets = (src, dest) => {
    if (fs.existsSync(src)) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const files = fs.readdirSync(src);
      files.forEach(file => {
        const srcFile = path.join(src, file);
        const destFile = path.join(dest, file);
        const stat = fs.statSync(srcFile);
        
        if (stat.isDirectory()) {
          copyAssets(srcFile, destFile);
        } else {
          fs.copyFileSync(srcFile, destFile);
        }
      });
    }
  };

  // Copy public assets if they exist
  const publicSrc = path.join(__dirname, 'client/public');
  const publicDest = path.join(__dirname, 'dist/public');
  copyAssets(publicSrc, publicDest);

  console.log('✅ Deployment build completed successfully!');
  console.log('');
  console.log('🌐 Production files are ready in ./dist/');
  console.log('📦 Frontend assets: ./dist/public/');
  console.log('🖥️  Server bundle: ./dist/index.js');

} catch (error) {
  console.error('❌ Deployment build failed:', error.message);
  process.exit(1);
}