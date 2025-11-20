from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from middleware.auth_middleware import authenticate
from models.plant_model import Plant
plant_bp = Blueprint('plant', __name__)

@plant_bp.route('/', methods=['GET'])
@authenticate
def get_plants():
    user_id = get_jwt_identity()
    result = Plant.get_user_plants_with_conditions(user_id)
    return jsonify(result), 200

# Endpoint para detalle de planta con historial de riego paginado
@plant_bp.route('/<int:plant_id>', methods=['GET'])
@authenticate
def get_plant_detail(plant_id):
    user_id = get_jwt_identity()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 5))
    detail = Plant.get_plant_detail(user_id, plant_id, page, per_page)
    if not detail:
        return jsonify({'msg': 'Plant not found or not owned by user'}), 404
    return jsonify(detail), 200
