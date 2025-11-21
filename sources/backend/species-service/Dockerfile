FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm install
COPY prisma ./prisma/
COPY . .
EXPOSE 3006
CMD ["sh", "-c", "npx prisma generate && npm run dev"]
