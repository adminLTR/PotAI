"""
Script de diagnóstico para verificar el estado de autenticación
Ejecutar cuando haya problemas de "invalid token"
"""
import os
import sys
from datetime import datetime

def print_header(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60 + "\n")

def check_env_file():
    print_header("1️⃣ VERIFICANDO ARCHIVO .ENV")
    
    env_path = ".env"
    if os.path.exists(env_path):
        print("✅ Archivo .env encontrado")
        with open(env_path, 'r') as f:
            content = f.read()
            if 'JWT_SECRET_KEY' in content:
                print("✅ JWT_SECRET_KEY definido")
                # Extraer el valor
                for line in content.split('\n'):
                    if line.startswith('JWT_SECRET_KEY'):
                        print(f"   Valor: {line.split('=')[1]}")
            else:
                print("❌ JWT_SECRET_KEY NO definido")
                print("   ⚠️ El servidor usará 'default_jwt_secret'")
    else:
        print("❌ Archivo .env NO encontrado")
        print("   ⚠️ Crea un archivo .env con JWT_SECRET_KEY")

def check_database_connection():
    print_header("2️⃣ VERIFICANDO CONEXIÓN A BASE DE DATOS")
    
    try:
        import MySQLdb
        from dotenv import load_dotenv
        
        load_dotenv()
        
        host = os.getenv('MYSQL_HOST', 'localhost')
        user = os.getenv('MYSQL_USER', 'root')
        password = os.getenv('MYSQL_PASSWORD', '')
        database = os.getenv('MYSQL_DB', 'potia')
        
        print(f"Intentando conectar a: {user}@{host}/{database}")
        
        conn = MySQLdb.connect(
            host=host,
            user=user,
            passwd=password,
            db=database
        )
        
        print("✅ Conexión exitosa a MySQL")
        
        # Verificar tabla sessions
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES LIKE 'sessions'")
        if cursor.fetchone():
            print("✅ Tabla 'sessions' existe")
            
            # Contar sesiones
            cursor.execute("SELECT COUNT(*) FROM sessions")
            count = cursor.fetchone()[0]
            print(f"   {count} sesión(es) en la base de datos")
            
            # Mostrar sesiones activas
            cursor.execute("""
                SELECT user_id, session_token, expires_at 
                FROM sessions 
                WHERE expires_at > NOW()
                ORDER BY expires_at DESC
                LIMIT 5
            """)
            active = cursor.fetchall()
            if active:
                print(f"   {len(active)} sesión(es) activa(s):")
                for user_id, token, expires in active:
                    print(f"     - User {user_id}: expira {expires}")
            else:
                print("   ⚠️ No hay sesiones activas")
        else:
            print("❌ Tabla 'sessions' NO existe")
            
        conn.close()
        
    except ImportError:
        print("❌ MySQLdb no instalado")
        print("   Instala: pip install mysqlclient")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

def check_flask_dependencies():
    print_header("3️⃣ VERIFICANDO DEPENDENCIAS DE FLASK")
    
    dependencies = [
        'flask',
        'flask_jwt_extended',
        'flask_mysqldb',
        'flask_cors',
        'python-dotenv'
    ]
    
    for dep in dependencies:
        try:
            __import__(dep)
            print(f"✅ {dep}")
        except ImportError:
            print(f"❌ {dep} NO instalado")

def check_server_status():
    print_header("4️⃣ VERIFICANDO ESTADO DEL SERVIDOR")
    
    try:
        import requests
        
        base_url = "http://192.168.80.1:5000"
        
        # Test 1: Servidor accesible
        try:
            response = requests.get(f"{base_url}/auth/login", timeout=2)
            print(f"✅ Servidor accesible en {base_url}")
        except requests.exceptions.ConnectionError:
            print(f"❌ Servidor NO accesible en {base_url}")
            print("   ⚠️ Asegúrate de que Flask esté corriendo")
            return
        except requests.exceptions.Timeout:
            print(f"⚠️ Servidor tardó demasiado en responder")
            return
            
    except ImportError:
        print("⚠️ requests no instalado (opcional)")
        print("   Instala: pip install requests")

def print_recommendations():
    print_header("📋 RECOMENDACIONES")
    
    print("Si tuviste errores, sigue estos pasos:")
    print()
    print("1. ❌ Error en .env:")
    print("   → Crea/verifica el archivo .env con JWT_SECRET_KEY")
    print()
    print("2. ❌ Error en base de datos:")
    print("   → Verifica que MySQL esté corriendo")
    print("   → Verifica las credenciales en .env")
    print("   → Ejecuta el script database.sql")
    print()
    print("3. ❌ Dependencias faltantes:")
    print("   → Activa el entorno virtual: .\\env\\Scripts\\activate")
    print("   → Instala: pip install -r requirements.txt")
    print()
    print("4. ❌ Servidor no accesible:")
    print("   → Inicia Flask: python app.py")
    print("   → Verifica que corra en el puerto 5000")
    print()
    print("5. ⚠️ No hay sesiones activas:")
    print("   → Haz login nuevamente desde el frontend")
    print("   → Los tokens expiran en 2 horas")

def main():
    print()
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║                                                           ║")
    print("║         🔍 DIAGNÓSTICO DE AUTENTICACIÓN - PotAI          ║")
    print("║                                                           ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    
    check_env_file()
    check_flask_dependencies()
    check_database_connection()
    check_server_status()
    print_recommendations()
    
    print()
    print("="*60)
    print("✅ Diagnóstico completado")
    print("="*60)
    print()

if __name__ == "__main__":
    main()
