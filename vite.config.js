import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  return {
    esbuild: {
      jsx: 'automatic'
    },
    plugins: [react({
      jsxRuntime: 'automatic',
      fastRefresh: true,
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { 
            runtime: 'automatic',
            importSource: 'react' 
          }],
        ]
      },
    })],
    root: './client',
    build: {
      outDir: '../dist/public',
      emptyOutDir: true,
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: false,
      proxy: {
        '/api': 'http://localhost:5000'
      },
      watch: {
        usePolling: true,
        interval: 300
      },
      allowedHosts: [
        ".replit.dev",
        ".repl.co", 
        "localhost",
        "127.0.0.1",
        "0.0.0.0"
      ]
    }
  }
})