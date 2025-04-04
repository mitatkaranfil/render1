const express = require('express');
const cors = require('cors');

// Express app oluştur
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Başlangıç logları
console.log('===== BASIT SERVER BAŞLATILIYOR =====');
console.log('Port:', PORT);
console.log('Node Version:', process.version);
console.log('Platform:', process.platform);
console.log('Environment:', process.env.NODE_ENV || 'development');

// Root endpoint - Aynı zamanda healthcheck
app.get('/', (req, res) => {
  console.log('Root endpoint çağrıldı - IP:', req.ip);
  res.status(200).send('OK');
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint çağrıldı');
  res.json({ 
    message: 'Basit Server Çalışıyor',
    timestamp: new Date().toISOString()
  });
});

// Eski healthcheck endpoint'ini koru
app.get('/health', (req, res) => {
  console.log('Health check çağrıldı');
  res.status(200).send('OK');
});

// Diğer rotalar için catch-all
app.use('*', (req, res) => {
  console.log('Bilinmeyen endpoint çağrıldı:', req.originalUrl);
  res.status(404).send('Not Found');
});

// Server'ı başlat
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server http://0.0.0.0:${PORT} adresinde çalışıyor`);
});

// Hata yakalama
server.on('error', (err) => {
  console.error('Server başlatma hatası:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM sinyali alındı, server kapatılıyor...');
  server.close(() => {
    console.log('Server kapatıldı');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Yakalanmamış istisna:', err);
}); 