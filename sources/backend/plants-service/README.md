# Plants Service

Servicio de gestión de plantas para PotAI.

## 🎯 Responsabilidades

- CRUD de plantas
- Asociación planta-macetero-especie
- Consulta de plantas por usuario
- Almacenamiento de imágenes (delegado a Media Service)
- Obtención de datos de especies (delegado a Species Service)

## 🗄️ Modelo de Datos

```prisma
model Plant {
  id          Int       @id @default(autoincrement())
  userId      Int       
  potId       Int?      
  name        String    
  imageUrl    String?   
  speciesId   Int?      
  plantedAt   DateTime? 
  notes       String?   
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

## 📡 API Endpoints

### Base URL: `http://localhost:3002`

---

### 1. Crear Planta

**POST** `/plants`

**Headers:**
```
Authorization: Bearer <accessToken>
X-Session-Token: <sessionToken>
Content-Type: multipart/form-data
```

**Form Data:**
```
name: "Mi Rosa"
potLabel: "ESP32-001"
speciesName: "rosachina"
image: [file]
plantedAt: "2025-11-20" (opcional)
notes: "Necesita mucho sol" (opcional)
```

**Response 201:**
```json
{
  "plant": {
    "id": 1,
    "userId": 1,
    "potId": 5,
    "name": "Mi Rosa",
    "imageUrl": "http://media-service:3005/uploads/plant-123456.jpg",
    "speciesId": 8,
    "plantedAt": "2025-11-20",
    "notes": "Necesita mucho sol",
    "createdAt": "2025-11-20T10:30:00.000Z",
    "updatedAt": "2025-11-20T10:30:00.000Z"
  },
  "pot": {
    "id": 5,
    "label": "ESP32-001",
    "created": false
  },
  "species": {
    "id": 8,
    "commonName": "Rosa China",
    "scientificName": "Hibiscus rosa-sinensis"
  }
}
```

**Flujo:**
1. Validar autenticación (Auth Service)
2. Subir imagen (Media Service) → obtener imageUrl
3. Buscar/crear macetero por label (Pots Service) → obtener potId
4. Buscar especie por nombre (Species Service) → obtener speciesId
5. Crear planta en DB
6. Retornar planta completa con datos relacionados

---

### 2. Obtener Todas las Plantas del Usuario

**GET** `/plants`

**Headers:**
```
Authorization: Bearer <accessToken>
X-Session-Token: <sessionToken>
```

**Query Parameters:**
- `limit` (opcional): número de resultados (default: 50)
- `offset` (opcional): paginación (default: 0)

**Response 200:**
```json
{
  "plants": [
    {
      "id": 1,
      "userId": 1,
      "potId": 5,
      "name": "Mi Rosa",
      "imageUrl": "http://media-service:3005/uploads/plant-123456.jpg",
      "speciesId": 8,
      "plantedAt": "2025-11-20",
      "notes": "Necesita mucho sol",
      "createdAt": "2025-11-20T10:30:00.000Z",
      "updatedAt": "2025-11-20T10:30:00.000Z",
      "pot": {
        "id": 5,
        "label": "ESP32-001"
      },
      "species": {
        "id": 8,
        "commonName": "Rosa China",
        "scientificName": "Hibiscus rosa-sinensis"
      }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

### 3. Obtener Planta por ID

**GET** `/plants/:id`

**Headers:**
```
Authorization: Bearer <accessToken>
X-Session-Token: <sessionToken>
```

**Response 200:**
```json
{
  "plant": {
    "id": 1,
    "userId": 1,
    "potId": 5,
    "name": "Mi Rosa",
    "imageUrl": "http://media-service:3005/uploads/plant-123456.jpg",
    "speciesId": 8,
    "plantedAt": "2025-11-20",
    "notes": "Necesita mucho sol",
    "createdAt": "2025-11-20T10:30:00.000Z",
    "updatedAt": "2025-11-20T10:30:00.000Z",
    "pot": {
      "id": 5,
      "label": "ESP32-001",
      "userId": 1
    },
    "species": {
      "id": 8,
      "commonName": "Rosa China",
      "scientificName": "Hibiscus rosa-sinensis",
      "waterRequirements": "Moderado",
      "lightRequirements": "Sol directo",
      "humidityRequirements": "Media"
    },
    "environmentalConditions": [
      {
        "temperature": 25.5,
        "humidity": 60.0,
        "moisture": 45.0,
        "light": 1200.0,
        "recordedAt": "2025-11-20T09:00:00.000Z"
      }
    ],
    "wateringLogs": [
      {
        "wateredAt": "2025-11-19T08:00:00.000Z",
        "amountMl": 250
      }
    ]
  }
}
```

**Nota:** Los datos de `environmentalConditions` y `wateringLogs` se obtienen del IoT Service.

---

### 4. Actualizar Planta

**PUT** `/plants/:id`

**Headers:**
```
Authorization: Bearer <accessToken>
X-Session-Token: <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Mi Rosa Actualizada",
  "notes": "Regar cada 2 días",
  "plantedAt": "2025-11-15"
}
```

**Response 200:**
```json
{
  "plant": {
    "id": 1,
    "userId": 1,
    "potId": 5,
    "name": "Mi Rosa Actualizada",
    "imageUrl": "http://media-service:3005/uploads/plant-123456.jpg",
    "speciesId": 8,
    "plantedAt": "2025-11-15",
    "notes": "Regar cada 2 días",
    "createdAt": "2025-11-20T10:30:00.000Z",
    "updatedAt": "2025-11-20T11:00:00.000Z"
  }
}
```

---

### 5. Eliminar Planta

**DELETE** `/plants/:id`

**Headers:**
```
Authorization: Bearer <accessToken>
X-Session-Token: <sessionToken>
```

**Response 200:**
```json
{
  "message": "Plant deleted successfully",
  "plantId": 1
}
```

---

### 6. Obtener Plantas por Macetero

**GET** `/plants/pot/:potId`

**Headers:**
```
Authorization: Bearer <accessToken>
X-Session-Token: <sessionToken>
```

**Response 200:**
```json
{
  "plants": [
    {
      "id": 1,
      "name": "Mi Rosa",
      "imageUrl": "...",
      "speciesId": 8
    }
  ],
  "pot": {
    "id": 5,
    "label": "ESP32-001",
    "userId": 1
  },
  "total": 1
}
```

---

## 🔄 Comunicación con Otros Servicios

### Con Auth Service
```javascript
// Validar token antes de cada request
const validateToken = async (accessToken, sessionToken) => {
  const response = await axios.get('http://auth-service:3001/auth/validate', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Session-Token': sessionToken
    }
  });
  return response.data.user;
};
```

### Con Media Service
```javascript
// Subir imagen
const uploadImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  const response = await axios.post('http://media-service:3005/upload', formData);
  return response.data.url;
};
```

### Con Species Service
```javascript
// Buscar especie por nombre
const findSpecies = async (speciesName) => {
  const response = await axios.get(
    `http://species-service:3006/species/search?name=${speciesName}`
  );
  return response.data.species;
};
```

### Con Pots Service
```javascript
// Obtener o crear macetero
const getOrCreatePot = async (userId, potLabel, accessToken, sessionToken) => {
  const response = await axios.post('http://pots-service:3003/pots/get-or-create', 
    { userId, label: potLabel },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Session-Token': sessionToken
      }
    }
  );
  return response.data.pot;
};
```

### Con IoT Service
```javascript
// Obtener condiciones ambientales de la planta
const getEnvironmentalData = async (plantId) => {
  const response = await axios.get(
    `http://iot-service:3004/conditions/plant/${plantId}?limit=10`
  );
  return response.data.conditions;
};
```

---

## 🗂️ Estructura Sugerida

```
plants-service/
├── src/
│   ├── index.js
│   ├── controllers/
│   │   └── plants.controller.js
│   ├── routes/
│   │   └── plants.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── validation.middleware.js
│   ├── services/
│   │   ├── auth.service.js       # Comunicación con Auth Service
│   │   ├── media.service.js      # Comunicación con Media Service
│   │   ├── species.service.js    # Comunicación con Species Service
│   │   ├── pots.service.js       # Comunicación con Pots Service
│   │   └── iot.service.js        # Comunicación con IoT Service
│   └── utils/
│       └── errors.js
```

---

## 🧪 Testing

```bash
# Crear planta
curl -X POST http://localhost:3002/plants \
  -H "Authorization: Bearer <token>" \
  -H "X-Session-Token: <session>" \
  -F "name=Mi Rosa" \
  -F "potLabel=ESP32-001" \
  -F "speciesName=rosachina" \
  -F "image=@plant.jpg"

# Obtener plantas
curl -X GET http://localhost:3002/plants \
  -H "Authorization: Bearer <token>" \
  -H "X-Session-Token: <session>"

# Obtener planta específica
curl -X GET http://localhost:3002/plants/1 \
  -H "Authorization: Bearer <token>" \
  -H "X-Session-Token: <session>"
```
