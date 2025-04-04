import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authenticateUser } from './services/api';
import Navbar from './components/layout/Navbar';
import Mining from './views/Mining';
import Profile from './views/Profile';
import Leaderboard from './views/Leaderboard';
import Loader from './components/ui/Loader';

// Environment variables for configuration
const API_URL = import.meta.env.VITE_API_URL || 'https://cosmofybot1-18d79623b815.herokuapp.com/api';
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';

// Check if we're in development mode or running on Heroku
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isHeroku = window.location.hostname.includes('herokuapp.com');
const isTelegramWebApp = Boolean(window.Telegram?.WebApp);

// Debug info
console.log('Environment config:', {
  API_URL,
  SKIP_AUTH,
  isDevelopment,
  isHeroku,
  isTelegramWebApp
});

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bypassDev, setBypassDev] = useState(false);
  
  console.log('Auth modes:', {
    isDevelopment,
    isHeroku,
    isTelegramWebApp,
    bypassDev,
    SKIP_AUTH
  });

  useEffect(() => {
    const authenticateWithServer = async () => {
      try {
        setIsLoading(true);
        console.log('[AUTH] Starting authentication process');
        
        // Rastgele kullanıcı ID'si oluştur - her kullanıcı farklı olsun
        const randomId = Math.floor(Math.random() * 1000000) + 1000000;
        
        // Telegram API verileri
        let telegramData = {
          initData: 'manual_telegram_data_' + randomId,
          user: {
            id: randomId,
            first_name: 'Telegram',
            last_name: 'User',
            username: 'telegram_user_' + randomId,
            language_code: 'tr'
          }
        };
        
        // Gerçek Telegram WebApp ortamındaysak, gerçek verileri almaya çalış
        if (isTelegramWebApp && window.Telegram?.WebApp) {
          try {
            const webApp = window.Telegram.WebApp;
            
            // WebApp'i genişlet
            if (!webApp.isExpanded) {
              webApp.expand();
            }
            
            console.log('[AUTH] Telegram WebApp detected');
            console.log('[AUTH] Telegram WebApp version:', webApp.version);
            console.log('[AUTH] Platform:', webApp.platform);
            console.log('[AUTH] Color scheme:', webApp.colorScheme);
            
            // InitData'yı kontrol et
            if (webApp.initData) {
              console.log('[AUTH] InitData length:', webApp.initData.length);
              console.log('[AUTH] InitData first 50 chars:', webApp.initData.substring(0, 50));
            } else {
              console.warn('[AUTH] No initData available in WebApp');
            }
            
            // User verisini kontrol et
            if (webApp.initDataUnsafe) {
              console.log('[AUTH] initDataUnsafe available');
              
              if (webApp.initDataUnsafe.user) {
                console.log('[AUTH] User data found in initDataUnsafe');
                console.log('[AUTH] User ID:', webApp.initDataUnsafe.user.id);
                console.log('[AUTH] User first_name:', webApp.initDataUnsafe.user.first_name);
                
                // Gerçek kullanıcı verisini kullan
                telegramData = {
                  initData: webApp.initData || 'backup_init_data_' + randomId,
                  user: webApp.initDataUnsafe.user
                };
              } else {
                console.warn('[AUTH] No user object in initDataUnsafe');
              }
            } else {
              console.warn('[AUTH] No initDataUnsafe object in WebApp');
            }
            
            // WebApp ready bildir
            try {
              webApp.ready();
              console.log('[AUTH] WebApp.ready() called successfully');
            } catch (readyError) {
              console.warn('[AUTH] Error calling WebApp.ready():', readyError);
            }
          } catch (telegramError) {
            console.error('[AUTH] Error accessing Telegram WebApp:', telegramError);
          }
        } else if (isTelegramWebApp) {
          console.warn('[AUTH] window.Telegram exists but WebApp is undefined');
        } else {
          console.log('[AUTH] Not in Telegram WebApp environment');
        }
        
        // API URL'i kontrol et
        console.log('[AUTH] Using API URL:', API_URL);
        
        // Kimlik doğrulama
        console.log('[AUTH] Sending auth request with data:', telegramData);
        const authResponse = await authenticateUser(telegramData);
        
        console.log('[AUTH] Auth response:', authResponse);
        
        if (authResponse.success) {
          console.log('[AUTH] Authentication successful');
          setUser(authResponse.user);
          setError(null);
          
          // Telegram WebApp'e hazır sinyali ver
          if (isTelegramWebApp && window.Telegram?.WebApp) {
            try {
              window.Telegram.WebApp.ready();
            } catch (e) {
              console.warn('[AUTH] Error calling WebApp.ready() after auth:', e);
            }
          }
        } else {
          console.error('[AUTH] Authentication failed:', authResponse.message);
          
          // Yedek plan: Yerel kullanıcı verisi kullan
          if (isDevelopment || bypassDev) {
            console.log('[AUTH] Using fallback user in dev mode');
            setUser({
              id: randomId,
              telegramId: randomId.toString(),
              firstName: 'Telegram',
              lastName: 'User',
              username: 'telegram_user_' + randomId,
              walletBalance: 500,
              miningLevel: 1
            });
            setError(null);
          } else {
            setError('Authentication failed: ' + (authResponse.message || 'Unknown error'));
          }
        }
      } catch (error) {
        console.error('[AUTH] Fatal error during authentication:', error);
        
        if (isDevelopment || bypassDev) {
          // Geliştirme modunda göstermelik kullanıcı
          console.log('[AUTH] Using mock user in dev mode after error');
          setUser({
            id: Date.now(),
            telegramId: Date.now().toString(),
            firstName: 'Dev',
            lastName: 'User',
            username: 'dev_user',
            walletBalance: 1000,
            miningLevel: 5
          });
          setError(null);
        } else {
          setError('Authentication error: ' + (error.message || 'Unknown error'));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    authenticateWithServer();
  }, [isDevelopment, bypassDev, isTelegramWebApp, API_URL]);
  
  if (isLoading) {
    return <Loader message="Initializing application..." fullScreen />;
  }
  
  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-dark p-4">
        <div className="bg-card-bg rounded-xl p-6 w-full max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-4">Authentication Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          
          <div className="flex flex-col space-y-3">
            <button 
              className="bg-primary text-white px-6 py-2 rounded-lg font-medium"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
            
            {!isDevelopment && !isTelegramWebApp && (
              <button
                className="bg-gray-700 text-white px-6 py-2 rounded-lg font-medium mt-2"
                onClick={() => setBypassDev(true)}
              >
                Use Demo Mode
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background text-white">
        <Navbar user={user} />
        
        <main className="flex-grow pb-16">
          <Routes>
            <Route path="/" element={<Mining />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App; 