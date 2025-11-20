FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar prisma schema
COPY prisma ./prisma/

# Generar Prisma Client
RUN npx prisma generate

# Copiar código fuente
COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
