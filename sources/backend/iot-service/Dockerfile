FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl mysql-client
COPY package*.json ./
RUN npm install
COPY prisma ./prisma/
COPY . .
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 3004
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
