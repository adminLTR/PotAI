# PotAI - Microservices Backend

Sistema de gestión inteligente de plantas con arquitectura de microservicios.

## 🏗️ Arquitectura

```
┌─────────────┐
│  Frontend   │ (Nginx:80)
│   (HTML)    │
└──────┬──────┘
       │
┌──────▼──────────────────────────────────────────────┐
│           API Gateway (Express:8080)                │
└──┬────┬────┬────┬────┬────┬────┬──────────────────┘
   │    │    │    │    │    │    │
   ▼    ▼    ▼    ▼    ▼    ▼    ▼
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│Auth │Plants│Pots│IoT │Media│Spec.│ ML  │
│:3001│:3002│:3003│:3004│:3005│:3006│:5000│
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
  │     │     │     │           │
  ▼     ▼     ▼     ▼           ▼
┌───┬───┬───┬───┬───┐         ┌───┐
│DB │DB │DB │DB │DB │ Redis   │   │
│:33│:33│:33│:33│:33│  :6379  │   │
│07 │08 │09 │10 │11 │         │   │
└───┴───┴───┴───┴───┘         └───┘
```

## 📦 Microservicios

| Servicio | Puerto | Base de Datos | Tecnología | Descripción |
|----------|--------|---------------|------------|-------------|
| **Gateway** | 8080 | - | Express | Punto de entrada único, enrutamiento |
| **Auth Service** | 3001 | MySQL:3307 | Express + Prisma | Autenticación, JWT, sesiones |
| **Plants Service** | 3002 | MySQL:3308 | Express + Prisma | Gestión de plantas |
| **Pots Service** | 3003 | MySQL:3309 | Express + Prisma | Gestión de maceteros |
| **IoT Service** | 3004 | MySQL:3310 | Express + Prisma | Ingesta datos ESP32, sensores |
| **Media Service** | 3005 | - | Express | Upload y gestión de imágenes |
| **Species Service** | 3006 | MySQL:3311 | Express + Prisma | Catálogo de especies |
| **ML Service** | 5000 | - | Flask | Predicción riego y reconocimiento |
| **Frontend** | 80 | - | Nginx | Aplicación web estática |

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker
- Docker Compose

### 1. Clonar y configurar

```bash
cd sources/backend

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus valores
```

### 2. Levantar todos los servicios

```bash
# Construir e iniciar todos los contenedores
docker-compose up --build

# O en segundo plano
docker-compose up -d --build
```

### 3. Ejecutar migraciones de Prisma

```bash
# Auth Service
docker-compose exec auth-service npx prisma migrate dev

# Plants Service
docker-compose exec plants-service npx prisma migrate dev

# Pots Service
docker-compose exec pots-service npx prisma migrate dev

# IoT Service
docker-compose exec iot-service npx prisma migrate dev

# Species Service
docker-compose exec species-service npx prisma migrate dev
```

### 4. Seed inicial (especies)

```bash
docker-compose exec species-service npm run seed
```

### 5. Acceder a la aplicación

- **Frontend**: http://localhost
- **API Gateway**: http://localhost:8080
- **Documentación API**: Ver README de cada servicio

## 🛠️ Comandos Útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f auth-service

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ borra datos)
docker-compose down -v

# Reconstruir un servicio específico
docker-compose up -d --build auth-service

# Ejecutar comando en un contenedor
docker-compose exec auth-service npm install nueva-libreria

# Ver estado de los servicios
docker-compose ps
```

## 🗄️ Prisma

### Crear una nueva migración

```bash
# Ejemplo en auth-service
docker-compose exec auth-service npx prisma migrate dev --name add_new_field
```

### Ver base de datos con Prisma Studio

```bash
docker-compose exec auth-service npx prisma studio
```

### Generar cliente de Prisma después de cambios

```bash
docker-compose exec auth-service npx prisma generate
```

## 📚 Documentación de Servicios

Cada servicio tiene su propio README con:
- Endpoints disponibles
- Request/Response examples
- Modelos de datos
- Variables de entorno

Ver:
- [Auth Service](./auth-service/README.md)
- [Plants Service](./plants-service/README.md)
- [Pots Service](./pots-service/README.md)
- [IoT Service](./iot-service/README.md)
- [Media Service](./media-service/README.md)
- [Species Service](./species-service/README.md)
- [ML Service](./ml-service/README.md)
- [Gateway](./gateway/README.md)

## 🔐 Autenticación

El sistema usa JWT + Session Tokens:

1. **Login** → Obtener `access_token` y `session_token`
2. **Requests protegidos** → Enviar ambos headers:
   ```
   Authorization: Bearer <access_token>
   X-Session-Token: <session_token>
   ```

## 🌐 Comunicación entre Servicios

Los servicios se comunican internamente usando las URLs definidas en docker-compose:
- `http://auth-service:3001`
- `http://plants-service:3002`
- etc.

El Gateway expone todos los endpoints externamente en el puerto 8080.

## 📊 Base de Datos

Cada servicio tiene su propia base de datos MySQL:

| Servicio | Base de Datos | Puerto Host |
|----------|---------------|-------------|
| Auth | potai_auth | 3307 |
| Plants | potai_plants | 3308 |
| Pots | potai_pots | 3309 |
| IoT | potai_iot | 3310 |
| Species | potai_species | 3311 |

**Conectar desde host:**
```bash
mysql -h 127.0.0.1 -P 3307 -u potai -p potai_auth
```

## 🧪 Testing

```bash
# Ejecutar tests de un servicio
docker-compose exec auth-service npm test

# Con coverage
docker-compose exec auth-service npm run test:coverage
```

## 🐛 Debugging

Para debugging con breakpoints:

```bash
# Detener el servicio
docker-compose stop auth-service

# Iniciarlo en modo debug
docker-compose run --rm --service-ports auth-service npm run debug
```

## 📈 Monitoreo

### Health Checks

Todos los servicios exponen un endpoint `/health`:

```bash
curl http://localhost:8080/health
curl http://localhost:3001/health
```

### Logs estructurados

Los logs siguen el formato:
```json
{
  "timestamp": "2025-11-20T10:30:00.000Z",
  "level": "info",
  "service": "auth-service",
  "message": "User logged in",
  "userId": 123
}
```

## 🔧 Desarrollo

### Agregar una dependencia

```bash
docker-compose exec auth-service npm install nueva-libreria
```

### Hot reload

Los servicios están configurados con hot reload en desarrollo. Los cambios en el código se reflejan automáticamente.

## 📝 Variables de Entorno

Ver `.env.example` para todas las variables configurables.

## 🚨 Troubleshooting

### Los contenedores no inician
```bash
# Ver logs detallados
docker-compose logs

# Verificar estado
docker-compose ps
```

### Error de conexión a base de datos
```bash
# Verificar que las bases de datos estén healthy
docker-compose ps

# Reiniciar bases de datos
docker-compose restart auth-db plants-db pots-db iot-db species-db
```

### Puerto ya en uso
```bash
# Cambiar puertos en docker-compose.yml o .env
# Ejemplo: cambiar 8080:8080 a 8081:8080
```

### Prisma no se conecta
```bash
# Regenerar cliente
docker-compose exec auth-service npx prisma generate

# Verificar DATABASE_URL en el contenedor
docker-compose exec auth-service printenv DATABASE_URL
```

## 📦 Producción

Para producción:

1. Cambiar `NODE_ENV=production`
2. Usar secrets seguros para JWT_SECRET, passwords, etc.
3. Configurar volúmenes persistentes
4. Usar un reverse proxy (nginx, traefik)
5. Implementar rate limiting
6. Habilitar HTTPS
7. Configurar backups de bases de datos

## 🤝 Contribuir

1. Crear feature branch
2. Hacer cambios
3. Ejecutar tests
4. Crear PR

## 📄 Licencia

MIT
