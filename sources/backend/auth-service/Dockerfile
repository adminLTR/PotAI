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

# Copiar script de inicialización
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3001

# Usar entrypoint para ejecutar migraciones antes de iniciar
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
