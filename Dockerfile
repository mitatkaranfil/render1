FROM node:16-alpine

# Çalışma dizinini oluştur
WORKDIR /app

# Root package.json ve lockfile kopyala
COPY package*.json ./

# Ana uygulama bağımlılıklarını kur
RUN npm install

# Backend package.json ve lockfile kopyala
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Tüm kodları kopyala
COPY . .

# Uygulamanın çalışabilmesi için gerekli ortam değişkenlerini varsayılan değerlerle ayarla
ENV PORT=5000
ENV NODE_ENV=production

# Açıkça portu belirt
EXPOSE 5000

# Direkt backend'i başlat
CMD ["node", "backend/src/index.js"]
