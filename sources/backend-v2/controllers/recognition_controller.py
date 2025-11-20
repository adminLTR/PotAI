from flask import Blueprint, request, jsonify
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

recognition_bp = Blueprint('recognition', __name__)

# Configuración del modelo
IMG_HEIGHT = 180
IMG_WIDTH = 180
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'model-recognition.h5')

# Clases/etiquetas del modelo
CLASS_NAMES = [
    'ajo', 'geranio', 'hierbabuena', 'menta', 
    'oregano', 'orquidea', 'rosachina', 'tomatecherry'
]

# Cargar el modelo al iniciar
try:
    modelo = tf.keras.models.load_model(MODEL_PATH)
    print(f"Modelo de reconocimiento cargado correctamente desde {MODEL_PATH}")
except Exception as e:
    print(f"ERROR: No se pudo cargar el modelo de reconocimiento: {e}")
    modelo = None

@recognition_bp.route('/', methods=['POST'])
def recognize_plant():
    """Endpoint para reconocer el tipo de planta desde una imagen."""
    if modelo is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
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
        predicciones = modelo.predict(img_array)
        probabilities = predicciones[0]
        indice = np.argmax(probabilities)
        confianza = float(np.max(probabilities) * 100)
        
        return jsonify({
            'plant_type': CLASS_NAMES[indice],
            'confidence': round(confianza, 2),
            'all_probabilities': {
                CLASS_NAMES[i]: round(float(probabilities[i] * 100), 2) 
                for i in range(len(CLASS_NAMES))
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error processing image: {str(e)}'}), 500
