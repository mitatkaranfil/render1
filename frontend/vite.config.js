import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Frontend development server port
    open: true, // Auto-open browser
    proxy: {
      // Proxy API requests to backend during development
      '/api': {
        target: process.env.API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: process.env.PORT || 5173,
    host: '0.0.0.0',
    allowedHosts: [
      'cosmofybot.up.railway.app',
      '*.railway.app'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
      },
    },
  },
  // Define environment variables
  define: {
    'import.meta.env.TELEGRAM_PRODUCTION': JSON.stringify(process.env.TELEGRAM_PRODUCTION || false),
    'import.meta.env.API_URL': JSON.stringify(process.env.API_URL || '/api'),
  }
}); 