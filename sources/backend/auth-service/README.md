# Auth Service

Servicio de autenticación y gestión de sesiones para PotAI.

## 🎯 Responsabilidades

- Registro de usuarios
- Autenticación (login/logout)
- Generación y validación de JWT tokens
- Gestión de sesiones con Redis
- Validación de tokens para otros servicios

## 🗄️ Modelos de Datos

### User
```prisma
model User {
  id            Int       @id @default(autoincrement())
  username      String    @unique @db.VarChar(50)
  email         String    @unique @db.VarChar(100)
  passwordHash  String    
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
}
```

### Session
```prisma
model Session {
  id            Int       @id @default(autoincrement())
  userId        Int
  sessionToken  String    @unique
  createdAt     DateTime  @default(now())
  expiresAt     DateTime
  user          User      @relation(...)
}
```

## 📡 API Endpoints

### Base URL
```
http://localhost:3001
```

---

### 1. Registro de Usuario

**POST** `/auth/register`

Crea una nueva cuenta de usuario.

**Request Body:**
```json
{
  "username": "juanperez",
  "email": "juan@example.com",
  "password": "securePassword123"
}
```

**Validaciones:**
- `username`: 3-50 caracteres, alfanumérico, único
- `email`: formato email válido, único
- `password`: mínimo 6 caracteres

**Response 201 (Success):**
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

**Response 400 (Error):**
```json
{
  "error": "Validation error",
  "details": [
    "Username already exists",
    "Email already exists"
  ]
}
```

---

### 2. Login

**POST** `/auth/login`

Autentica un usuario y devuelve tokens.

**Request Body:**
```json
{
  "username": "juanperez",
  "password": "securePassword123"
}
```

**Response 200 (Success):**
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

**Response 401 (Error):**
```json
{
  "error": "Invalid credentials"
}
```

**Notas:**
- El `accessToken` es un JWT firmado con HS256
- El `sessionToken` se almacena en MySQL y Redis
- Ambos tokens expiran en 2 horas (configurable)
- Los tokens antiguos del usuario se invalidan automáticamente

---

### 3. Logout

**POST** `/auth/logout`

Invalida la sesión actual del usuario.

**Headers:**
```
Authorization: Bearer <accessToken>
X-Session-Token: <sessionToken>
```

**Response 200 (Success):**
```json
{
  "message": "Logout successful"
}
```

**Response 401 (Error):**
```json
{
  "error": "Invalid or expired token"
}
```

---

### 4. Validar Token (Interno)

**GET** `/auth/validate`

Endpoint interno para que otros servicios validen tokens.

**Headers:**
```
Authorization: Bearer <accessToken>
X-Session-Token: <sessionToken>
```

**Response 200 (Success):**
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

**Response 401 (Error):**
```json
{
  "valid": false,
  "error": "Invalid or expired token"
}
```

**Notas:**
- Este endpoint es usado internamente por otros microservicios
- Valida tanto el JWT como el session token en Redis/MySQL
- Retorna los datos del usuario si es válido

---

### 5. Refresh Token (Opcional)

**POST** `/auth/refresh`

Renueva un access token próximo a expirar.

**Headers:**
```
Authorization: Bearer <accessToken>
X-Session-Token: <sessionToken>
```

**Response 200 (Success):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-11-20T14:30:00.000Z"
}
```

---

### 6. Get Current User

**GET** `/auth/me`

Obtiene información del usuario autenticado.

**Headers:**
```
Authorization: Bearer <accessToken>
X-Session-Token: <sessionToken>
```

**Response 200 (Success):**
```json
{
  "user": {
    "id": 1,
    "username": "juanperez",
    "email": "juan@example.com",
    "createdAt": "2025-11-15T10:00:00.000Z"
  }
}
```

---

## 🔐 Autenticación

### Flujo de Autenticación

1. **Usuario hace login** → POST `/auth/login`
2. **Servicio genera:**
   - JWT access token (contiene userId, exp)
   - Session token único (UUID)
3. **Almacena sesión:**
   - MySQL: tabla `sessions` (persistencia)
   - Redis: key `session:{sessionToken}` con TTL (cache rápido)
4. **Usuario recibe ambos tokens**
5. **Para requests protegidos:**
   - Enviar `Authorization: Bearer {accessToken}`
   - Enviar `X-Session-Token: {sessionToken}`

### Validación de Tokens

Otros servicios pueden validar tokens de dos formas:

**Opción 1: Validación local (JWT)**
- Verificar firma del JWT con la clave pública/secreta
- Verificar expiración
- Extraer userId del payload

**Opción 2: Validación remota (recomendado)**
- Llamar a `GET /auth/validate` con ambos headers
- Obtener confirmación y datos del usuario
- Cachear resultado por 1-5 minutos

---

## 🔑 Tokens

### Access Token (JWT)

**Payload:**
```json
{
  "userId": 1,
  "username": "juanperez",
  "iat": 1700481600,
  "exp": 1700488800
}
```

**Algoritmo:** HS256 (HMAC SHA-256)  
**Expiración:** 2 horas (configurable con `JWT_EXPIRES_IN`)

### Session Token

- UUID v4 aleatorio
- 32 caracteres
- Almacenado en MySQL + Redis
- Se invalida en logout
- Expira junto con el JWT

---

## 🗂️ Estructura de Archivos

```
auth-service/
├── prisma/
│   ├── schema.prisma          # Modelos Prisma
│   └── migrations/            # Migraciones SQL
├── src/
│   ├── index.js              # Punto de entrada
│   ├── controllers/
│   │   └── auth.controller.js    # Lógica de negocio
│   ├── routes/
│   │   └── auth.routes.js        # Definición de rutas
│   ├── middleware/
│   │   ├── auth.middleware.js    # Validación de tokens
│   │   └── validation.middleware.js  # Validación de inputs
│   ├── services/
│   │   ├── jwt.service.js        # Generación/validación JWT
│   │   ├── session.service.js    # Gestión de sesiones
│   │   └── redis.service.js      # Cliente Redis
│   └── utils/
│       ├── bcrypt.js             # Hash de contraseñas
│       └── errors.js             # Clases de error
├── Dockerfile
├── package.json
└── README.md
```

---

## 🛠️ Implementación Sugerida

### Controllers (`src/controllers/auth.controller.js`)

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('../services/jwt.service');
const sessionService = require('../services/session.service');

const prisma = new PrismaClient();

// TODO: Implementar
exports.register = async (req, res) => {
  // 1. Validar input
  // 2. Verificar si usuario existe
  // 3. Hash de password
  // 4. Crear usuario en DB
  // 5. Retornar usuario (sin password)
};

exports.login = async (req, res) => {
  // 1. Buscar usuario por username
  // 2. Verificar password con bcrypt
  // 3. Generar JWT
  // 4. Crear session en DB y Redis
  // 5. Retornar tokens y user
};

exports.logout = async (req, res) => {
  // 1. Obtener sessionToken del header
  // 2. Eliminar de Redis
  // 3. Eliminar de MySQL
  // 4. Retornar success
};

exports.validate = async (req, res) => {
  // 1. Verificar JWT
  // 2. Buscar session en Redis (rápido)
  // 3. Si no existe en Redis, buscar en MySQL
  // 4. Retornar user data si válido
};
```

### Middleware (`src/middleware/auth.middleware.js`)

```javascript
const jwt = require('jsonwebtoken');
const sessionService = require('../services/session.service');

exports.authenticate = async (req, res, next) => {
  try {
    // 1. Extraer token del header Authorization
    const token = req.headers.authorization?.split(' ')[1];
    const sessionToken = req.headers['x-session-token'];
    
    if (!token || !sessionToken) {
      return res.status(401).json({ error: 'Missing tokens' });
    }
    
    // 2. Verificar JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Validar session
    const session = await sessionService.validate(sessionToken);
    if (!session || session.userId !== decoded.userId) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // 4. Agregar user a request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## 🚀 Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```env
DATABASE_URL=mysql://potai:potaipass@auth-db:3306/potai_auth
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=2h
PORT=3001
```

### 3. Generar Prisma Client
```bash
npx prisma generate
```

### 4. Ejecutar migraciones
```bash
npx prisma migrate dev
```

### 5. Iniciar servicio
```bash
npm run dev
```

---

## 🧪 Testing

### Ejemplos con cURL

**Registro:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**Validar (con tokens obtenidos del login):**
```bash
curl -X GET http://localhost:3001/auth/validate \
  -H "Authorization: Bearer <accessToken>" \
  -H "X-Session-Token: <sessionToken>"
```

---

## 📊 Redis Schema

### Keys

- `session:{sessionToken}` → User data (JSON)
  - TTL: 2 horas
  - Value: `{ userId, username, email, expiresAt }`

### Ejemplo
```redis
SET session:abc123def456 '{"userId":1,"username":"juan","email":"juan@example.com"}' EX 7200
GET session:abc123def456
DEL session:abc123def456
```

---

## 🔄 Comunicación con Otros Servicios

Otros servicios pueden validar tokens haciendo una petición HTTP:

```javascript
// Ejemplo en Plants Service
const axios = require('axios');

async function validateToken(accessToken, sessionToken) {
  try {
    const response = await axios.get('http://auth-service:3001/auth/validate', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Session-Token': sessionToken
      }
    });
    return response.data.user;
  } catch (error) {
    throw new Error('Invalid authentication');
  }
}
```

---

## ⚠️ Seguridad

- ✅ Passwords hasheadas con bcrypt (salt rounds: 10)
- ✅ JWT firmados con HS256
- ✅ Sessions con expiración automática
- ✅ Rate limiting (TODO: implementar)
- ✅ Helmet para headers de seguridad
- ✅ CORS configurado
- ✅ Validación de inputs con express-validator
- ⚠️ En producción: usar HTTPS
- ⚠️ En producción: usar RS256 (JWT con clave pública/privada)

---

## 📈 Métricas y Logs

Eventos a loggear:
- ✅ User registered
- ✅ Login successful
- ✅ Login failed (invalid credentials)
- ✅ Logout
- ✅ Token validation
- ❌ Token expired
- ❌ Invalid token

Formato de log:
```json
{
  "timestamp": "2025-11-20T10:30:00.000Z",
  "level": "info",
  "service": "auth-service",
  "event": "login_success",
  "userId": 1,
  "username": "juan"
}
```
