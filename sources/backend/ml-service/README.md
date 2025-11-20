# ML Service

Servicio de Machine Learning para predicción de riego y reconocimiento de especies de plantas.

## Puerto
- **5000**

## Modelos

### 1. Modelo de Reconocimiento (model-recognition.h5)
- **Tipo:** TensorFlow/Keras
- **Input:** Imagen de planta
- **Output:** Especie de planta
- **Especies soportadas:**
  - ajo
  - geranio
  - hierbabuena
  - menta
  - oregano
  - orquidea
  - rosachina
  - tomatecherry

### 2. Modelo de Riego (modelo_riego_numerico.pkl)
- **Tipo:** scikit-learn
- **Input:** Datos de sensores (humedad, temperatura, luz, especie)
- **Output:** Necesidad de riego y cantidad

## Endpoints

### 1. Reconocimiento de Planta
```http
POST /predict/recognition
Content-Type: multipart/form-data

Body:
- image: File (imagen de planta)
```

**Response:**
```json
{
  "species": "rosachina",
  "confidence": 0.95,
  "predictions": [
    { "species": "rosachina", "confidence": 0.95 },
    { "species": "geranio", "confidence": 0.03 },
    { "species": "orquidea", "confidence": 0.01 },
    { "species": "hierbabuena", "confidence": 0.01 }
  ]
}
```

### 2. Predicción de Riego
```http
POST /predict/irrigation
Content-Type: application/json

Body:
{
  "speciesId": 1,
  "moisture": 35.5,
  "temperature": 25.0,
  "humidity": 60.0,
  "light": 1200.0
}
```

**Response:**
```json
{
  "needsWatering": true,
  "waterAmountMl": 250,
  "confidence": 0.87,
  "recommendation": "La planta necesita riego moderado"
}
```

## Implementación de Predicciones (TODO)

### Cargar Modelos al Inicio
```python
import tensorflow as tf
import joblib
from PIL import Image
import numpy as np

# Cargar modelos
recognition_model = tf.keras.models.load_model('models/model-recognition.h5')
irrigation_model = joblib.load('models/modelo_riego_numerico.pkl')

# Mapping de especies
SPECIES_MAP = {
    0: 'ajo',
    1: 'geranio',
    2: 'hierbabuena',
    3: 'menta',
    4: 'oregano',
    5: 'orquidea',
    6: 'rosachina',
    7: 'tomatecherry'
}
```

### Reconocimiento de Imagen
```python
def predict_species(image_file):
    img = Image.open(image_file).convert('RGB')
    img = img.resize((224, 224))  # Ajustar según modelo
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    predictions = recognition_model.predict(img_array)[0]
    species_idx = np.argmax(predictions)
    confidence = float(predictions[species_idx])
    
    return SPECIES_MAP[species_idx], confidence, predictions
```

### Predicción de Riego
```python
def predict_irrigation(species_id, moisture, temperature, humidity, light):
    # Normalizar features según entrenamiento
    features = np.array([[species_id, moisture, temperature, humidity, light]])
    
    prediction = irrigation_model.predict(features)[0]
    needs_watering = bool(prediction > 0.5)
    
    # Calcular cantidad de agua
    water_amount = calculate_water_amount(moisture, species_id)
    
    return needs_watering, water_amount
```

## Comunicación entre servicios

**IoT Service** llama a ML Service para decisión de riego:
```python
import requests

response = requests.post('http://ml-service:5000/predict/irrigation', json={
    'speciesId': plant.species_id,
    'moisture': sensor_data['moisture'],
    'temperature': sensor_data['temperature'],
    'humidity': sensor_data['humidity'],
    'light': sensor_data['light']
})

data = response.json()
if data['needsWatering']:
    activate_watering_system(data['waterAmountMl'])
```

**Plants Service** llama a ML Service para reconocimiento:
```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await axios.post('http://ml-service:5000/predict/recognition', formData);
const speciesName = response.data.species;
```

## Variables de Entorno
```env
PORT=5000
MODEL_RECOGNITION_PATH=models/model-recognition.h5
MODEL_IRRIGATION_PATH=models/modelo_riego_numerico.pkl
```
