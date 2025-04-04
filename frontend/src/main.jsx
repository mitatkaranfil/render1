import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Check if we're running inside Telegram WebApp environment
const isTelegramWebAppEnv = Boolean(window.Telegram?.WebApp);

// Initialize theme and Telegram environment
if (isTelegramWebAppEnv) {
  try {
    // Import the SDK dynamically if we're in Telegram
    import('@twa-dev/sdk').then(({ WebApp }) => {
      // Initialize the WebApp API
      WebApp.ready();
      
      // Apply Telegram theme
      document.documentElement.className = WebApp.colorScheme || 'dark';
      
      // Expand the WebApp to fullscreen if needed
      WebApp.expand();
      
      console.log('Telegram WebApp initialized successfully');
    }).catch(error => {
      console.error('Error loading Telegram WebApp SDK:', error);
      document.documentElement.className = 'dark';
    });
  } catch (error) {
    console.warn('Telegram WebApp error:', error);
    document.documentElement.className = 'dark';
  }
} else {
  // Default theme for browser testing
  document.documentElement.className = 'dark';
  console.log('Not running in Telegram WebApp - some features may be limited');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 