# Auth Service - Guía de Implementación Completa

✅ **Servicio completamente implementado con arquitectura MVC**

## 📁 Estructura del Proyecto

```
auth-service/
├── src/
│   ├── config/
│   │   ├── database.js          # Configuración de Prisma
│   │   └── redis.js              # Configuración de Redis
│   ├── controllers/
│   │   └── auth.controller.js    # Controladores de autenticación
│   ├── middleware/
│   │   ├── auth.middleware.js    # Middleware de autenticación
│   │   ├── validation.middleware.js  # Validaciones
│   │   └── error.middleware.js   # Manejo de errores
│   ├── routes/
│   │   └── auth.routes.js        # Definición de rutas
│   ├── services/
│   │   ├── auth.service.js       # Lógica de negocio
│   │   └── session.service.js    # Gestión de sesiones
│   ├── utils/
│   │   ├── jwt.js                # Utilidades JWT
│   │   ├── password.js           # Hash de contraseñas
│   │   ├── crypto.js             # Generación de tokens
│   │   └── errors.js             # Clases de error personalizadas
│   └── index.js                  # Punto de entrada
├── prisma/
│   └── schema.prisma             # Esquema de base de datos
├── test-auth.js                  # Suite de pruebas
├── Dockerfile
├── .dockerignore
└── package.json
```

## 🎯 Características Implementadas

### ✅ Arquitectura MVC Completa
- **Models**: Prisma ORM con esquemas User y Session
- **Views**: Respuestas JSON estructuradas
- **Controllers**: Lógica de presentación y manejo de requests
- **Services**: Lógica de negocio separada

### ✅ Seguridad
- Contraseñas hasheadas con **bcrypt** (10 salt rounds)
- JWT firmados con **HS256**
- Tokens de sesión únicos y aleatorios
- Validación robusta de inputs con **express-validator**
- Headers de seguridad con **helmet**
- CORS configurado
- Rate limiting en el gateway

### ✅ Gestión de Sesiones
- Sesiones almacenadas en **MySQL** (persistencia)
- Cache de sesiones en **Redis** (velocidad)
- Expiración automática de sesiones
- Invalidación de sesiones antiguas en login
- Limpieza automática de sesiones expiradas

### ✅ Manejo de Errores
- Clases de error personalizadas
- Middleware global de errores
- Validación de inputs
- Mensajes de error descriptivos

## 📡 API Endpoints

### Rutas Públicas

#### 1. **POST** `/auth/register`
Registra un nuevo usuario.

**Request:**
```json
{
  "username": "juanperez",
  "email": "juan@example.com",
  "password": "Test123456"
}
```

**Validaciones:**
- Username: 3-50 caracteres, solo alfanuméricos y guiones bajos
- Email: formato válido
- Password: mínimo 6 caracteres, debe contener mayúscula, minúscula y número

**Response 201:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "username": "juanperez",
    "email": "juan@example.com",
    "createdAt": "2025-11-20T10:30:00.000Z"
  }
}
```

---

#### 2. **POST** `/auth/login`
Autentica un usuario.

**Request:**
```json
{
  "username": "juanperez",
  "password": "Test123456"
}
```

**Response 200:**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionToken": "abc123def456...",
  "expiresAt": "2025-11-20T12:30:00.000Z",
  "user": {
    "id": 1,
    "username": "juanperez",
    "email": "juan@example.com"
  }
}
```

---

#### 3. **GET** `/auth/validate`
Valida tokens (usado por otros servicios).

**Headers:**
```
Authorization: Bearer <accessToken>
X-Session-Token: <sessionToken>
```

**Response 200:**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "juanperez",
    "email": "juan@example.com"
  },
  "expiresAt": "2025-11-20T12:30:00.000Z"
}
```

---

### Rutas Protegidas

#### 4. **POST** `/auth/logout`
Cierra la sesión del usuario.

**Headers:**
```
Authorization: Bearer <accessToken>
X-Session-Token: <sessionToken>
```

**Response 200:**
```json
{
  "message": "Logout successful"
}
```

---

#### 5. **GET** `/auth/me`
Obtiene información del usuario autenticado.

**Headers:**
```
Authorization: Bearer <accessToken>
X-Session-Token: <sessionToken>
```

**Response 200:**
```json
{
  "user": {
    "id": 1,
    "username": "juanperez",
    "email": "juan@example.com",
    "createdAt": "2025-11-15T10:00:00.000Z",
    "updatedAt": "2025-11-20T10:30:00.000Z"
  }
}
```

---

#### 6. **GET** `/auth/health`
Health check del servicio.

**Response 200:**
```json
{
  "status": "healthy",
  "service": "auth-service",
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

## 🚀 Uso con el Gateway

Todos los endpoints están disponibles a través del API Gateway:

```bash
# A través del gateway (puerto 8080)
curl http://localhost:8080/auth/register

# Directo al servicio (puerto 3001)
curl http://localhost:3001/auth/register
```

El gateway hace proxy de todas las rutas `/auth/*` al servicio de autenticación.

## 🔐 Flujo de Autenticación

1. **Usuario se registra** → `POST /auth/register`
2. **Usuario hace login** → `POST /auth/login`
   - Genera JWT (access token)
   - Genera session token único
   - Almacena sesión en MySQL + Redis
3. **Para requests protegidos:**
   - Enviar ambos headers:
     - `Authorization: Bearer {accessToken}`
     - `X-Session-Token: {sessionToken}`
4. **Otros servicios validan** → `GET /auth/validate`
5. **Usuario cierra sesión** → `POST /auth/logout`

## 🧪 Testing

### Ejecutar Suite de Pruebas

```bash
# Asegúrate de que el servicio esté corriendo
docker-compose up -d auth-service auth-db redis

# Ejecutar pruebas
cd auth-service
npm test

# O probar contra el gateway
BASE_URL=http://localhost:8080 npm test
```

### Pruebas Manuales con cURL

**Registro:**
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456"
  }'
```

**Get Current User:**
```bash
curl -X GET http://localhost:8080/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Session-Token: YOUR_SESSION_TOKEN"
```

**Logout:**
```bash
curl -X POST http://localhost:8080/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Session-Token: YOUR_SESSION_TOKEN"
```

## 🔧 Configuración

### Variables de Entorno

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=mysql://potai:potaipass@auth-db:3306/potai_auth
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=2h
CORS_ORIGIN=*
```

### Inicializar Base de Datos

```bash
cd auth-service

# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init

# Ver datos en Prisma Studio
npx prisma studio
```

## 📊 Base de Datos

### Tabla: users
```sql
id            INT AUTO_INCREMENT PRIMARY KEY
username      VARCHAR(50) UNIQUE
email         VARCHAR(100) UNIQUE
password_hash VARCHAR(255)
created_at    DATETIME DEFAULT NOW()
updated_at    DATETIME ON UPDATE NOW()
```

### Tabla: sessions
```sql
id            INT AUTO_INCREMENT PRIMARY KEY
user_id       INT (FK -> users.id)
session_token VARCHAR(255) UNIQUE
created_at    DATETIME DEFAULT NOW()
expires_at    DATETIME
```

## 🗂️ Redis Schema

```
Key: session:{sessionToken}
Value: {"userId":1,"username":"juan","email":"juan@example.com","expiresAt":"..."}
TTL: 7200 segundos (2 horas)
```

## 🔄 Integración con Otros Servicios

Otros microservicios pueden validar usuarios de dos formas:

### Opción 1: Validación Remota (Recomendado)
```javascript
const axios = require('axios');

async function validateUser(req) {
  const token = req.headers.authorization;
  const sessionToken = req.headers['x-session-token'];
  
  const response = await axios.get('http://auth-service:3001/auth/validate', {
    headers: {
      'Authorization': token,
      'X-Session-Token': sessionToken
    }
  });
  
  if (!response.data.valid) {
    throw new Error('Unauthorized');
  }
  
  return response.data.user;
}
```

### Opción 2: Middleware Compartido
```javascript
const { authenticate } = require('../middleware/auth.middleware');

// Usar el mismo middleware en otros servicios
router.get('/protected-route', authenticate, (req, res) => {
  // req.user está disponible
  res.json({ user: req.user });
});
```

## ⚠️ Consideraciones de Seguridad

### ✅ Implementado
- Contraseñas hasheadas con bcrypt
- JWT firmados con HS256
- Validación de inputs
- Headers de seguridad (helmet)
- CORS configurado
- Rate limiting (en gateway)
- Sesiones con expiración

### 🚨 Para Producción
- [ ] Usar HTTPS
- [ ] Cambiar JWT_SECRET a valor fuerte
- [ ] Considerar RS256 (clave pública/privada) para JWT
- [ ] Implementar refresh tokens
- [ ] Agregar 2FA opcional
- [ ] Logging estructurado
- [ ] Monitoreo y alertas
- [ ] Backups de base de datos

## 📈 Logging

El servicio registra los siguientes eventos:

- ✅ Usuario registrado
- ✅ Login exitoso
- ✅ Login fallido
- ✅ Logout
- ✅ Validación de token
- ✅ Sesión expirada
- ✅ Token inválido

## 🐛 Debugging

```bash
# Ver logs del servicio
docker-compose logs -f auth-service

# Conectar a la base de datos
docker exec -it potai-auth-db mysql -u potai -p potai_auth

# Conectar a Redis
docker exec -it potai-redis redis-cli

# Verificar sesiones en Redis
docker exec -it potai-redis redis-cli KEYS "session:*"
```

## 🎉 ¡Servicio Listo!

El servicio Auth está completamente implementado con:
- ✅ Arquitectura MVC robusta
- ✅ Seguridad de nivel producción
- ✅ Gestión de sesiones con Redis
- ✅ Validación completa
- ✅ Manejo de errores
- ✅ Suite de pruebas
- ✅ Documentación completa
- ✅ Integración con gateway

**Siguiente paso:** Ejecutar migraciones y probar el servicio.
