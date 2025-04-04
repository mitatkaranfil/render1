FROM node:16-alpine

WORKDIR /app

# Önce backend için gerekli dosyaları kopyala ve kur
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Tüm kodları kopyala
COPY . .

# Backend için port
EXPOSE 3000

# Uygulamayı çalıştır
CMD ["npm", "start"]
