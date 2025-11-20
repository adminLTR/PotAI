from flask import Blueprint, request, jsonify
from models.plant_model import Plant
from config import Config
import joblib
import pandas as pd
import os

iot_bp = Blueprint('iot', __name__)

# Token de autenticación para dispositivos IoT (puedes ponerlo en .env)
IOT_API_KEY = Config.IOT_API_KEY if hasattr(Config, 'IOT_API_KEY') else 'your_iot_api_key_here'

# Cargar modelo de ML para predicción de riego
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'modelo_riego_numerico.pkl')
try:
    modelo_riego = joblib.load(MODEL_PATH)
    print(f"Modelo de riego cargado correctamente desde {MODEL_PATH}")
except Exception as e:
    print(f"ERROR: No se pudo cargar el modelo de riego: {e}")
    modelo_riego = None

# Umbral mínimo de riego (ml) - si el modelo predice menos, no se riega
RIEGO_MINIMO = 50

@iot_bp.route('/sensor-data', methods=['POST'])
def receive_sensor_data():
    """
    Endpoint para recibir datos del ESP32
    Requiere API Key en el header: X-IoT-API-Key
    """
    # Validar API Key
    api_key = request.headers.get('X-IoT-API-Key')
    if api_key != IOT_API_KEY:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    
    # Validar campos requeridos
    required_fields = ['pot_label', 'temperature', 'humidity', 'moisture', 'light']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    pot_label = data['pot_label']
    temperature = data['temperature']
    humidity = data['humidity']
    moisture = data['moisture']
    light = data['light']
    
    # Buscar la planta por el label del macetero
    plant_info = Plant.get_plant_by_pot_label(pot_label)
    
    if not plant_info:
        return jsonify({'error': 'Plant not found for this pot label'}), 404
    
    # Crear registro de condiciones ambientales
    condition_id = Plant.create_ambiental_condition(
        plant_info['plant_id'],
        temperature,
        humidity,
        moisture,
        light
    )
    
    # ==== PREDICCIÓN DE RIEGO CON ML ====
    needs_watering = False
    water_amount = 0
    
    if modelo_riego and plant_info['species_id']:
        try:
            # Preparar datos para el modelo: [localname, moisture, temperature]
            # localname es el species_id numérico
            input_data = pd.DataFrame([[
                plant_info['species_id'],
                moisture,
                temperature
            ]], columns=['localname', 'moisture', 'temperature'])
            
            # Predecir cantidad de riego en ml
            predicted_ml = modelo_riego.predict(input_data)[0]
            
            # Determinar si necesita riego
            if predicted_ml >= RIEGO_MINIMO:
                needs_watering = True
                water_amount = round(predicted_ml, 2)
            
        except Exception as e:
            print(f"Error en predicción de riego: {e}")
            # Continuar sin predicción si hay error
    
    return jsonify({
        'status': 'success',
        'message': 'Sensor data recorded',
        'condition_id': condition_id,
        'plant_id': plant_info['plant_id'],
        'irrigation': {
            'needs_watering': needs_watering,
            'water_amount_ml': water_amount,
            'species_name': plant_info.get('species_name', 'Unknown')
        }
    }), 201
