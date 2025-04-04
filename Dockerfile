FROM node:20-alpine

WORKDIR /app

# İlk olarak package.json dosyalarını kopyalıyoruz
COPY package*.json ./

# Root level bağımlılıkları kur
RUN npm install

# Backend package.json kopyala ve bağımlılıkları kur
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Frontend package.json kopyala ve bağımlılıkları kur
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install 

# Şimdi tüm kaynak kodlarını kopyala
COPY . .

# NPM, Node ve Yarn versiyonlarını kontrol et
RUN node --version && npm --version

# Backend oluşturulan dosyalarını kopyala
RUN cd backend && ls -la

# Frontend build et - izinleri düzelt
RUN chmod -R 755 /app/frontend/node_modules/.bin
RUN cd frontend && npm run build

# Backend için port
EXPOSE 3000

# Uygulamayı çalıştır
CMD ["npm", "start"]
