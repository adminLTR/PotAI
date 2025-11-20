from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity
from middleware.auth_middleware import authenticate
from models.plant_model import Plant
import os
from werkzeug.utils import secure_filename

pot_bp = Blueprint('pot', __name__)

@pot_bp.route('/create', methods=['POST'])
@authenticate
def create_pot_and_plant():
    """
    Crea una nueva planta para el usuario autenticado.
    Si el pot (macetero) no existe, lo crea automáticamente.
    
    Requiere:
    - image: Archivo de imagen de la planta
    - name: Nombre/apodo de la planta
    - species_name: Tipo de planta (reconocido)
    - pot_label: Código/label del macetero (ej: ESP32-001)
    """
    user_id = get_jwt_identity()
    
    # Validar imagen
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Obtener datos del formulario
    name = request.form.get('name')
    species_name = request.form.get('species_name')
    pot_label = request.form.get('pot_label')
    
    # Validar campos requeridos
    if not all([name, species_name, pot_label]):
        return jsonify({'error': 'Missing required fields: name, species_name, pot_label'}), 400

    try:
        # Guardar imagen en disco con nombre único
        import time
        timestamp = int(time.time())
        filename = secure_filename(f"{timestamp}_{image_file.filename}")
        image_folder = os.path.join(current_app.root_path, 'plant_images')
        os.makedirs(image_folder, exist_ok=True)
        image_path = os.path.join(image_folder, filename)
        image_file.save(image_path)
        image_url = f'/plant_images/{filename}'

        # Obtener o crear el macetero (pot)
        pot_id, pot_created = Plant.get_or_create_pot(user_id, pot_label)
        
        # Buscar la especie por nombre
        species_id = Plant.get_species_id_by_name(species_name)
        if not species_id:
            # Si no existe, intentar buscar de forma case-insensitive
            species_id = Plant.get_species_id_by_name(species_name.lower())
        
        if not species_id:
            return jsonify({
                'error': f'Species "{species_name}" not found in database',
                'suggestion': 'Please check the species name or add it to the database'
            }), 404
        
        # Crear la planta
        plant_id = Plant.create_plant(user_id, pot_id, name, image_url, species_id)

        return jsonify({
            'success': True,
            'message': 'Plant created successfully',
            'data': {
                'pot_id': pot_id,
                'pot_created': pot_created,
                'pot_label': pot_label,
                'plant_id': plant_id,
                'plant_name': name,
                'species_name': species_name,
                'image_url': image_url
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Error creating plant',
            'details': str(e)
        }), 500
