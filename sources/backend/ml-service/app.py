from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import tensorflow as tf
import joblib
import numpy as np
from PIL import Image
import io
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PORT = int(os.getenv('PORT', 5000))
SPECIES_SERVICE_URL = os.getenv('SPECIES_SERVICE_URL', 'http://species-service:3006')

# Configuración del modelo de reconocimiento
IMG_HEIGHT = 180
IMG_WIDTH = 180
RECOGNITION_MODEL_PATH = 'models/model-recognition.h5'
IRRIGATION_MODEL_PATH = 'models/modelo_riego_numerico.pkl'

# Clases/etiquetas del modelo (deben coincidir con Species Service)
CLASS_NAMES = [
    'ajo', 'geranio', 'hierbabuena', 'menta', 
    'oregano', 'orquidea', 'rosachina', 'tomatecherry'
]

# Cargar modelos al inicio
recognition_model = None
irrigation_model = None

try:
    if os.path.exists(RECOGNITION_MODEL_PATH):
        recognition_model = tf.keras.models.load_model(RECOGNITION_MODEL_PATH)
        logger.info(f'✅ Modelo de reconocimiento cargado desde {RECOGNITION_MODEL_PATH}')
    else:
        logger.warning(f'⚠️  Modelo de reconocimiento no encontrado: {RECOGNITION_MODEL_PATH}')
except Exception as e:
    logger.error(f'❌ Error cargando modelo de reconocimiento: {e}')

try:
    if os.path.exists(IRRIGATION_MODEL_PATH):
        irrigation_model = joblib.load(IRRIGATION_MODEL_PATH)
        logger.info(f'✅ Modelo de riego cargado desde {IRRIGATION_MODEL_PATH}')
    else:
        logger.warning(f'⚠️  Modelo de riego no encontrado: {IRRIGATION_MODEL_PATH}')
except Exception as e:
    logger.error(f'❌ Error cargando modelo de riego: {e}')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'ml-service',
        'models': {
            'recognition': 'loaded' if recognition_model is not None else 'not_loaded',
            'irrigation': 'loaded' if irrigation_model is not None else 'not_loaded'
        },
        'speciesServiceUrl': SPECIES_SERVICE_URL,
        'availableSpecies': CLASS_NAMES
    })

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'service': 'ML Service',
        'version': '1.0.0',
        'endpoints': {
            'recognition': 'POST /predict/recognition',
            'irrigation': 'POST /predict/irrigation'
        }
    })

@app.route('/predict/recognition', methods=['POST'])
def predict_recognition():
    """
    Reconoce el tipo de planta a partir de una imagen.
    
    Request:
        - image: archivo de imagen (multipart/form-data)
    
    Response:
        {
            "speciesName": "rosachina",
            "speciesId": 7,
            "confidence": 95.5,
            "allPredictions": [
                {"species": "rosachina", "confidence": 95.5},
                {"species": "geranio", "confidence": 2.3},
                ...
            ]
        }
    """
    if recognition_model is None:
        return jsonify({
            'error': 'Recognition model not loaded',
            'message': 'Model file not found or failed to load'
        }), 503
    
    # Verificar que se envió un archivo
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    try:
        # Leer la imagen desde el archivo
        image_bytes = file.read()
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convertir a RGB si es necesario
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Redimensionar
        img = img.resize((IMG_WIDTH, IMG_HEIGHT))
        
        # Convertir a array y normalizar
        img_array = np.array(img)
        img_array = np.expand_dims(img_array, 0)  # Agregar dimensión de batch
        img_array = img_array / 255.0  # Normalizar
        
        # Realizar predicción
        predictions = recognition_model.predict(img_array, verbose=0)
        probabilities = predictions[0]
        top_index = np.argmax(probabilities)
        confidence = float(probabilities[top_index] * 100)
        predicted_species = CLASS_NAMES[top_index]
        
        # Buscar species en Species Service
        species_data = None
        species_id = None
        
        try:
            # Buscar por nombre común (sin tildes)
            search_response = requests.get(
                f'{SPECIES_SERVICE_URL}/species/search',
                params={'q': predicted_species},
                timeout=5
            )
            
            if search_response.status_code == 200:
                search_result = search_response.json()
                if search_result.get('species'):
                    species_data = search_result['species']
                    species_id = species_data['id']
                    logger.info(f'✅ Especie encontrada: {species_data["commonName"]} (ID: {species_id})')
                else:
                    logger.warning(f'⚠️  Especie no encontrada en base de datos: {predicted_species}')
            else:
                logger.error(f'❌ Error buscando especie: {search_response.status_code}')
        except Exception as e:
            logger.error(f'❌ Error comunicándose con Species Service: {e}')
        
        # Preparar todas las predicciones ordenadas por confianza
        all_predictions = [
            {
                'species': CLASS_NAMES[i],
                'confidence': round(float(probabilities[i] * 100), 2)
            }
            for i in range(len(CLASS_NAMES))
        ]
        all_predictions.sort(key=lambda x: x['confidence'], reverse=True)
        
        response = {
            'speciesName': predicted_species,
            'speciesId': species_id,
            'confidence': round(confidence, 2),
            'allPredictions': all_predictions
        }
        
        # Si encontramos datos de la especie, incluirlos
        if species_data:
            response['speciesData'] = {
                'id': species_data['id'],
                'commonName': species_data['commonName'],
                'scientificName': species_data.get('scientificName'),
                'waterRequirements': species_data.get('waterRequirements'),
                'lightRequirements': species_data.get('lightRequirements'),
                'humidityRequirements': species_data.get('humidityRequirements')
            }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f'Error processing image: {str(e)}')
        return jsonify({
            'error': 'Error processing image',
            'message': str(e)
        }), 500

@app.route('/predict/irrigation', methods=['POST'])
def predict_irrigation():
    """
    Predice si una planta necesita riego y la cantidad.
    
    Request Body (JSON):
        {
            "speciesId": 1,
            "moisture": 35.5,
            "temperature": 25.0,
            "humidity": 60.0,
            "light": 1200.0
        }
    
    Response:
        {
            "needsWatering": true,
            "waterAmountMl": 250,
            "confidence": 0.87
        }
    """
    if irrigation_model is None:
        return jsonify({
            'error': 'Irrigation model not loaded',
            'message': 'Model file not found or failed to load'
        }), 503
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
    
    # Validar campos requeridos
    required_fields = ['speciesId', 'moisture', 'temperature']
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        return jsonify({
            'error': 'Missing required fields',
            'missing': missing_fields
        }), 400
    
    try:
        species_id = int(data['speciesId'])
        moisture = float(data['moisture'])
        temperature = float(data['temperature'])
        
        # Preparar datos para el modelo: [speciesId, moisture, temperature]
        import pandas as pd
        input_data = pd.DataFrame([[
            species_id,
            moisture,
            temperature
        ]], columns=['localname', 'moisture', 'temperature'])
        
        # Predecir cantidad de riego en ml
        predicted_ml = irrigation_model.predict(input_data)[0]
        predicted_ml = max(0, predicted_ml)  # No valores negativos
        
        # Umbral mínimo de riego
        RIEGO_MINIMO = 50
        needs_watering = predicted_ml >= RIEGO_MINIMO
        
        return jsonify({
            'needsWatering': needs_watering,
            'waterAmountMl': round(predicted_ml, 2),
            'recommendation': 'Water the plant' if needs_watering else 'No watering needed',
            'thresholdMl': RIEGO_MINIMO
        }), 200
        
    except ValueError as e:
        return jsonify({
            'error': 'Invalid data types',
            'message': str(e)
        }), 400
    except Exception as e:
        logger.error(f'Error predicting irrigation: {str(e)}')
        return jsonify({
            'error': 'Error predicting irrigation',
            'message': str(e)
        }), 500

@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f'Error: {str(error)}')
    return jsonify({
        'error': 'Internal Server Error',
        'message': str(error)
    }), 500

if __name__ == '__main__':
    logger.info(f'🤖 ML Service starting on port {PORT}')
    app.run(host='0.0.0.0', port=PORT, debug=True)
