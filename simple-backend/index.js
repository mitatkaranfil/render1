// ES Modules ile Express uygulaması
import express from 'express';

// Uygulama oluştur
const app = express();

// Başlangıç bilgisi
console.log('Basit uygulama başlatılıyor');
console.log('Node sürümü:', process.version);
console.log('Platform:', process.platform);
console.log('Çalışma dizini:', process.cwd());

// Railway portu veya varsayılan 5000
const PORT = process.env.PORT || 5000;
console.log('Kullanılacak port:', PORT);

// Root endpoint - healthcheck için
app.get('/', (req, res) => {
  console.log('Ana sayfa çağrıldı');
  res.status(200).send('Server is running');
});

// Uygulama başlat
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 