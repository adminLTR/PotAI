"""
Script de prueba para verificar que la autenticación funcione correctamente
"""
import requests
import json

BASE_URL = "http://192.168.80.1:5000"

def test_login():
    print("\n" + "="*50)
    print("PRUEBA DE AUTENTICACIÓN")
    print("="*50)
    
    # Test 1: Login
    print("\n1️⃣ Intentando hacer login...")
    login_url = f"{BASE_URL}/auth/login"
    
    # Cambia estos valores por tus credenciales reales
    username = input("Ingresa tu username: ")
    password = input("Ingresa tu password: ")
    
    login_data = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(login_url, json=login_data)
        print(f"\n📡 Status Code: {response.status_code}")
        print(f"📦 Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get('access_token')
            session_token = data.get('session_token')
            
            print("\n✅ Login exitoso!")
            print(f"   - Access Token: {access_token[:50]}...")
            print(f"   - Session Token: {session_token[:50]}...")
            
            # Test 2: Verificar endpoint protegido
            print("\n2️⃣ Probando endpoint protegido /plants...")
            plants_url = f"{BASE_URL}/plants"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'X-Session-Token': session_token
            }
            
            plants_response = requests.get(plants_url, headers=headers)
            print(f"\n📡 Status Code: {plants_response.status_code}")
            print(f"📦 Response: {json.dumps(plants_response.json(), indent=2)}")
            
            if plants_response.status_code == 200:
                print("\n✅ ¡Autenticación funcionando correctamente!")
            else:
                print("\n❌ Error en endpoint protegido")
        else:
            print("\n❌ Login fallido")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    test_login()
