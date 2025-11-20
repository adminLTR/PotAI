# 🛠️ Comandos Útiles

## Docker Compose

### Iniciar servicios
```bash
# Todos los servicios
docker-compose up -d

# Servicios específicos
docker-compose up -d auth-service plants-service

# Ver logs en tiempo real
docker-compose logs -f

# Logs de un servicio específico
docker-compose logs -f auth-service
```

### Detener servicios
```bash
# Detener todos
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: borra datos)
docker-compose down -v

# Reiniciar un servicio
docker-compose restart auth-service
```

### Reconstruir imágenes
```bash
# Reconstruir todas las imágenes
docker-compose build

# Reconstruir sin caché
docker-compose build --no-cache

# Reconstruir y levantar
docker-compose up -d --build
```

## Prisma

### Migraciones
```bash
# Aplicar migraciones (producción)
docker-compose exec auth-service npx prisma migrate deploy

# Crear migración (desarrollo)
docker-compose exec auth-service npx prisma migrate dev --name nombre_migracion

# Ver estado de migraciones
docker-compose exec auth-service npx prisma migrate status
```

### Prisma Studio (GUI)
```bash
# Abrir Prisma Studio para explorar/editar datos
docker-compose exec auth-service npx prisma studio
# Abre en http://localhost:5555

# Para cada servicio:
docker-compose exec plants-service npx prisma studio
docker-compose exec pots-service npx prisma studio
docker-compose exec iot-service npx prisma studio
docker-compose exec species-service npx prisma studio
```

### Generar cliente Prisma
```bash
docker-compose exec auth-service npx prisma generate
```

## Base de Datos

### Acceder a MySQL
```bash
# Auth DB
docker-compose exec auth-db mysql -uroot -ppassword potai_auth

# Plants DB
docker-compose exec plants-db mysql -uroot -ppassword potai_plants

# Pots DB
docker-compose exec pots-db mysql -uroot -ppassword potai_pots

# IoT DB
docker-compose exec iot-db mysql -uroot -ppassword potai_iot

# Species DB
docker-compose exec species-db mysql -uroot -ppassword potai_species
```

### Queries útiles
```sql
-- Ver tablas
SHOW TABLES;

-- Ver estructura de tabla
DESCRIBE users;

-- Ver todos los registros
SELECT * FROM users;

-- Eliminar todos los datos (CUIDADO)
TRUNCATE TABLE users;
```

### Backup y Restore
```bash
# Backup de una base de datos
docker-compose exec auth-db mysqldump -uroot -ppassword potai_auth > backup_auth.sql

# Restore
docker-compose exec -T auth-db mysql -uroot -ppassword potai_auth < backup_auth.sql
```

## Redis

### Acceder a Redis CLI
```bash
docker-compose exec redis redis-cli

# Comandos dentro de redis-cli:
# Ver todas las keys
KEYS *

# Ver valor de una key
GET session:abc123

# Ver info del servidor
INFO

# Eliminar todas las keys (CUIDADO)
FLUSHALL
```

## Desarrollo

### Instalar dependencias
```bash
# Entrar al contenedor
docker-compose exec auth-service sh

# Instalar nueva dependencia
npm install nombre-paquete

# Salir
exit
```

### Ver archivos dentro del contenedor
```bash
docker-compose exec auth-service ls -la
docker-compose exec auth-service cat src/index.js
```

### Ejecutar comandos en servicios
```bash
# Node services
docker-compose exec auth-service node -v
docker-compose exec auth-service npm list

# ML Service (Python)
docker-compose exec ml-service python --version
docker-compose exec ml-service pip list
```

## Testing

### Test de endpoints
```bash
# Health checks
curl http://localhost:8080/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:5000/health

# Registro de usuario
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password123"}'

# Obtener especies
curl http://localhost:8080/species
```

### Con token JWT
```bash
# Guardar token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Usar token
curl http://localhost:8080/auth/me \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:8080/plants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mi Rosa","potId":1,"speciesId":7}'
```

## Troubleshooting

### Ver logs de error
```bash
# Todos los servicios
docker-compose logs --tail=100

# Servicio específico con seguimiento
docker-compose logs -f auth-service
```

### Reiniciar un servicio problemático
```bash
docker-compose restart auth-service
```

### Verificar estado de contenedores
```bash
docker-compose ps
```

### Verificar uso de recursos
```bash
docker stats
```

### Limpiar todo (reset completo)
```bash
# CUIDADO: Esto elimina todos los datos
docker-compose down -v
docker-compose up -d
# Volver a ejecutar migraciones y seed
```

## Seeds

### Poblar especies
```bash
docker-compose exec species-service npm run seed
```

### Crear seed personalizado
```bash
# Entrar al contenedor
docker-compose exec auth-service sh

# Crear script de seed
cat > src/seed-users.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@potai.com',
      passwordHash: hash
    }
  });
}

seed();
EOF

# Ejecutar
node src/seed-users.js
```

## Monitoreo

### Ver recursos por servicio
```bash
docker stats gateway auth-service plants-service
```

### Ver redes Docker
```bash
docker network ls
docker network inspect backend_potai-network
```

### Ver volúmenes
```bash
docker volume ls
docker volume inspect backend_auth-db-data
```

## Producción

### Build para producción
```bash
# Cambiar CMD en Dockerfiles de "npm run dev" a "npm start"
# Reconstruir
docker-compose build --no-cache
docker-compose up -d
```

### Variables de entorno de producción
```bash
# Editar .env con valores seguros:
# - JWT_SECRET aleatorio largo
# - IOT_API_KEY seguro
# - Contraseñas de BD fuertes
# - Deshabilitar CORS restrictivo
```
