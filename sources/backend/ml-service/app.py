from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging

app = Flask(__name__)
CORS(app)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PORT = int(os.getenv('PORT', 5000))

# TODO: Cargar modelos al inicio
# import tensorflow as tf
# import joblib
# 
# RECOGNITION_MODEL_PATH = 'models/model-recognition.h5'
# IRRIGATION_MODEL_PATH = 'models/modelo_riego_numerico.pkl'
#
# recognition_model = tf.keras.models.load_model(RECOGNITION_MODEL_PATH)
# irrigation_model = joblib.load(IRRIGATION_MODEL_PATH)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'ml-service',
        'models': {
            'recognition': 'loaded',  # TODO: verificar si modelo está cargado
            'irrigation': 'loaded'
        }
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
            "species": "rosachina",
            "confidence": 0.95,
            "predictions": [
                {"species": "rosachina", "confidence": 0.95},
                {"species": "geranio", "confidence": 0.03},
                ...
            ]
        }
    """
    # TODO: Implementar
    return jsonify({
        'error': 'Not implemented yet',
        'message': 'Please implement recognition logic'
    }), 501

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
    # TODO: Implementar
    return jsonify({
        'error': 'Not implemented yet',
        'message': 'Please implement irrigation prediction logic'
    }), 501

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
