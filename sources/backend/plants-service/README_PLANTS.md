# 🌱 Plants Service - Documentation

## Overview

El **Plants Service** gestiona las plantas del sistema PotAI, su conexión con los microcontroladores ESP32, y el registro de datos de sensores (temperatura y humedad del suelo).

## Características Principales

### 🔌 Integración con ESP32
- Cada planta tiene un código único (`potCode`) que identifica su maceta/ESP32
- El ESP32 envía datos de sensores cada 24 horas
- Sistema de tracking de conexión (última conexión, estado conectado/desconectado)

### 📊 Gestión de Datos de Sensores
- Registro de temperatura y humedad del suelo
- Historial completo de lecturas
- Estadísticas por período (temperatura promedio, humedad promedio, etc.)
- Soporte para predicciones de ML (cantidad de agua a regar)

### 👤 Gestión de Plantas por Usuario
- CRUD completo de plantas
- Asociación con usuarios (vía autenticación del Gateway)
- Asociación opcional con especies
- Imágenes, notas, fecha de plantado

## Schema de Base de Datos

### Plant
```prisma
model Plant {
  id                 Int       @id @default(autoincrement())
  userId             Int       // ID del usuario propietario
  potCode            String    @unique // Código único del ESP32 (ej: "ESP32LT")
  name               String    // Nombre de la planta
  imageUrl           String?   // URL de imagen
  speciesId          Int?      // ID de especie (opcional)
  plantedAt          DateTime? // Fecha de plantado
  notes              String?   // Notas adicionales
  
  // Datos actuales de sensores
  temperature        Float?    // Última temperatura registrada
  soilMoisture       Float?    // Última humedad del suelo
  lastSensorUpdate   DateTime? // Última actualización de sensores
  
  // Estado de conexión ESP32
  isConnected        Boolean   // Está conectado actualmente
  lastConnectionAt   DateTime? // Última vez que se conectó
  
  createdAt          DateTime
  updatedAt          DateTime
  
  sensorReadings     SensorReading[] // Historial de lecturas
}
```

### SensorReading
```prisma
model SensorReading {
  id                 Int       @id @default(autoincrement())
  plantId            Int
  temperature        Float     // Temperatura en °C
  soilMoisture       Float     // Humedad del suelo en %
  prediction         Float?    // Predicción de ML (ml de agua)
  wasWatered         Boolean   // Si se regó la planta
  waterAmountMl      Float?    // Cantidad de agua usada
  recordedAt         DateTime  // Fecha y hora de registro
  
  plant              Plant
}
```

## API Endpoints

### 🔓 Públicos (Sin autenticación)

#### `PUT /sensor/:potCode`
Actualizar datos de sensores desde el ESP32

**Request Body:**
```json
{
  "temperatura": 25.5,
  "humedad": 45.2
}
```

**Response:**
```json
{
  "message": "Sensor data updated",
  "plant": {
    "id": 1,
    "name": "Mi Planta",
    "temperature": 25.5,
    "soilMoisture": 45.2
  },
  "prediccion": 0
}
```

**Ejemplo desde ESP32:**
```cpp
String serverUrl = "http://10.57.125.193:8080/plants/sensor/ESP32LT";
http.begin(serverUrl);
http.addHeader("Content-Type", "application/json");

StaticJsonDocument<200> doc;
doc["temperatura"] = temperatura;
doc["humedad"] = humedad;

String requestBody;
serializeJson(doc, requestBody);
int httpResponseCode = http.PUT(requestBody);
```

### 🔐 Protegidos (Requieren autenticación)

Todos los siguientes endpoints requieren que el usuario esté autenticado. El Gateway inyecta el header `x-user-id` después de validar el token.

#### `POST /`
Crear una nueva planta

**Request Body:**
```json
{
  "potCode": "ESP32LT",
  "name": "Monstera Deliciosa",
  "speciesId": 5,
  "plantedAt": "2025-01-15",
  "notes": "Ubicada en el balcón",
  "imageUrl": "http://localhost:8080/media/files/monstera-123.jpg"
}
```

**Response:**
```json
{
  "message": "Plant created successfully",
  "plant": {
    "id": 1,
    "userId": 1,
    "potCode": "ESP32LT",
    "name": "Monstera Deliciosa",
    "speciesId": 5,
    "imageUrl": "http://localhost:8080/media/files/monstera-123.jpg",
    "plantedAt": "2025-01-15T00:00:00.000Z",
    "notes": "Ubicada en el balcón",
    "temperature": null,
    "soilMoisture": null,
    "lastSensorUpdate": null,
    "isConnected": false,
    "lastConnectionAt": null,
    "createdAt": "2025-11-22T00:00:00.000Z",
    "updatedAt": "2025-11-22T00:00:00.000Z"
  }
}
```

#### `GET /`
Obtener todas las plantas del usuario autenticado

**Response:**
```json
{
  "count": 2,
  "plants": [
    {
      "id": 1,
      "potCode": "ESP32LT",
      "name": "Monstera Deliciosa",
      "temperature": 24.5,
      "soilMoisture": 45.2,
      "isConnected": true,
      "lastConnectionAt": "2025-11-22T00:30:00.000Z",
      "sensorReadings": [
        {
          "id": 15,
          "temperature": 24.5,
          "soilMoisture": 45.2,
          "recordedAt": "2025-11-22T00:30:00.000Z"
        }
      ]
    }
  ]
}
```

#### `GET /:id`
Obtener una planta específica

**Response:**
```json
{
  "plant": {
    "id": 1,
    "name": "Monstera Deliciosa",
    "potCode": "ESP32LT",
    "temperature": 24.5,
    "soilMoisture": 45.2,
    "sensorReadings": [
      // Últimas 10 lecturas
    ]
  }
}
```

#### `PUT /:id`
Actualizar una planta

**Request Body:**
```json
{
  "name": "Monstera - Sala",
  "notes": "Movida a la sala",
  "imageUrl": "http://localhost:8080/media/files/monstera-new.jpg"
}
```

#### `DELETE /:id`
Eliminar una planta

**Response:**
```json
{
  "message": "Plant deleted successfully",
  "plant": {
    "id": 1,
    "name": "Monstera Deliciosa"
  }
}
```

#### `GET /:id/history?limit=50`
Obtener historial de lecturas de sensores

**Query Parameters:**
- `limit`: Número máximo de lecturas (default: 50)

**Response:**
```json
{
  "count": 25,
  "readings": [
    {
      "id": 25,
      "plantId": 1,
      "temperature": 24.5,
      "soilMoisture": 45.2,
      "prediction": 150.5,
      "wasWatered": true,
      "waterAmountMl": 150.5,
      "recordedAt": "2025-11-22T00:30:00.000Z"
    }
  ]
}
```

#### `GET /:id/stats?days=7`
Obtener estadísticas de una planta

**Query Parameters:**
- `days`: Número de días para las estadísticas (default: 7)

**Response:**
```json
{
  "plant": {
    "id": 1,
    "name": "Monstera Deliciosa"
  },
  "period": "Last 7 days",
  "readingsCount": 7,
  "averageTemperature": 24.3,
  "averageSoilMoisture": 46.8,
  "totalWaterings": 2,
  "totalWaterUsed": 320
}
```

#### `GET /pot/:potCode`
Obtener planta por código de maceta

**Response:**
```json
{
  "plant": {
    "id": 1,
    "name": "Monstera Deliciosa",
    "potCode": "ESP32LT",
    "userId": 1
  }
}
```

#### `GET /health`
Health check

**Response:**
```json
{
  "status": "healthy",
  "service": "plants-service",
  "timestamp": "2025-11-22T00:00:00.000Z"
}
```

## Flujo de Trabajo

### 1. Usuario Añade Nueva Planta

```bash
# 1. Usuario se autentica
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user1",
    "password": "password123"
  }' \
  -c cookies.txt

# Response contiene accessToken

# 2. Usuario crea planta con código ESP32
curl -X POST http://localhost:8080/plants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "potCode": "ESP32LT",
    "name": "Mi Primera Planta",
    "notes": "Planta en el jardín"
  }'
```

### 2. ESP32 Envía Datos de Sensores

```cpp
// En el ESP32 (hardware.ino)
String codESP32 = "ESP32LT";
String serverUrl = "http://10.57.125.193:8080/plants/sensor/" + codESP32;

HTTPClient http;
http.begin(serverUrl);
http.addHeader("Content-Type", "application/json");

StaticJsonDocument<200> doc;
doc["temperatura"] = 25.5;
doc["humedad"] = 45.0;

String requestBody;
serializeJson(doc, requestBody);

int httpResponseCode = http.PUT(requestBody);

if (httpResponseCode == 200) {
  String response = http.getString();
  // Parsear predicción de ML
  StaticJsonDocument<300> resDoc;
  deserializeJson(resDoc, response);
  float prediccion = resDoc["prediccion"]; // ml de agua
}
```

### 3. Usuario Consulta Estado de su Planta

```bash
# Obtener todas las plantas
curl http://localhost:8080/plants \
  -H "Authorization: Bearer <accessToken>"

# Ver historial de sensores
curl http://localhost:8080/plants/1/history?limit=20 \
  -H "Authorization: Bearer <accessToken>"

# Ver estadísticas de la última semana
curl http://localhost:8080/plants/1/stats?days=7 \
  -H "Authorization: Bearer <accessToken>"
```

## Validaciones

### CreatePlant
- `potCode`: Requerido, string no vacío, máximo 50 caracteres, único
- `name`: Requerido, string no vacío, máximo 100 caracteres
- `speciesId`: Opcional, número entero positivo
- `plantedAt`: Opcional, fecha válida
- `notes`: Opcional, string
- `imageUrl`: Opcional, string, máximo 255 caracteres

### UpdatePlant
- Mismas validaciones que CreatePlant, pero todos los campos son opcionales
- No se puede cambiar `userId`
- No se pueden actualizar directamente los datos de sensores

### SensorData (ESP32)
- `temperatura`: Requerido, número entre -50 y 100 °C
- `humedad`: Requerido, número entre 0 y 100 %

## Estado de Conexión

El servicio mantiene el estado de conexión de cada ESP32:

- **isConnected**: `true` si la planta ha enviado datos en la última hora
- **lastConnectionAt**: Última vez que el ESP32 envió datos
- **lastSensorUpdate**: Última actualización de sensores

Se puede implementar un job que marque como desconectadas las plantas sin actividad:

```javascript
// Ejecutar cada hora
await plantsService.checkConnectionStatus();
```

## Integración con Otros Servicios

### Gateway
- Valida autenticación con Auth Service
- Inyecta `x-user-id` en headers
- Proxy de requests a Plants Service

### Media Service
- Almacena imágenes de plantas
- Las URLs se guardan en `plant.imageUrl`

### ML Service (Próximamente)
- Recibe datos de sensores
- Retorna predicción de cantidad de agua
- Se actualiza en `sensorReading.prediction`

### Species Service (Próximamente)
- Información de especies de plantas
- Referenciado en `plant.speciesId`

## Variables de Entorno

```env
# Database
DATABASE_URL="mysql://plants_user:plants_password@plants-db:3306/potai_plants"
SHADOW_DATABASE_URL="mysql://plants_user:plants_password@plants-db:3306/potai_plants_shadow"

# Server
PORT=3002
NODE_ENV=development

# CORS
CORS_ORIGIN=*
```

## Testing

### Test Manual con cURL

```bash
# 1. Health Check
curl http://localhost:8080/plants/health

# 2. Crear planta (requiere auth)
curl -X POST http://localhost:8080/plants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "potCode": "ESP32TEST",
    "name": "Planta de Prueba"
  }'

# 3. Simular ESP32 enviando datos
curl -X PUT http://localhost:8080/plants/sensor/ESP32TEST \
  -H "Content-Type: application/json" \
  -d '{
    "temperatura": 22.5,
    "humedad": 50.0
  }'

# 4. Ver plantas del usuario
curl http://localhost:8080/plants \
  -H "Authorization: Bearer <token>"

# 5. Ver historial de sensores
curl http://localhost:8080/plants/1/history \
  -H "Authorization: Bearer <token>"
```

## Errores Comunes

### 400 Bad Request
- Faltan campos requeridos (`potCode`, `name`, `temperatura`, `humedad`)
- Valores fuera de rango (temperatura < -50 o > 100, humedad < 0 o > 100)
- Formato de datos incorrecto

### 401 Unauthorized
- Falta header de autenticación
- Token inválido o expirado
- Falta header `x-user-id` (problema del Gateway)

### 404 Not Found
- Planta no encontrada
- Código de maceta no registrado
- ID de planta inválido

### 409 Conflict
- El `potCode` ya está registrado para otra planta
- Violación de constraint único

## Próximas Mejoras

- [ ] Integración completa con ML Service para predicciones de riego
- [ ] Sistema de alertas (planta desconectada, baja humedad, etc.)
- [ ] Gráficas de tendencias de temperatura/humedad
- [ ] Exportar datos históricos a CSV/JSON
- [ ] Configuración de umbrales de alerta por planta
- [ ] Modo manual de riego (forzar riego desde la app)
- [ ] Múltiples sensores por planta (luz, pH, etc.)

---

**Versión:** 2.0.0  
**Última actualización:** 22 de Noviembre de 2025  
**Estado:** ✅ PRODUCTION READY
