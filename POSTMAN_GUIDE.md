# 🧪 Guía de Pruebas con Postman - PotAI

## 📥 Importar Colección

1. Abre Postman
2. Click en **Import**
3. Selecciona el archivo: `PotAI_Postman_Collection.json`
4. La colección se cargará con 7 carpetas (servicios)

## 🔑 Variables de Colección

La colección usa variables automáticas que se actualizan con los tests:

- `base_url`: http://localhost:8080
- `access_token`: Token de autenticación (se actualiza automáticamente)
- `session_token`: Token de sesión (se actualiza automáticamente)
- `user_id`: ID del usuario (se actualiza automáticamente)
- `plant_id`: ID de la planta creada (se actualiza automáticamente)
- `pot_id`: ID del macetero (se actualiza automáticamente)
- `species_id`: ID de especie (se actualiza automáticamente)

## 🚀 Flujo de Prueba Completo

### Paso 1: Verificar Servicios (Health Checks)

Ejecuta todos los health checks para verificar que los servicios están corriendo:

```
✅ Auth Service → /auth/health
✅ Species Service → /species/health
✅ Pots Service → /pots/health
✅ Media Service → /media/health
✅ Plants Service → /plants/health
✅ IoT Service → /iot/health
✅ ML Service → /ml/health
```

### Paso 2: Crear Usuario y Autenticarse

**1. Register User** (carpeta 1. Auth Service)
   - Registra un nuevo usuario
   - **Importante**: Los tokens se guardan automáticamente en las variables
   - Si el usuario ya existe, usa **Login User** en su lugar

```json
POST /auth/register
{
  "email": "test@potai.com",
  "password": "Test123!",
  "name": "Usuario Test"
}
```

**Variables actualizadas automáticamente:**
- ✅ `user_id`
- ✅ `access_token`
- ✅ `session_token`

### Paso 3: Obtener Lista de Especies

**2. Get All Species** (carpeta 2. Species Service)
   - Lista las 8 especies disponibles
   - Automáticamente guarda el ID de la primera especie

```
GET /species
```

**Especies disponibles:**
1. Ajo (Allium sativum)
2. Geranio (Pelargonium)
3. Hierbabuena (Mentha spicata)
4. Menta (Mentha)
5. Orégano (Origanum vulgare)
6. Orquídea (Orchidaceae)
7. Rosa China (Hibiscus rosa-sinensis) ⭐ **ID: 7**
8. Tomate Cherry (Solanum lycopersicum var. cerasiforme)

**Variables actualizadas:**
- ✅ `species_id` (primera especie de la lista)

**Nota**: Puedes cambiar manualmente el `species_id` en las variables de colección si quieres usar otra especie.

### Paso 4: Crear Macetero (Pot)

**3. Get or Create Pot** (carpeta 3. Pots Service)
   - Crea o busca un macetero con el código ESP32
   - Este código simula el identificador de tu placa ESP32

```json
POST /pots/get-or-create
{
  "label": "ESP32_TEST_001"
}
```

**Variables actualizadas:**
- ✅ `pot_id`

### Paso 5: Crear Planta con Imagen

**4. Create Plant (with Image)** (carpeta 5. Plants Service)
   - Crea una planta asociada al macetero y especie
   - **Importante**: Debes seleccionar una imagen en el campo `image`

**Antes de enviar:**
1. Ve al body → form-data
2. En el campo `image`, click en "Select Files"
3. Selecciona una imagen de planta de tu computadora (JPG, PNG)
4. Verifica que `speciesId` use la variable `{{species_id}}`

```
POST /plants (multipart/form-data)
- name: "Mi Rosa China"
- potLabel: "ESP32_TEST_001"
- speciesId: {{species_id}}
- plantedAt: "2025-11-21"
- notes: "Planta de prueba"
- image: [ARCHIVO]
```

**Variables actualizadas:**
- ✅ `plant_id`

### Paso 6: Simular Envío de Datos del ESP32

**5. Send Sensor Data (ESP32 Simulation)** (carpeta 6. IoT Service)
   - Simula que el ESP32 envía datos de sensores
   - **Este endpoint es PÚBLICO** (no requiere autenticación)
   - Si la humedad es < 30%, el sistema regará automáticamente

```json
POST /iot/sensor-data
{
  "plantId": {{plant_id}},
  "temperature": 25.5,
  "humidity": 65.0,
  "moisture": 28.0,    // < 30% → Se activa riego automático
  "light": 1200.0
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "conditionId": 1,
  "watered": true,
  "wateringLog": {
    "id": 1,
    "amountMl": 200,
    "timestamp": "2025-11-21T..."
  }
}
```

### Paso 7: Consultar Planta Completa

**6. Get Plant by ID** (carpeta 5. Plants Service)
   - Obtiene toda la información de la planta
   - Incluye: datos básicos, pot, especie, condiciones ambientales, historial de riego

```
GET /plants/{{plant_id}}
```

**Respuesta esperada:**
```json
{
  "plant": {
    "id": 1,
    "name": "Mi Rosa China",
    "imageUrl": "http://...",
    "pot": {
      "id": 1,
      "label": "ESP32_TEST_001"
    },
    "species": {
      "id": 7,
      "commonName": "Rosa China",
      "scientificName": "Hibiscus rosa-sinensis",
      "waterRequirements": "...",
      "lightRequirements": "...",
      "humidityRequirements": "...",
      "moistureRequirements": "..."
    },
    "environmentalConditions": [
      {
        "temperature": 25.5,
        "humidity": 65.0,
        "moisture": 28.0,
        "light": 1200.0,
        "timestamp": "..."
      }
    ],
    "wateringLogs": [
      {
        "id": 1,
        "amountMl": 200,
        "timestamp": "..."
      }
    ]
  }
}
```

## 🔄 Flujo de Prueba Adicional

### Ver Historial de Condiciones

```
GET /iot/plants/{{plant_id}}/conditions?limit=10
```

### Ver Historial de Riego

```
GET /iot/plants/{{plant_id}}/watering-logs?limit=10
```

### Ver Última Lectura

```
GET /iot/plants/{{plant_id}}/latest
```

### Actualizar Planta

```json
PUT /plants/{{plant_id}}
{
  "name": "Mi Rosa China Actualizada",
  "notes": "Está creciendo bien"
}
```

### Listar Todas las Plantas

```
GET /plants?limit=10&offset=0
```

## 🎯 Escenarios de Prueba

### Escenario 1: Planta con Riego Automático

1. Crear planta (Paso 5)
2. Enviar datos con **moisture < 30%** (Paso 6)
3. Verificar que `watered: true` en la respuesta
4. Consultar planta (Paso 7) y ver el registro en `wateringLogs`

### Escenario 2: Planta sin Necesidad de Riego

1. Crear planta (Paso 5)
2. Enviar datos con **moisture > 30%** (ej: 45.0)
3. Verificar que `watered: false` en la respuesta
4. Consultar planta y ver que NO hay nuevo registro de riego

### Escenario 3: Múltiples Lecturas

1. Crear planta (Paso 5)
2. Enviar 5 lecturas diferentes (Paso 6) con diferentes valores
3. Consultar historial de condiciones
4. Verificar que todas las lecturas se almacenaron

## 🐛 Solución de Problemas

### Error 401 (Unauthorized)

- Verifica que ejecutaste **Register User** o **Login User**
- Las variables `access_token` y `session_token` deben tener valores
- Ve a: Colección → Variables → Check values

### Error 404 (Not Found)

- Asegúrate de que el ID de la planta/pot/especie existe
- Ejecuta primero los endpoints de creación
- Verifica las variables de colección

### Error 400 (Bad Request)

- Revisa que todos los campos requeridos estén presentes
- `name` y `potLabel` son obligatorios para crear plantas
- `speciesId` debe ser un número entero

### Imagen no se sube

- Verifica que el campo `image` tenga un archivo seleccionado
- El archivo debe ser JPG, PNG o similar
- Máximo 10MB

### ESP32 no puede enviar datos

- El endpoint `/iot/sensor-data` es PÚBLICO
- No requiere headers de autenticación
- Solo necesita `plantId` válido

## 📊 Datos de Referencia

### IDs de Especies Comunes

- **1**: Ajo
- **2**: Geranio
- **3**: Hierbabuena
- **4**: Menta
- **5**: Orégano
- **6**: Orquídea
- **7**: Rosa China ⭐ (más común para pruebas)
- **8**: Tomate Cherry

### Rangos de Sensores

- **Temperature**: 0-50 °C
- **Humidity**: 0-100 %
- **Moisture**: 0-100 % (< 30% activa riego)
- **Light**: 0-2000 lux

## 🔐 Autenticación

Todos los endpoints (excepto health checks, species públicos y ESP32) requieren:

```
Authorization: Bearer {{access_token}}
x-session-token: {{session_token}}
x-user-id: {{user_id}}
```

**Estos headers se agregan automáticamente** si ejecutaste Register/Login primero.

## ✅ Checklist de Prueba Completa

- [ ] Health checks de todos los servicios
- [ ] Registro/Login de usuario
- [ ] Listar especies disponibles
- [ ] Crear/obtener macetero
- [ ] Crear planta con imagen
- [ ] Enviar datos de sensores (ESP32)
- [ ] Verificar riego automático
- [ ] Consultar planta completa
- [ ] Ver historial de condiciones
- [ ] Ver historial de riego
- [ ] Actualizar planta
- [ ] Listar todas las plantas

## 🎉 Resultado Esperado

Si todo funciona correctamente:

1. ✅ Usuario creado y autenticado
2. ✅ Imagen de planta subida correctamente
3. ✅ Planta creada con datos completos
4. ✅ ESP32 puede enviar datos sin autenticación
5. ✅ Sistema riega automáticamente cuando moisture < 30%
6. ✅ Historial de condiciones y riego se almacena
7. ✅ Planta muestra datos enriquecidos de todos los servicios

---

**¡Listo para probar!** 🚀

Empieza ejecutando los requests en orden desde la carpeta 1 hasta la 6.
