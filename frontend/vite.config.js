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
        target: 'https://cosmofybot1-18d79623b815.herokuapp.com',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  preview: {
    port: process.env.PORT || 5173,
    host: '0.0.0.0',
    allowedHosts: [
      'cosmofy-frontend-00d9ca88cc7d.herokuapp.com',
      '*.herokuapp.com'
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