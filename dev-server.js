#!/usr/bin/env node

// Development server with hot reload support
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting development server with hot reload...');

// Start the backend server
const backend = spawn('node', ['-r', 'tsx/esm', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

// Start Vite development server
const frontend = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '3000'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit'
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

backend.on('close', (code) => {
  if (code !== 0) {
    console.log(`Backend server exited with code ${code}`);
  }
});

frontend.on('close', (code) => {
  if (code !== 0) {
    console.log(`Frontend server exited with code ${code}`);
  }
});

console.log('✅ Development servers started:');
console.log('   Backend: http://localhost:5000');
console.log('   Frontend: http://localhost:3000');
console.log('   Hot reload enabled - changes will update automatically');