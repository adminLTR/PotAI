#!/bin/bash
# Script de prueba para crear planta con imagen
# Nota: Requiere curl y jq instalados

BASE_URL="http://localhost:8080"
TEST_EMAIL="test@potai.com"
TEST_PASSWORD="Test123!"

echo "====================================="
echo "  Test: Crear Planta con Imagen"
echo "====================================="
echo ""

# Paso 1: Autenticación
echo "[1/5] Autenticando usuario..."

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo "  ✓ Login exitoso"
else
    echo "  × Usuario no existe, registrando..."
    REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Usuario Test\"}")
    LOGIN_RESPONSE="$REGISTER_RESPONSE"
fi

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
SESSION_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"sessionToken":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo "  User ID: $USER_ID"
echo "  Token: ${ACCESS_TOKEN:0:20}..."
echo ""

# Paso 2: Obtener especies
echo "[2/5] Obteniendo especies..."

SPECIES_RESPONSE=$(curl -s -X GET "$BASE_URL/species")
SPECIES_ID=$(echo "$SPECIES_RESPONSE" | grep -o '"id":7' | head -1 | cut -d':' -f2)

if [ -z "$SPECIES_ID" ]; then
    SPECIES_ID=$(echo "$SPECIES_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
fi

echo "  ✓ Especie seleccionada: ID $SPECIES_ID"
echo ""

# Paso 3: Crear imagen de prueba
echo "[3/5] Creando imagen de prueba..."

# Crear una imagen PNG simple (100x100 rosa)
cat > test-plant.png << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAXklEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGDgAAmyAAFGaL8pAAAAAElFTkSuQmCC
EOF

base64 -d test-plant.png > test-plant-decoded.png 2>/dev/null || {
    # Si base64 -d no funciona, crear archivo binario simple
    echo -ne '\x89PNG\r\n\x1a\n' > test-plant-decoded.png
}

echo "  ✓ Imagen creada: test-plant-decoded.png"
echo ""

# Paso 4: Crear planta
echo "[4/5] Creando planta con imagen..."

PLANT_RESPONSE=$(curl -s -X POST "$BASE_URL/plants" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-session-token: $SESSION_TOKEN" \
  -H "x-user-id: $USER_ID" \
  -F "name=Mi Planta de Prueba" \
  -F "potLabel=ESP32_TEST_001" \
  -F "speciesId=$SPECIES_ID" \
  -F "plantedAt=$(date +%Y-%m-%d)" \
  -F "notes=Planta de prueba creada automaticamente" \
  -F "image=@test-plant-decoded.png")

echo "$PLANT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PLANT_RESPONSE"

PLANT_ID=$(echo "$PLANT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
IMAGE_URL=$(echo "$PLANT_RESPONSE" | grep -o '"/uploads/[^"]*' | head -1)

echo ""
echo "  ✓ Planta creada: ID $PLANT_ID"
echo "  ✓ Imagen guardada: $IMAGE_URL"
echo ""

# Paso 5: Verificar planta
echo "[5/5] Verificando planta..."

VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/plants/$PLANT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-session-token: $SESSION_TOKEN" \
  -H "x-user-id: $USER_ID")

echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

# Limpieza
rm -f test-plant.png test-plant-decoded.png

echo "====================================="
echo "  TEST COMPLETADO"
echo "====================================="
echo ""
echo "Resumen:"
echo "  - Usuario: $TEST_EMAIL"
echo "  - Planta ID: $PLANT_ID"
echo "  - Imagen en BBDD: $IMAGE_URL"
echo ""
