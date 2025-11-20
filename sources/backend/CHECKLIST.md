# ✅ CHECKLIST DE IMPLEMENTACIÓN

## 🎯 Estado Actual del Proyecto

### ✅ COMPLETADO (Infraestructura)

- [x] Docker Compose con 9 servicios + 5 bases de datos + Redis
- [x] Nginx configurado para frontend
- [x] API Gateway con proxy a todos los servicios
- [x] Prisma schemas para 5 servicios (User, Session, Plant, Pot, AmbientalCondition, WateringLog, Species)
- [x] Dockerfiles para todos los servicios
- [x] package.json con dependencias para cada servicio Node.js
- [x] requirements.txt para ML Service (Flask/Python)
- [x] .env.example con todas las variables
- [x] Estructura de carpetas completa
- [x] README principal con documentación de arquitectura
- [x] README individual para cada servicio con endpoints documentados
- [x] COMANDOS.md con 50+ comandos útiles
- [x] ARQUITECTURA.md con diagramas y flujos
- [x] EJEMPLOS.md con código de referencia
- [x] RESUMEN.md ejecutivo
- [x] Health checks configurados en todos los servicios
- [x] Seed script para Species (8 especies)

### ⚠️ PENDIENTE DE IMPLEMENTAR (Tu trabajo como desarrollador)

## 📝 CHECKLIST POR SERVICIO

### 1. Auth Service
**Ubicación**: `sources/backend/auth-service/src/`

- [ ] **Estructura de carpetas**
  - [ ] Crear carpeta `routes/`
  - [ ] Crear carpeta `controllers/`
  - [ ] Crear carpeta `middleware/`

- [ ] **Middleware** (`middleware/`)
  - [ ] `auth.middleware.js` - Validación de JWT
  - [ ] `validation.middleware.js` - Express-validator para inputs

- [ ] **Controllers** (`controllers/`)
  - [ ] `auth.controller.js`
    - [ ] `register()` - Hash password con bcrypt, crear usuario, crear sesión, generar JWT
    - [ ] `login()` - Validar password, crear sesión, generar JWT
    - [ ] `logout()` - Invalidar sesión en DB y Redis
    - [ ] `me()` - Obtener info del usuario actual
    - [ ] `validate()` - Validar token (para otros servicios)
    - [ ] `refresh()` - Renovar token JWT

- [ ] **Routes** (`routes/`)
  - [ ] `auth.routes.js`
    - [ ] POST /register (con validación)
    - [ ] POST /login (con validación)
    - [ ] POST /logout (con auth middleware)
    - [ ] GET /me (con auth middleware)
    - [ ] POST /validate (sin auth)
    - [ ] POST /refresh (con auth middleware)

- [ ] **Integración Redis**
  - [ ] Configurar cliente Redis
  - [ ] Guardar sesiones en Redis al crear
  - [ ] Validar sesiones desde Redis
  - [ ] Eliminar sesiones de Redis al logout

- [ ] **Migraciones Prisma**
  - [ ] `npx prisma migrate dev --name init`

---

### 2. Plants Service
**Ubicación**: `sources/backend/plants-service/src/`

- [ ] **Estructura de carpetas**
  - [ ] Crear carpeta `routes/`
  - [ ] Crear carpeta `controllers/`
  - [ ] Crear carpeta `middleware/`
  - [ ] Crear carpeta `utils/`

- [ ] **Middleware** (`middleware/`)
  - [ ] `auth.middleware.js` - Validar token con Auth Service

- [ ] **Utils** (`utils/`)
  - [ ] `services.js` - Funciones para llamar a otros servicios (Auth, Media, Species, Pots, IoT)

- [ ] **Controllers** (`controllers/`)
  - [ ] `plants.controller.js`
    - [ ] `create()` - Validar con Auth, Pots, Species; subir imagen a Media; crear planta
    - [ ] `getAll()` - Obtener todas las plantas del usuario
    - [ ] `getById()` - Obtener planta por ID (validar ownership)
    - [ ] `update()` - Actualizar planta (validar ownership)
    - [ ] `delete()` - Eliminar planta (validar ownership)
    - [ ] `getByPot()` - Obtener plantas de una maceta

- [ ] **Routes** (`routes/`)
  - [ ] `plants.routes.js`
    - [ ] POST / (con auth, multer para imagen opcional)
    - [ ] GET / (con auth)
    - [ ] GET /:id (con auth)
    - [ ] PUT /:id (con auth, multer para imagen opcional)
    - [ ] DELETE /:id (con auth)
    - [ ] GET /pot/:potId (con auth)

- [ ] **Migraciones Prisma**
  - [ ] `npx prisma migrate dev --name init`

---

### 3. Pots Service
**Ubicación**: `sources/backend/pots-service/src/`

- [ ] **Estructura de carpetas**
  - [ ] Crear carpeta `routes/`
  - [ ] Crear carpeta `controllers/`
  - [ ] Crear carpeta `middleware/`

- [ ] **Middleware** (`middleware/`)
  - [ ] `auth.middleware.js` - Validar token con Auth Service

- [ ] **Controllers** (`controllers/`)
  - [ ] `pots.controller.js`
    - [ ] `create()` - Crear maceta para usuario
    - [ ] `getAll()` - Obtener macetas del usuario
    - [ ] `getById()` - Obtener maceta por ID (validar ownership)
    - [ ] `getOrCreate()` - Buscar por label o crear nueva
    - [ ] `update()` - Actualizar maceta (validar ownership)
    - [ ] `delete()` - Eliminar maceta (verificar que no tenga plantas)

- [ ] **Routes** (`routes/`)
  - [ ] `pots.routes.js`
    - [ ] POST / (con auth)
    - [ ] GET / (con auth)
    - [ ] GET /:id (con auth)
    - [ ] POST /get-or-create (con auth)
    - [ ] PUT /:id (con auth)
    - [ ] DELETE /:id (con auth)

- [ ] **Migraciones Prisma**
  - [ ] `npx prisma migrate dev --name init`

---

### 4. IoT Service
**Ubicación**: `sources/backend/iot-service/src/`

- [ ] **Estructura de carpetas**
  - [ ] Crear carpeta `routes/`
  - [ ] Crear carpeta `controllers/`
  - [ ] Crear carpeta `middleware/`
  - [ ] Crear carpeta `utils/`

- [ ] **Middleware** (`middleware/`)
  - [ ] `auth.middleware.js` - Validar token con Auth Service
  - [ ] `iot-auth.middleware.js` - Validar X-IoT-API-Key para ESP32

- [ ] **Utils** (`utils/`)
  - [ ] `services.js` - Llamadas a Plants Service y ML Service

- [ ] **Controllers** (`controllers/`)
  - [ ] `iot.controller.js`
    - [ ] `ingestSensorData()` - Guardar datos de sensores, consultar ML, decidir riego, crear log si necesario
    - [ ] `getConditions()` - Obtener condiciones ambientales de una planta
    - [ ] `manualWatering()` - Registrar riego manual

- [ ] **Routes** (`routes/`)
  - [ ] `iot.routes.js`
    - [ ] POST /sensor-data (con iot-auth middleware)
    - [ ] GET /plants/:plantId/conditions (con auth)
    - [ ] POST /watering (con auth)

- [ ] **Lógica de Riego Automático**
  - [ ] Obtener datos de planta (Plants Service)
  - [ ] Consultar modelo ML (ML Service /predict/irrigation)
  - [ ] Crear watering log si needsWatering === true
  - [ ] Retornar decisión a ESP32

- [ ] **Migraciones Prisma**
  - [ ] `npx prisma migrate dev --name init`

---

### 5. Media Service
**Ubicación**: `sources/backend/media-service/src/`

- [ ] **Estructura de carpetas**
  - [ ] Crear carpeta `routes/`
  - [ ] Crear carpeta `controllers/`
  - [ ] Verificar carpeta `uploads/` existe

- [ ] **Controllers** (`controllers/`)
  - [ ] `upload.controller.js`
    - [ ] `uploadImage()` - Subir imagen con multer, retornar URL

- [ ] **Routes** (`routes/`)
  - [ ] `upload.routes.js`
    - [ ] POST /upload (con multer middleware)
    - [ ] Configurar multer: diskStorage, 5MB limit, jpg/png/gif filter

- [ ] **No requiere Prisma** (sin base de datos)

---

### 6. Species Service
**Ubicación**: `sources/backend/species-service/src/`

- [ ] **Estructura de carpetas**
  - [ ] Crear carpeta `routes/`
  - [ ] Crear carpeta `controllers/`

- [ ] **Controllers** (`controllers/`)
  - [ ] `species.controller.js`
    - [ ] `create()` - Crear nueva especie (admin)
    - [ ] `getAll()` - Obtener todas las especies
    - [ ] `getById()` - Obtener especie por ID
    - [ ] `search()` - Buscar especies por nombre
    - [ ] `update()` - Actualizar especie (admin)

- [ ] **Routes** (`routes/`)
  - [ ] `species.routes.js`
    - [ ] POST / (opcional: solo admin)
    - [ ] GET /
    - [ ] GET /:id
    - [ ] GET /search?q=query
    - [ ] PUT /:id (opcional: solo admin)

- [ ] **Seed**
  - [ ] ✅ Ya existe: `src/seed.js` con 8 especies
  - [ ] Ejecutar: `npm run seed`

- [ ] **Migraciones Prisma**
  - [ ] `npx prisma migrate dev --name init`

---

### 7. ML Service
**Ubicación**: `sources/backend/ml-service/`

- [ ] **Modelos**
  - [ ] Copiar `model-recognition.h5` a `models/`
  - [ ] Copiar `modelo_riego_numerico.pkl` a `models/`

- [ ] **Actualizar app.py**
  - [ ] Cargar modelo de reconocimiento con TensorFlow
  - [ ] Cargar modelo de riego con joblib
  - [ ] Implementar `/predict/recognition`
    - [ ] Recibir imagen (multipart/form-data)
    - [ ] Preprocesar: resize (224x224), normalize
    - [ ] Predecir con modelo
    - [ ] Retornar especie y confidence
  - [ ] Implementar `/predict/irrigation`
    - [ ] Recibir: speciesId, moisture, temperature, humidity, light
    - [ ] Normalizar features
    - [ ] Predecir con modelo
    - [ ] Calcular cantidad de agua
    - [ ] Retornar needsWatering, waterAmountMl

- [ ] **Verificar SPECIES_MAP**
  - [ ] Debe coincidir con el orden del entrenamiento del modelo

---

### 8. Gateway
**Ubicación**: `sources/backend/gateway/src/`

- [x] ✅ Ya implementado completamente en `index.js`
  - [x] Proxy a todos los servicios
  - [x] Rate limiting
  - [x] CORS y Helmet
  - [x] Health check
  - [x] Error handling

---

## 🗄️ BASE DE DATOS

### Migraciones Prisma

Ejecutar en cada servicio con Prisma:

```bash
# Auth Service
docker-compose exec auth-service npx prisma migrate deploy

# Plants Service
docker-compose exec plants-service npx prisma migrate deploy

# Pots Service
docker-compose exec pots-service npx prisma migrate deploy

# IoT Service
docker-compose exec iot-service npx prisma migrate deploy

# Species Service
docker-compose exec species-service npx prisma migrate deploy
```

### Seeds

```bash
# Species (8 especies iniciales)
docker-compose exec species-service npm run seed
```

---

## 🎨 FRONTEND

**Ubicación**: `sources/frontend/`

- [ ] **Conectar a API Gateway**
  - [ ] Cambiar todas las URLs a `http://localhost:8080`
  - [ ] Actualizar `js/api.js` con base URL del Gateway

- [ ] **Autenticación**
  - [ ] Login/Register forms en `login.html` y `register.html`
  - [ ] Guardar JWT en localStorage
  - [ ] Agregar header `Authorization: Bearer <token>` a todas las requests
  - [ ] Redirect a login si token inválido

- [ ] **Páginas**
  - [ ] `index.html` - Dashboard con resumen
  - [ ] `plantas.html` - Lista de plantas
  - [ ] `petplant.html` - Detalle de planta con gráficos de sensores
  - [ ] `contenido.html` - Catálogo de especies

- [ ] **Funcionalidades**
  - [ ] Crear planta con upload de imagen
  - [ ] Ver lista de plantas del usuario
  - [ ] Ver datos de sensores en tiempo real
  - [ ] Gráficos de temperatura, humedad, moisture
  - [ ] Historial de riegos

---

## 🤖 HARDWARE (ESP32)

**Ubicación**: `sources/hardware/hardware.ino`

- [ ] **Configuración WiFi**
  - [ ] SSID y password
  - [ ] Conectar a red local

- [ ] **Sensores**
  - [ ] DHT11 para temperatura y humedad
  - [ ] Sensor de humedad de suelo
  - [ ] Sensor de luz (opcional)

- [ ] **Envío de Datos**
  - [ ] POST a `http://gateway:8080/iot/sensor-data`
  - [ ] Header `X-IoT-API-Key: tu_clave`
  - [ ] Body JSON con: plantId, temperature, humidity, moisture, light
  - [ ] Envío cada 15 minutos

- [ ] **Riego Automático**
  - [ ] Leer respuesta del servidor
  - [ ] Si `needsWatering === true`, activar bomba
  - [ ] Bombear `waterAmountMl` mililitros
  - [ ] Apagar bomba

- [ ] **Indicadores**
  - [ ] LED para estado de conexión
  - [ ] LED para estado de riego
  - [ ] Serial monitor para debugging

---

## 🧪 TESTING

### Tests Básicos

- [ ] **Auth Service**
  - [ ] Register exitoso
  - [ ] Login exitoso
  - [ ] Token válido
  - [ ] Logout exitoso

- [ ] **Plants Service**
  - [ ] Crear planta
  - [ ] Listar plantas
  - [ ] Actualizar planta
  - [ ] Eliminar planta

- [ ] **IoT Service**
  - [ ] Ingresar datos de sensores
  - [ ] Obtener condiciones
  - [ ] Riego automático

- [ ] **ML Service**
  - [ ] Reconocimiento de imagen
  - [ ] Predicción de riego

### Tests de Integración

- [ ] Flujo completo: Register → Login → Crear Planta → Ver Planta
- [ ] Flujo ESP32: Enviar datos → Recibir decisión → Activar riego
- [ ] Flujo reconocimiento: Upload imagen → Identificar especie → Crear planta

---

## 📚 DOCUMENTACIÓN

- [x] ✅ README.md principal
- [x] ✅ READMEs por servicio
- [x] ✅ COMANDOS.md
- [x] ✅ ARQUITECTURA.md
- [x] ✅ EJEMPLOS.md
- [x] ✅ RESUMEN.md
- [x] ✅ CHECKLIST.md (este archivo)

- [ ] Postman Collection (opcional)
- [ ] Swagger/OpenAPI (opcional)
- [ ] Video demo (opcional)

---

## 🚀 DEPLOYMENT (Futuro)

- [ ] Cambiar CMD en Dockerfiles de `npm run dev` a `npm start`
- [ ] Cambiar contraseñas de bases de datos en `.env`
- [ ] Generar JWT_SECRET seguro aleatorio
- [ ] Configurar CORS restrictivo (solo dominios permitidos)
- [ ] Configurar certificados SSL
- [ ] Configurar dominio
- [ ] CI/CD con GitHub Actions
- [ ] Monitoreo con Prometheus + Grafana
- [ ] Logs centralizados con ELK Stack
- [ ] Backups automáticos de bases de datos

---

## 🎯 PRIORIDADES

### ⭐ ALTA (Empezar por aquí)

1. **Auth Service** - Base para todo
2. **Species Service** - Simple, sin dependencias
3. **Pots Service** - Simple, necesario para Plants
4. **Media Service** - Necesario para Plants
5. **Plants Service** - Core del sistema

### ⭐⭐ MEDIA

6. **ML Service** - Para riego automático
7. **IoT Service** - Integra ML y Plants
8. **Frontend básico** - Login, crear plantas, ver lista

### ⭐⭐⭐ BAJA (Mejoras)

9. **Frontend avanzado** - Gráficos, dashboard
10. **ESP32** - Hardware físico
11. **Tests unitarios**
12. **Tests de integración**

---

## 📊 PROGRESO GENERAL

### Infraestructura
- ✅ 100% - Docker, Compose, Schemas, Configs

### Backend (Controllers/Routes)
- ⬜ 0% - Implementación pendiente

### ML Service
- ⬜ 0% - Cargar modelos, implementar predicciones

### Frontend
- ⬜ 0% - Conectar a Gateway

### Hardware
- ⬜ 0% - Programar ESP32

---

**Todo listo para empezar a codear! 🎉**

Comienza por Auth Service, luego Species, Pots, Media, Plants, IoT, ML y Frontend en ese orden.

Usa los ejemplos en `EJEMPLOS.md` como referencia.
