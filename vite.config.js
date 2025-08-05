import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  
  // Set the root to the client directory
  root: path.resolve(__dirname, 'client'),
  
  // Build configuration
  build: {
    outDir: path.resolve(__dirname, 'dist/public'),
    emptyOutDir: true,
    // Use the production-ready index.html template
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index-production.html'),
      },
      output: {
        // Rename the built HTML file to index.html
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  
  // Public directory for static assets
  publicDir: path.resolve(__dirname, 'client/public'),
  
  // Configure aliases for imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  
  // Server configuration for development
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  
  // Define environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
})