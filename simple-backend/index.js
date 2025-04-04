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

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint çağrıldı');
  res.json({ 
    message: 'Basit Server Çalışıyor',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check çağrıldı');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Server'ı başlat
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server http://0.0.0.0:${PORT} adresinde çalışıyor`);
}); 