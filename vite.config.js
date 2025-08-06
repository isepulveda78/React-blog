import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  return {
    esbuild: {
      jsx: 'automatic'
    },
    plugins: [react({
      jsxRuntime: 'automatic',
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
      proxy: {
        '/api': 'http://localhost:5000'
      }
    }
  }
})