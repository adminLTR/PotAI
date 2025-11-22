# API Gateway

Punto de entrada único para todos los microservicios del sistema PotAI.

## Puerto
- **8080**

## Características

- **Proxy Reverso:** Enruta requests a microservicios internos
- **Rate Limiting:** 100 requests por IP cada 15 minutos
- **CORS:** Habilitado para todas las rutas
- **Security:** Headers seguros con Helmet
- **Logging:** Morgan para logs de desarrollo

## Rutas

### Tabla de Enrutamiento

| Ruta Externa | Servicio Interno | Puerto | Descripción |
|-------------|------------------|--------|-------------|
| `/auth/*` | auth-service | 3001 | Autenticación y gestión de usuarios |
| `/plants/*` | plants-service | 3002 | CRUD de plantas |
| `/pots/*` | pots-service | 3003 | CRUD de macetas |
| `/iot/*` | iot-service | 3004 | Ingesta de datos de sensores |
| `/media/*` | media-service | 3005 | Upload y almacenamiento de imágenes |
| `/species/*` | species-service | 3006 | Catálogo de especies |
| `/ml/*` | ml-service | 5000 | Predicciones ML |

### Ejemplos de Uso

**Desde el cliente (frontend):**
```javascript
// Login
const response = await fetch('http://localhost:8080/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'user', password: 'pass' })
});

// Crear planta
const response = await fetch('http://localhost:8080/plants', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({ name: 'Mi Rosa', potId: 1 })
});

// Obtener especies
const response = await fetch('http://localhost:8080/species');
```

## Configuración

### Variables de Entorno
```env
PORT=8080
AUTH_SERVICE_URL=http://auth-service:3001
PLANTS_SERVICE_URL=http://plants-service:3002
POTS_SERVICE_URL=http://pots-service:3003
IOT_SERVICE_URL=http://iot-service:3004
MEDIA_SERVICE_URL=http://media-service:3005
SPECIES_SERVICE_URL=http://species-service:3006
ML_SERVICE_URL=http://ml-service:5000
```

### Rate Limiting
```javascript
// 100 requests por IP cada 15 minutos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

## Manejo de Errores

### 503 Service Unavailable
Cuando un microservicio no responde:
```json
{
  "error": "Service Unavailable",
  "message": "The requested service is temporarily unavailable"
}
```

### 404 Not Found
Cuando la ruta no existe:
```json
{
  "error": "Not Found",
  "message": "The requested endpoint does not exist"
}
```

### 429 Too Many Requests
Cuando se excede el rate limit:
```json
{
  "error": "Too many requests, please try again later."
}
```

## Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "api-gateway",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Arquitectura

```
Cliente (Frontend/App)
        ↓
   API Gateway (8080)
        ↓
   ┌────┴────┬────┬────┬────┬────┬────┐
   ↓         ↓    ↓    ↓    ↓    ↓    ↓
 Auth    Plants Pots IoT Media Species ML
 3001     3002  3003 3004 3005  3006  5000
```

## Seguridad

- **Helmet:** Protección de headers HTTP
- **CORS:** Configurado para permitir requests del frontend
- **Rate Limiting:** Previene abuso de la API
- **Proxy:** Oculta la arquitectura interna de microservicios

## Logging

Logs de todas las requests con Morgan:
```
GET /auth/me 200 45.123 ms - 234
POST /plants 201 123.456 ms - 567
GET /species 200 12.345 ms - 1234
```

## Extensión

Para agregar un nuevo microservicio:

1. Agregar proxy en `src/index.js`:
```javascript
app.use('/nuevo-servicio', createProxyMiddleware({
  ...proxyOptions,
  target: 'http://nuevo-servicio:3007',
  pathRewrite: { '^/nuevo-servicio': '' }
}));
```

2. Actualizar la tabla de rutas en este README

3. Agregar variable de entorno en `.env`
