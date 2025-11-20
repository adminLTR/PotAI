from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user_model import User
from flask_mysqldb import MySQL
import secrets
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    print(f"\n🔐 Login attempt for username: {username}")
    
    if not username or not password:
        print("❌ Missing username or password")
        return jsonify({'msg': 'Username and password are required'}), 400
    
    user = User.find_by_username(username)
    if not user:
        print(f"❌ User not found: {username}")
        return jsonify({'msg': 'Invalid credentials'}), 401
        
    if not User.verify_password(user[3], password):
        print(f"❌ Invalid password for user: {username}")
        return jsonify({'msg': 'Invalid credentials'}), 401
    
    # Crear tokens
    access_token = create_access_token(identity=user[0])
    session_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=2)
    
    print(f"✅ Tokens created for user_id: {user[0]}")
    print(f"   - Access token length: {len(access_token)}")
    print(f"   - Session token: {session_token[:20]}...")
    print(f"   - Expires at: {expires_at.isoformat()}")
    
    # Guardar sesión en base de datos
    User.create_session(user[0], session_token, expires_at)
    print(f"✅ Session saved in database")
    
    # Retornar datos completos del usuario
    response_data = {
        'access_token': access_token,
        'session_token': session_token,
        'expires_at': expires_at.isoformat(),
        'user_id': user[0],
        'username': user[1],
        'email': user[2]
    }
    print(f"✅ Login successful for {username} (user_id: {user[0]})\n")
    return jsonify(response_data), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if User.find_by_username(username):
        return jsonify({'msg': 'Username already exists'}), 400
    User.create(username, email, password)
    return jsonify({'msg': 'User created'}), 201

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    user_id = get_jwt_identity()
    return jsonify(logged_in_as=user_id), 200

# Endpoint para logout (eliminar sesión)
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = get_jwt_identity()
    data = request.get_json()
    session_token = data.get('session_token')
    User.delete_session(user_id, session_token)
    return jsonify({'msg': 'Logged out'}), 200
