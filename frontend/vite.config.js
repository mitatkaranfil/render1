import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Frontend server port
    open: true, // Auto-open browser
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'https://cosmofybot.up.railway.app',
        changeOrigin: true,
        secure: true,
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
  }
}); 