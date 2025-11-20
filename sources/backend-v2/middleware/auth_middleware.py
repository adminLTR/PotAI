from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from flask_mysqldb import MySQL
from functools import wraps
from datetime import datetime

def authenticate(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception as e:
            error_msg = str(e)
            print(f"❌ JWT verification failed: {error_msg}")
            return jsonify({
                'msg': 'Invalid or expired token',
                'error': 'token_invalid',
                'details': 'Please login again'
            }), 401
            
        user_id = get_jwt_identity()
        print(f"✅ JWT valid for user_id: {user_id}")
        
        session_token = request.headers.get('X-Session-Token')
        if not session_token:
            print("❌ Missing X-Session-Token header")
            return jsonify({
                'msg': 'Session token required',
                'error': 'session_token_missing'
            }), 401
            
        cur = MySQL().connection.cursor()
        cur.execute("SELECT expires_at FROM sessions WHERE user_id = %s AND session_token = %s", (user_id, session_token))
        session = cur.fetchone()
        cur.close()
        
        if not session:
            print(f"❌ Session not found in DB for user {user_id}")
            return jsonify({
                'msg': 'Session not found',
                'error': 'session_not_found',
                'details': 'Please login again'
            }), 401
            
        if session[0] < datetime.utcnow():
            print(f"❌ Session expired at {session[0]}")
            return jsonify({
                'msg': 'Session expired',
                'error': 'session_expired',
                'details': 'Please login again'
            }), 401
            
        print(f"✅ Authentication successful for user {user_id}")
        return f(*args, **kwargs)
    return decorated_function
