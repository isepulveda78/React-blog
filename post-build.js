#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Running post-build cleanup...');

try {
  // Rename index-production.html to index.html if it exists
  const builtHtmlPath = path.join(__dirname, 'dist/public/index-production.html');
  const targetHtmlPath = path.join(__dirname, 'dist/public/index.html');
  
  if (fs.existsSync(builtHtmlPath)) {
    fs.renameSync(builtHtmlPath, targetHtmlPath);
    console.log('✅ Renamed index-production.html to index.html');
  }
  
  // Check if main.html exists and rename it to index.html
  const mainHtmlPath = path.join(__dirname, 'dist/public/main.html');
  if (fs.existsSync(mainHtmlPath) && !fs.existsSync(targetHtmlPath)) {
    fs.renameSync(mainHtmlPath, targetHtmlPath);
    console.log('✅ Renamed main.html to index.html');
  }
  
  console.log('✅ Post-build cleanup completed');
  
} catch (error) {
  console.error('❌ Post-build cleanup failed:', error.message);
  process.exit(1);
}