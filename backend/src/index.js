import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
import miningRoutes from './routes/mining.js';
import userRoutes from './routes/user.js';
import adsRoutes from './routes/ads.js';
import leaderboardRoutes from './routes/leaderboard.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Log startup info
console.log('===== STARTING COSMOFY API SERVER =====');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', PORT);
console.log('Process ID:', process.pid);
console.log('Node Version:', process.version);
console.log('Platform:', process.platform);

// Basit CORS yapılandırması - tüm isteklere izin ver
app.use(cors());

// Log CORS setup
console.log('CORS: Enabled for all origins');

// CORS preflight için OPTIONS işleyici
app.options('*', cors());

// Temel güvenlik - Helmet ile
app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// JSON body parser
app.use(express.json());

// Loglama
app.use(morgan('dev'));

// Test endpoint - Canlılık kontrolü için
app.get('/test', (req, res) => {
  res.send('API is working!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint requested');
  res.status(200).json({ 
    message: 'Cosmofy API server', 
    version: '1.0.0',
    test: '/test',
    health: '/health'
  });
});

// API routes - Rate limiter olmadan başlangıçta
try {
  app.use('/api/auth', authRoutes);
  app.use('/api/mining', miningRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/ads', adsRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
} catch (error) {
  console.error('Error setting up API routes:', error);
}

// Not found handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Resource not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

// Server'ı başlat - process.env.PORT veya 5000 üzerinde dinliyoruz
// Tüm arayüzlerde bağlantıları kabul etmek için '0.0.0.0' kullanıyoruz
try {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('===== SERVER STARTED SUCCESSFULLY =====');
    console.log(`Server running at: http://0.0.0.0:${PORT}`);
    console.log(`Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`Test endpoint: http://0.0.0.0:${PORT}/test`);
    console.log('===========================================');
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 