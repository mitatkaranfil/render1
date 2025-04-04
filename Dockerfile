FROM node:18-alpine

WORKDIR /app

# İlk olarak package.json ve package-lock.json dosyalarını kopyalıyoruz
COPY package*.json ./

# Bağımlılıkları indirmek için package.json'ı kopyala
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Önce ana projedeki bağımlılıkları yükle
RUN npm install

# Backend ve frontend bağımlılıklarını yükle
RUN cd backend && npm install
RUN cd frontend && npm install

# Tüm kaynak kodunu kopyala
COPY . .

# Frontend'i build et
RUN cd frontend && npm run build

# Backend için port
EXPOSE 3000

# Uygulamayı çalıştır
CMD ["npm", "start"]
