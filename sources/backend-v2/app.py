from flask import Flask
from flask_mysqldb import MySQL
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config

mysql = MySQL()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Configurar CORS - MODO DESARROLLO: Permite todo
    CORS(app, 
         origins="*",
         allow_headers="*",
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         supports_credentials=False)
    
    mysql.init_app(app)
    jwt.init_app(app)

    # Importar blueprints aquí
    from controllers.auth_controller import auth_bp
    from controllers.plant_controller import plant_bp
    from controllers.recognition_controller import recognition_bp
    from controllers.pot_controller import pot_bp
    from controllers.iot_controller import iot_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(plant_bp, url_prefix='/plants')
    app.register_blueprint(recognition_bp, url_prefix='/recognition')
    app.register_blueprint(pot_bp, url_prefix='/pots')
    app.register_blueprint(iot_bp, url_prefix='/iot')

    return app

if __name__ == '__main__':
    app = create_app()
    host = app.config.get('FLASK_HOST', '0.0.0.0')
    port = app.config.get('FLASK_PORT', 5000)
    print(f"\n🚀 Flask server running on http://{host}:{port}")
    print(f"📡 Environment: {'Development' if app.debug else 'Production'}")
    print(f"🔧 Debug mode: {app.debug}\n")
    app.run(host=host, port=port, debug=True)
