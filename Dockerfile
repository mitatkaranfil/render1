FROM node:16-alpine

WORKDIR /app

# Önce backend için gerekli dosyaları kopyala ve kur
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Tüm kodları kopyala
COPY . .

# Açıkça 5000 portunu belirt
EXPOSE 5000

# Çalıştırma komutunu açıkça belirt
CMD ["node", "backend/src/index.js"]
