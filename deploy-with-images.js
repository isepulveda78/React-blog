#!/usr/bin/env node

// Quick deployment script that ensures images are included in the build
// Run this instead of npm run build when deploying to live site

import { execSync } from 'child_process';

console.log('🚀 Building with images for live site deployment...');

try {
  // Use our custom build script that includes image copying
  execSync('node build.js', { stdio: 'inherit' });
  
  console.log('✅ Build complete with images included!');
  console.log('📁 Images copied to dist/img/');
  console.log('🌐 Ready for live site deployment');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}