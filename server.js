import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

// For ESM, we need to get __dirname this way
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Set port
const PORT = process.env.PORT || 3000;

// Log startup info
console.log('===== STARTING COSMOFY INTEGRATED SERVER =====');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', PORT);
console.log('Process ID:', process.pid);
console.log('Node Version:', process.version);
console.log('Platform:', process.platform);

// CORS configuration 
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

// CORS middleware
app.use(cors(corsOptions));
app.options('*', cors());

// Temel güvenlik - Helmet ile
app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Middleware
app.use(express.json());
app.use(morgan('dev'));

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

// API routes
// We'll dynamically import the routes to handle ESM compatibility
try {
  const authRoutes = await import('./backend/src/routes/auth.js');
  const miningRoutes = await import('./backend/src/routes/mining.js');
  const userRoutes = await import('./backend/src/routes/user.js');
  const adsRoutes = await import('./backend/src/routes/ads.js');
  const leaderboardRoutes = await import('./backend/src/routes/leaderboard.js');
  
  app.use('/api/auth', authRoutes.default);
  app.use('/api/mining', miningRoutes.default);
  app.use('/api/user', userRoutes.default);
  app.use('/api/ads', adsRoutes.default);
  app.use('/api/leaderboard', leaderboardRoutes.default);
} catch (error) {
  console.error('Error setting up API routes:', error);
  // Create a fallback route for testing purposes
  app.use('/api', (req, res) => {
    res.json({ 
      message: 'API endpoint placeholder (route import failed)', 
      error: error.message 
    });
  });
}

// Serve static frontend files from the frontend/dist directory
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'frontend/dist', 'index.html'));
});

// Not found handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API Resource not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('===== SERVER STARTED SUCCESSFULLY =====');
  console.log(`Server running at: http://0.0.0.0:${PORT}`);
  console.log(`API available at: http://0.0.0.0:${PORT}/api`);
  console.log(`Frontend available at: http://0.0.0.0:${PORT}`);
  console.log('===========================================');
});

export default app; 