# IoT Service

Servicio de ingesta y almacenamiento de datos de sensores IoT (ESP32) y control de riego automático.

## Puerto
- **3004**
- **Database Port:** 3310

## Base de Datos: potai_iot

### Tablas

#### ambiental_conditions
```sql
CREATE TABLE ambiental_conditions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  plant_id INT NOT NULL,
  temperature_celsius DECIMAL(5,2),
  humidity_percent DECIMAL(5,2),
  moisture_percent DECIMAL(5,2),
  light_lux DECIMAL(10,2),
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_plant_id (plant_id),
  INDEX idx_recorded_at (recorded_at)
);
```

#### watering_logs
```sql
CREATE TABLE watering_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ambiental_conditions_id INT NOT NULL,
  watered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  amount_ml INT,
  FOREIGN KEY (ambiental_conditions_id) REFERENCES ambiental_conditions(id) ON DELETE CASCADE,
  INDEX idx_watered_at (watered_at)
);
```

## Endpoints

### 1. Ingresar Datos de Sensores (ESP32)
```http
POST /sensor-data
Content-Type: application/json
X-IoT-API-Key: <api_key>

Body:
{
  "plantId": 5,
  "temperature": 25.5,
  "humidity": 60.0,
  "moisture": 45.2,
  "light": 1200.0
}
```

**Response:**
```json
{
  "id": 123,
  "plantId": 5,
  "temperatureCelsius": 25.5,
  "humidityPercent": 60.0,
  "moisturePercent": 45.2,
  "lightLux": 1200.0,
  "recordedAt": "2024-01-15T10:30:00.000Z",
  "wateringDecision": {
    "needsWatering": false,
    "amountMl": 0
  }
}
```

### 2. Obtener Condiciones de una Planta
```http
GET /plants/:plantId/conditions?limit=100
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 123,
    "plantId": 5,
    "temperatureCelsius": 25.5,
    "humidityPercent": 60.0,
    "moisturePercent": 45.2,
    "lightLux": 1200.0,
    "recordedAt": "2024-01-15T10:30:00.000Z",
    "wateringLogs": [
      {
        "id": 45,
        "wateredAt": "2024-01-15T10:35:00.000Z",
        "amountMl": 200
      }
    ]
  }
]
```

### 3. Registrar Riego Manual
```http
POST /watering
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "ambientalConditionsId": 123,
  "amountMl": 250
}
```

**Response:**
```json
{
  "id": 45,
  "ambientalConditionsId": 123,
  "wateredAt": "2024-01-15T10:35:00.000Z",
  "amountMl": 250
}
```

## Flujo de Riego Automático

### 1. ESP32 envía datos de sensores
```javascript
// Código Arduino (ESP32)
String json = "{\"plantId\": 5, \"temperature\": " + String(temp) + 
              ", \"humidity\": " + String(hum) + 
              ", \"moisture\": " + String(moisture) + 
              ", \"light\": " + String(light) + "}";

http.begin("http://gateway:8080/iot/sensor-data");
http.addHeader("Content-Type", "application/json");
http.addHeader("X-IoT-API-Key", IOT_API_KEY);
int httpCode = http.POST(json);
```

### 2. IoT Service consulta ML Service
```javascript
const decidedWatering = async (plantId, sensorData) => {
  // Obtener especie de la planta
  const plant = await axios.get(`http://plants-service:3002/${plantId}`);
  
  // Consultar modelo ML
  const mlResponse = await axios.post('http://ml-service:5000/predict/irrigation', {
    speciesId: plant.data.speciesId,
    moisture: sensorData.moisture,
    temperature: sensorData.temperature,
    humidity: sensorData.humidity,
    light: sensorData.light
  });
  
  return {
    needsWatering: mlResponse.data.needsWatering,
    amountMl: mlResponse.data.waterAmountMl
  };
};
```

### 3. Si necesita riego, registrar y notificar ESP32
```javascript
if (decision.needsWatering) {
  // Crear registro de riego
  await prisma.wateringLog.create({
    data: {
      ambientalConditionsId: condition.id,
      amountMl: decision.amountMl
    }
  });
  
  // Responder a ESP32 con comando de riego
  return {
    ...condition,
    wateringDecision: {
      needsWatering: true,
      amountMl: decision.amountMl
    }
  };
}
```

### 4. ESP32 activa bomba de agua
```cpp
if (response.wateringDecision.needsWatering) {
  int amountMl = response.wateringDecision.amountMl;
  activateWaterPump(amountMl);
}
```

## Comunicación entre Servicios

### IoT Service → Plants Service
```javascript
// Obtener información de la planta
const plant = await axios.get(`http://plants-service:3002/${plantId}`, {
  headers: { 'Authorization': `Bearer ${serviceToken}` }
});

const speciesId = plant.data.speciesId;
```

### IoT Service → ML Service
```javascript
// Consultar modelo de riego
const mlResponse = await axios.post('http://ml-service:5000/predict/irrigation', {
  speciesId: speciesId,
  moisture: sensorData.moisture,
  temperature: sensorData.temperature,
  humidity: sensorData.humidity,
  light: sensorData.light
});
```

## Seguridad

### Autenticación de ESP32
Usar header `X-IoT-API-Key` para autenticar dispositivos:
```javascript
const validateIoTKey = (req, res, next) => {
  const apiKey = req.headers['x-iot-api-key'];
  
  if (apiKey !== process.env.IOT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};
```

### Autenticación de Usuario
Endpoints de consulta requieren token JWT del Auth Service.

## Prisma Schema
```prisma
model AmbientalCondition {
  id                   Int             @id @default(autoincrement())
  plantId              Int             @map("plant_id")
  temperatureCelsius   Decimal?        @map("temperature_celsius") @db.Decimal(5, 2)
  humidityPercent      Decimal?        @map("humidity_percent") @db.Decimal(5, 2)
  moisturePercent      Decimal?        @map("moisture_percent") @db.Decimal(5, 2)
  lightLux             Decimal?        @map("light_lux") @db.Decimal(10, 2)
  recordedAt           DateTime        @default(now()) @map("recorded_at")
  wateringLogs         WateringLog[]

  @@index([plantId])
  @@index([recordedAt])
  @@map("ambiental_conditions")
}

model WateringLog {
  id                      Int                 @id @default(autoincrement())
  ambientalConditionsId   Int                 @map("ambiental_conditions_id")
  wateredAt               DateTime            @default(now()) @map("watered_at")
  amountMl                Int?                @map("amount_ml")
  ambientalCondition      AmbientalCondition  @relation(fields: [ambientalConditionsId], references: [id], onDelete: Cascade)

  @@index([wateredAt])
  @@map("watering_logs")
}
```

## Variables de Entorno
```env
DATABASE_URL="mysql://root:password@iot-db:3306/potai_iot"
PORT=3004
IOT_API_KEY=your-secure-iot-api-key
PLANTS_SERVICE_URL=http://plants-service:3002
ML_SERVICE_URL=http://ml-service:5000
```
