import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  return {
    resolve: {
      alias: {
        // Fix for React error #130 in dev mode
        'react/jsx-runtime': 'react/jsx-runtime.js',
      },
    },
    plugins: [react({
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
        ]
      },
    })],
    root: './client',
    build: {
      outDir: '../dist/public',
      emptyOutDir: true,
    },
    server: {
      proxy: {
        '/api': 'http://localhost:5000'
      }
    }
  }
})