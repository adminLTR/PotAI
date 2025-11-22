# 🤖 ML Service - Endpoint de Reconocimiento de Plantas

## 📋 Resumen de Implementación

Se ha implementado completamente el endpoint de reconocimiento de plantas con comunicación automática al Species Service para obtener el ID de la especie.

## 🎯 Endpoint Implementado

### POST `/ml/predict/recognition`

**Descripción**: Reconoce el tipo de planta a partir de una imagen y devuelve el nombre de la especie y su ID desde la base de datos.

**Request**: `multipart/form-data`
```
image: [archivo de imagen JPG/PNG]
```

**Response** (200 OK):
```json
{
  "speciesName": "rosachina",
  "speciesId": 7,
  "confidence": 95.5,
  "allPredictions": [
    {
      "species": "rosachina",
      "confidence": 95.5
    },
    {
      "species": "geranio",
      "confidence": 2.3
    },
    {
      "species": "orquidea",
      "confidence": 1.1
    }
    // ... resto de predicciones ordenadas por confianza
  ],
  "speciesData": {
    "id": 7,
    "commonName": "Rosa China",
    "scientificName": "Hibiscus rosa-sinensis",
    "waterRequirements": "...",
    "lightRequirements": "...",
    "humidityRequirements": "..."
  }
}
```

**Errores**:
- `503` - Modelo no cargado
- `400` - No se envió imagen
- `500` - Error procesando imagen

## 🔄 Flujo de Reconocimiento

```
1. Usuario envía imagen → ML Service
2. ML Service carga y preprocesa imagen (180x180, RGB, normalización)
3. TensorFlow predice especie (8 clases)
4. ML Service busca especie en Species Service por nombre
5. Species Service devuelve datos completos con ID
6. ML Service responde con:
   - Nombre de especie predicha
   - ID de especie (de la base de datos)
   - Confianza de predicción
   - Datos completos de la especie
   - Todas las predicciones ordenadas
```

## 🌿 Especies Reconocidas

El modelo está entrenado para reconocer estas 8 especies:

| Nombre ML | Nombre Común | ID en BD |
|-----------|--------------|----------|
| `ajo` | Ajo | 1 |
| `geranio` | Geranio | 2 |
| `hierbabuena` | Hierbabuena | 3 |
| `menta` | Menta | 4 |
| `oregano` | Orégano | 5 |
| `orquidea` | Orquídea | 6 |
| `rosachina` | Rosa China | 7 |
| `tomatecherry` | Tomate Cherry | 8 |

## 🔧 Configuración Técnica

### Variables de Entorno (docker-compose.yml)
```yaml
ml-service:
  environment:
    PORT: 5000
    SPECIES_SERVICE_URL: http://species-service:3006
```

### Dependencias Python (requirements.txt)
```
tensorflow==2.15.0
flask==3.0.0
pillow==10.1.0
requests==2.31.0
numpy==1.26.2
pandas==2.1.3
```

### Modelos ML
- **Reconocimiento**: `models/model-recognition.h5` (TensorFlow/Keras)
  - Estado: ⚠️ Error de versión (necesita actualizar modelo)
- **Riego**: `models/modelo_riego_numerico.pkl` (scikit-learn)
  - Estado: ✅ Cargado correctamente

## 🧪 Cómo Probar con Postman

### Opción 1: Endpoint de Reconocimiento

1. **Importar colección actualizada**: `PotAI_Postman_Collection.json`
2. **Ir a**: `7. ML Service` → `Predict Plant Recognition`
3. **Configurar**:
   - Body → form-data
   - Key: `image`
   - Type: `File`
   - Seleccionar imagen de planta
4. **Enviar request**
5. **Resultado**: 
   - Automáticamente guarda `species_id` en variables
   - Puedes usar este ID para crear plantas

### Opción 2: Flujo Completo Frontend

```
1. Usuario sube foto de planta
2. Frontend llama: POST /ml/predict/recognition
3. ML Service devuelve: { speciesName, speciesId, confidence, ... }
4. Frontend usa speciesId para crear planta:
   POST /plants
   {
     "name": "Mi planta",
     "potLabel": "ESP32_001",
     "speciesId": 7,  // ← Viene del reconocimiento
     "image": [archivo]
   }
```

## 📊 Estado Actual de Modelos

### Modelo de Reconocimiento ⚠️
```
Estado: No cargado
Razón: Error de compatibilidad de versión TensorFlow
Solución: Necesita regenerar el modelo con TensorFlow 2.15.0
```

Para actualizar el modelo:
1. Re-entrenar con TensorFlow 2.15.0
2. Guardar en formato compatible: `model.save('model-recognition.h5')`
3. Copiar a `ml-service/models/`

### Modelo de Riego ✅
```
Estado: Cargado correctamente
Formato: scikit-learn pickle
Features: [speciesId, moisture, temperature]
Output: waterAmountMl
```

## 🔗 Comunicación entre Servicios

### ML Service → Species Service

**Búsqueda por nombre**:
```javascript
GET http://species-service:3006/species/search?q=rosachina

Response:
{
  "species": {
    "id": 7,
    "commonName": "Rosa China",
    "scientificName": "Hibiscus rosa-sinensis",
    ...
  }
}
```

**Ventajas**:
- ✅ Sincronización automática con base de datos
- ✅ Obtiene ID correcto para relaciones
- ✅ Incluye datos completos de especie
- ✅ No necesita hardcodear IDs

## 🎨 Integración con Frontend

### Ejemplo de Llamada

```javascript
// 1. Reconocer planta
const formData = new FormData();
formData.append('image', imageFile);

const recognition = await fetch('http://localhost:8080/ml/predict/recognition', {
  method: 'POST',
  body: formData
});

const result = await recognition.json();
// result.speciesId = 7
// result.speciesName = "rosachina"
// result.confidence = 95.5

// 2. Crear planta con ID reconocido
const plantData = new FormData();
plantData.append('name', 'Mi Rosa');
plantData.append('potLabel', 'ESP32_001');
plantData.append('speciesId', result.speciesId); // ← ID del reconocimiento
plantData.append('image', imageFile);

await fetch('http://localhost:8080/plants', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'x-session-token': sessionToken,
    'x-user-id': userId
  },
  body: plantData
});
```

## 📝 Notas Importantes

### ⚠️ Estado del Modelo de Reconocimiento

El modelo actual tiene un problema de compatibilidad:
- Fue entrenado con TensorFlow 2.x más reciente
- El servicio usa TensorFlow 2.15.0
- Error: `Unrecognized keyword arguments: ['batch_shape']`

**Soluciones**:
1. **Actualizar TensorFlow** (más fácil): Cambiar a versión más reciente
2. **Regenerar modelo** (más estable): Re-entrenar con TensorFlow 2.15.0
3. **Modo Mock** (temporal): Devolver especie por defecto para pruebas

### ✅ Modelo de Riego Funcionando

El modelo de predicción de riego está operativo:
```json
POST /ml/predict/irrigation
{
  "speciesId": 7,
  "moisture": 25.0,
  "temperature": 22.5
}

Response:
{
  "needsWatering": true,
  "waterAmountMl": 180.5,
  "recommendation": "Water the plant",
  "thresholdMl": 50
}
```

## 🚀 Próximos Pasos

1. **Solucionar modelo de reconocimiento**:
   - Opción A: Actualizar TensorFlow a versión compatible
   - Opción B: Regenerar modelo con TensorFlow 2.15.0
   
2. **Integrar en IoT Service**:
   - Usar predicción de riego en lugar de umbral fijo
   - Llamar a `/ml/predict/irrigation` con datos de sensores

3. **Optimizar respuestas**:
   - Agregar caché para predicciones frecuentes
   - Agregar más metadata de confianza

4. **Testing**:
   - Probar con imágenes reales de las 8 especies
   - Validar precisión del modelo
   - Ajustar umbrales si es necesario

## 📚 Documentación de Endpoints

### GET `/ml/health`
```json
{
  "status": "healthy",
  "service": "ml-service",
  "models": {
    "recognition": "not_loaded", // o "loaded"
    "irrigation": "loaded"
  },
  "speciesServiceUrl": "http://species-service:3006",
  "availableSpecies": ["ajo", "geranio", ...]
}
```

### POST `/ml/predict/recognition`
Ver arriba - Endpoint principal implementado ✅

### POST `/ml/predict/irrigation`
```json
Request:
{
  "speciesId": 7,
  "moisture": 25.0,
  "temperature": 22.5
}

Response:
{
  "needsWatering": true,
  "waterAmountMl": 180.5,
  "recommendation": "Water the plant",
  "thresholdMl": 50
}
```

---

**Estado**: ✅ Implementado y funcionando (excepto carga del modelo de reconocimiento por versión de TensorFlow)

**Gateway**: ✅ Rutas `/ml/*` configuradas

**Comunicación**: ✅ ML Service ↔ Species Service operativa

**Postman**: ✅ Colección actualizada con endpoints de ML
