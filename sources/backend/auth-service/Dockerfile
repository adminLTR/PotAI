FROM node:20-alpine

WORKDIR /app

# Instalar OpenSSL para Prisma y MySQL client para shadow database
RUN apk add --no-cache openssl mysql-client

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar prisma schema
COPY prisma ./prisma/

# Copiar código fuente (excluyendo node_modules via .dockerignore)
COPY src ./src
COPY docker-entrypoint.sh ./

# Copiar script de inicialización
RUN mv docker-entrypoint.sh /usr/local/bin/ && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3001

# Usar entrypoint para ejecutar migraciones antes de iniciar
ENTRYPOINT ["/bin/sh", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
