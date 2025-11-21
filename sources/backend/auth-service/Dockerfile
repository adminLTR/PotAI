FROM node:20-alpine

WORKDIR /app

# Instalar OpenSSL para Prisma
RUN apk add --no-cache openssl

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar prisma schema
COPY prisma ./prisma/

# Copiar código fuente
COPY . .

EXPOSE 3001

# Generar Prisma Client al iniciar
CMD ["sh", "-c", "npx prisma generate && npm run dev"]
