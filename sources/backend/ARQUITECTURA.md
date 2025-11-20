# 🏗️ Arquitectura de Microservicios - PotAI

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CAPA DE PRESENTACIÓN                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  📱 Frontend (Nginx - Puerto 80)                                         │
│  └── HTML/CSS/JS estáticos                                               │
│                                                                           │
│  🤖 ESP32 (Hardware IoT)                                                 │
│  └── Sensores: DHT11, Moisture Soil, Bomba de agua                       │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓ HTTP
┌─────────────────────────────────────────────────────────────────────────┐
│                          CAPA DE API GATEWAY                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  🚪 API Gateway (Express - Puerto 8080)                                  │
│  ├── Rate Limiting (100 req/15min)                                       │
│  ├── CORS & Security (Helmet)                                            │
│  ├── Logging (Morgan)                                                    │
│  └── Proxy Routes:                                                       │
│      ├── /auth/*    → auth-service:3001                                  │
│      ├── /plants/*  → plants-service:3002                                │
│      ├── /pots/*    → pots-service:3003                                  │
│      ├── /iot/*     → iot-service:3004                                   │
│      ├── /media/*   → media-service:3005                                 │
│      ├── /species/* → species-service:3006                               │
│      └── /ml/*      → ml-service:5000                                    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                       CAPA DE MICROSERVICIOS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  🔐 Auth Service (Express + Prisma - 3001)                               │
│  ├── Endpoints: /register, /login, /logout, /validate, /refresh, /me    │
│  ├── JWT + Session Tokens                                                │
│  ├── Redis para sesiones                                                 │
│  └── DB: potai_auth (MySQL:3307)                                         │
│      ├── users                                                            │
│      └── sessions                                                         │
│                                                                           │
│  🌱 Plants Service (Express + Prisma - 3002)                             │
│  ├── Endpoints: CRUD plantas                                             │
│  ├── Integra: Auth, Media, Species, Pots, IoT                            │
│  └── DB: potai_plants (MySQL:3308)                                       │
│      └── plants                                                           │
│                                                                           │
│  🪴 Pots Service (Express + Prisma - 3003)                               │
│  ├── Endpoints: CRUD macetas, /get-or-create                             │
│  └── DB: potai_pots (MySQL:3309)                                         │
│      └── pots                                                             │
│                                                                           │
│  📡 IoT Service (Express + Prisma - 3004)                                │
│  ├── Endpoints: /sensor-data, /plants/:id/conditions, /watering         │
│  ├── Autenticación ESP32: X-IoT-API-Key                                  │
│  ├── Integra: Plants, ML (riego automático)                              │
│  └── DB: potai_iot (MySQL:3310)                                          │
│      ├── ambiental_conditions                                             │
│      └── watering_logs                                                    │
│                                                                           │
│  📁 Media Service (Express - 3005)                                        │
│  ├── Endpoints: /upload, /uploads/:filename                              │
│  ├── Multer para multipart/form-data                                     │
│  └── Volumen: /app/uploads                                               │
│                                                                           │
│  🌿 Species Service (Express + Prisma - 3006)                            │
│  ├── Endpoints: CRUD especies, /search                                   │
│  ├── Seed: 8 especies (ajo, geranio, hierbabuena, menta,                │
│  │         oregano, orquidea, rosachina, tomatecherry)                   │
│  └── DB: potai_species (MySQL:3311)                                      │
│      └── species                                                          │
│                                                                           │
│  🤖 ML Service (Flask/Python - 5000)                                     │
│  ├── Endpoints:                                                           │
│  │   ├── /predict/recognition (TensorFlow .h5)                           │
│  │   └── /predict/irrigation (scikit-learn .pkl)                         │
│  └── Modelos:                                                             │
│      ├── model-recognition.h5 (reconocimiento especies)                  │
│      └── modelo_riego_numerico.pkl (predicción riego)                    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                    │                               │
                    ↓                               ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                       CAPA DE PERSISTENCIA                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  🗄️ MySQL Databases                                                      │
│  ├── auth-db:3307     → potai_auth                                       │
│  ├── plants-db:3308   → potai_plants                                     │
│  ├── pots-db:3309     → potai_pots                                       │
│  ├── iot-db:3310      → potai_iot                                        │
│  └── species-db:3311  → potai_species                                    │
│                                                                           │
│  🔴 Redis (6379)                                                          │
│  └── Sesiones, caché                                                     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Flujos de Comunicación

### 1. Flujo de Autenticación
```
Frontend → Gateway → Auth Service
                       ↓
                     auth-db (users)
                       ↓
                     Redis (sessions)
                       ↓
                     JWT Token ← Frontend
```

### 2. Flujo de Creación de Planta
```
Frontend → Gateway → Plants Service
                       ↓
                     Validate Token → Auth Service
                       ↓
                     Upload Image → Media Service → /uploads volume
                       ↓
                     Validate Species → Species Service
                       ↓
                     Validate Pot → Pots Service
                       ↓
                     plants-db.plants
                       ↓
                     Response ← Frontend
```

### 3. Flujo de Riego Automático (ESP32)
```
ESP32 → Gateway → IoT Service
  (X-IoT-API-Key)     ↓
                  Save sensor data → iot-db.ambiental_conditions
                      ↓
                  Get plant info → Plants Service
                      ↓
                  Get species → Species Service
                      ↓
                  ML Prediction → ML Service (/predict/irrigation)
                      ↓
                  Decision: needsWatering?
                      ↓ YES
                  Create watering log → iot-db.watering_logs
                      ↓
                  Response {needsWatering: true, amountMl: 250} ← ESP32
                      ↓
                  ESP32 activa bomba de agua
```

### 4. Flujo de Reconocimiento de Planta
```
Frontend → Upload Image → Gateway → Plants Service
                                       ↓
                                    Forward Image → ML Service
                                       ↓
                                    /predict/recognition (TensorFlow)
                                       ↓
                                    Response: {species: "rosachina", confidence: 0.95}
                                       ↓
                                    Get species ID → Species Service
                                       ↓
                                    Save plant with speciesId → plants-db
                                       ↓
                                    Response ← Frontend
```

## Patrones de Comunicación

### 1. Sincrónica (HTTP REST)
- Todos los servicios se comunican vía HTTP/REST
- Uso de `axios` en Node.js
- Uso de `requests` en Python
- Timeout recomendado: 5 segundos

### 2. Autenticación Inter-Service
- **Usuario final**: JWT Bearer Token
- **ESP32**: X-IoT-API-Key header
- **Service-to-Service**: 
  - Opción 1: Reenviar token del usuario
  - Opción 2: Service token compartido

### 3. Manejo de Errores
- Gateway captura errores y retorna 503 Service Unavailable
- Cada servicio retorna códigos HTTP apropiados
- Logs centralizados con Morgan

## Tecnologías por Capa

### Gateway
- **Framework**: Express.js
- **Proxy**: http-proxy-middleware
- **Security**: Helmet, CORS, Rate Limiting

### Microservicios (Node.js)
- **Framework**: Express.js
- **ORM**: Prisma (MySQL provider)
- **Auth**: JWT (jsonwebtoken), bcrypt
- **Validation**: express-validator
- **HTTP Client**: axios
- **Upload**: multer (Media Service)

### Microservicio ML
- **Framework**: Flask
- **Deep Learning**: TensorFlow/Keras
- **ML**: scikit-learn, joblib
- **Image**: Pillow (PIL)

### Bases de Datos
- **RDBMS**: MySQL 8.0
- **Cache/Sessions**: Redis 7

### Frontend
- **Server**: Nginx
- **Config**: Proxy /api/ → gateway:8080

### Orquestación
- **Container**: Docker
- **Orchestration**: Docker Compose v3.8
- **Network**: Bridge privado (potai-network)
- **Volumes**: Persistencia de datos MySQL, Redis, uploads

## Puertos

| Servicio | Puerto Externo | Puerto DB | Protocolo |
|----------|---------------|-----------|-----------|
| Frontend | 80 | - | HTTP |
| Gateway | 8080 | - | HTTP |
| Auth Service | 3001 | 3307 | HTTP |
| Plants Service | 3002 | 3308 | HTTP |
| Pots Service | 3003 | 3309 | HTTP |
| IoT Service | 3004 | 3310 | HTTP |
| Media Service | 3005 | - | HTTP |
| Species Service | 3006 | 3311 | HTTP |
| ML Service | 5000 | - | HTTP |
| Redis | 6379 | - | Redis |

## Escalabilidad

### Horizontal Scaling
Cada microservicio puede escalar independientemente:
```yaml
services:
  plants-service:
    deploy:
      replicas: 3
```

### Load Balancing
Usar nginx o HAProxy delante del Gateway:
```
                   Load Balancer
                        │
            ┌───────────┼───────────┐
            ↓           ↓           ↓
        Gateway-1   Gateway-2   Gateway-3
```

### Database Replication
Configurar MySQL Master-Slave:
```yaml
plants-db-master:
  image: mysql:8.0
plants-db-slave:
  image: mysql:8.0
  environment:
    MYSQL_MASTER_HOST: plants-db-master
```

## Seguridad

### Nivel Gateway
- Rate Limiting: 100 req/15min por IP
- Helmet: Headers seguros
- CORS: Solo orígenes permitidos

### Nivel Servicio
- JWT validation en endpoints protegidos
- Input validation con express-validator
- Password hashing con bcrypt (10 rounds)
- Session invalidation en Redis

### Nivel Base de Datos
- Usuarios MySQL con permisos mínimos
- Connections strings en variables de entorno
- Prisma previene SQL injection

### Nivel IoT
- API Key para autenticar ESP32
- Validación de plantId contra DB
- Rate limiting específico para /sensor-data

## Monitoreo (Futuro)

### Logs
- Morgan: Request logging
- Winston: Application logging
- ELK Stack: Centralización de logs

### Métricas
- Prometheus: Recolección de métricas
- Grafana: Visualización
- Health checks: /health en cada servicio

### Tracing
- Jaeger: Distributed tracing
- Correlation IDs: X-Request-ID header

## Backup y Recuperación

### Backup automático
```bash
# Crontab diario
0 2 * * * docker-compose exec auth-db mysqldump -uroot -p$PASS potai_auth > /backups/auth-$(date +\%Y\%m\%d).sql
```

### Restore
```bash
docker-compose exec -T auth-db mysql -uroot -ppassword potai_auth < backup.sql
```

---

**Arquitectura diseñada para ser:**
- ✅ Escalable (microservicios independientes)
- ✅ Mantenible (separación de concerns)
- ✅ Resiliente (health checks, retry logic)
- ✅ Segura (autenticación multi-capa)
- ✅ Observable (logs, health endpoints)
