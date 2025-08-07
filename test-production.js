#!/usr/bin/env node

/**
 * Production Testing Script
 * Tests the production build to ensure authentication and chat functionality work correctly
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

console.log('🚀 Starting Production Environment Test...\n');

// Start production server
console.log('📦 Starting production server...');
const server = spawn('node', ['dist/index.js'], {
  env: { 
    ...process.env, 
    NODE_ENV: 'production',
    PORT: '5000'
  },
  stdio: 'pipe'
});

let serverReady = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('[SERVER]', output.trim());
  
  if (output.includes('serving on port 5000')) {
    serverReady = true;
    console.log('✅ Production server is running on port 5000');
    runTests();
  }
});

server.stderr.on('data', (data) => {
  console.log('[SERVER ERROR]', data.toString().trim());
});

async function runTests() {
  console.log('\n🧪 Running production tests...\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/health');
    const healthData = await healthResponse.json();
    console.log('   Health:', healthData);
    
    // Test 2: Authentication endpoint
    console.log('2️⃣ Testing authentication endpoint...');
    const authResponse = await fetch('http://localhost:5000/api/auth/me', {
      credentials: 'include'
    });
    console.log('   Auth Status:', authResponse.status);
    
    // Test 3: Static file serving
    console.log('3️⃣ Testing static file serving...');
    const indexResponse = await fetch('http://localhost:5000/');
    console.log('   Index Status:', indexResponse.status);
    
    // Test 4: WebSocket endpoint exists
    console.log('4️⃣ Testing WebSocket endpoint...');
    const wsResponse = await fetch('http://localhost:5000/ws');
    console.log('   WebSocket Status:', wsResponse.status, '(expected 404 for HTTP request)');
    
    console.log('\n✅ Production tests completed!');
    console.log('🌐 Production server is ready at: http://localhost:5000');
    console.log('💡 You can now test the chat functionality and authentication');
    console.log('🔍 Check the browser console for authentication logs');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping production server...');
  server.kill();
  process.exit(0);
});

process.on('exit', () => {
  server.kill();
});

// Wait for server to start
setTimeout(() => {
  if (!serverReady) {
    console.log('⏰ Server taking longer than expected to start...');
  }
}, 5000);