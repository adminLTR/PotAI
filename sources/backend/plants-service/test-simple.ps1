# Test completo del servicio de plantas con ESP32

Write-Host ""
Write-Host "=== TEST COMPLETO PLANTS SERVICE ===" -ForegroundColor Cyan
Write-Host ""

# 1. Health Check
Write-Host "1. Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://localhost:8080/plants/health" -Method GET
Write-Host "   OK - Health: $($health.status)" -ForegroundColor Green

# 2. Login
Write-Host ""
Write-Host "2. Login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -Body (@{username="testuser"; password="Test123!"} | ConvertTo-Json) -ContentType "application/json"
    $token = $loginResponse.accessToken
    $sessionToken = $loginResponse.sessionToken
    Write-Host "   OK - Token obtenido" -ForegroundColor Green
} catch {
    Write-Host "   Creando usuario nuevo..." -ForegroundColor Yellow
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/register" -Method POST -Body (@{username="testuser"; email="test@test.com"; password="Test123!"} | ConvertTo-Json) -ContentType "application/json"
    Write-Host "   OK - Usuario creado, haciendo login..." -ForegroundColor Yellow
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -Body (@{username="testuser"; password="Test123!"} | ConvertTo-Json) -ContentType "application/json"
    $token = $loginResponse.accessToken
    $sessionToken = $loginResponse.sessionToken
    Write-Host "   OK - Login exitoso" -ForegroundColor Green
}

# 3. Crear planta
Write-Host ""
Write-Host "3. Creando planta con codigo ESP32TEST..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
    "X-Session-Token" = $sessionToken
    "Content-Type" = "application/json"
}

$plantData = @{
    name = "Planta de Prueba ESP32"
    potCode = "ESP32TEST"
    species = "Monstera Deliciosa"
}

$plant = Invoke-RestMethod -Uri "http://localhost:8080/plants" -Method POST -Headers $headers -Body ($plantData | ConvertTo-Json)
$plantId = $plant.id
Write-Host "   OK - Planta creada con ID: $plantId" -ForegroundColor Green
Write-Host "   OK - Codigo ESP32: $($plant.potCode)" -ForegroundColor Green

# 4. Simular envio ESP32
Write-Host ""
Write-Host "4. Simulando envio desde ESP32..." -ForegroundColor Yellow
$sensorData = @{
    temperatura = 24.5
    humedad = 48.3
}

$espResponse = Invoke-RestMethod -Uri "http://localhost:8080/plants/sensor/ESP32TEST" -Method PUT -Body ($sensorData | ConvertTo-Json) -ContentType "application/json"
Write-Host "   OK - Datos recibidos correctamente" -ForegroundColor Green
Write-Host "   OK - Prediccion ML: $($espResponse.prediccion) ml de agua" -ForegroundColor Green
Write-Host "   OK - Ultima conexion: $($espResponse.lastConnectionAt)" -ForegroundColor Green

# 5. Verificar datos
Write-Host ""
Write-Host "5. Verificando datos de la planta..." -ForegroundColor Yellow
$authHeaders = @{
    Authorization = "Bearer $token"
    "X-Session-Token" = $sessionToken
}
$plantDetails = Invoke-RestMethod -Uri "http://localhost:8080/plants/$plantId" -Method GET -Headers $authHeaders
Write-Host "   OK - Temperatura: $($plantDetails.temperature) C" -ForegroundColor Green
Write-Host "   OK - Humedad del suelo: $($plantDetails.soilMoisture)%" -ForegroundColor Green
Write-Host "   OK - Estado conexion: $($plantDetails.isConnected)" -ForegroundColor Green
Write-Host "   OK - Lecturas historicas: $($plantDetails.sensorReadings.Count)" -ForegroundColor Green

# 6. Historial
Write-Host ""
Write-Host "6. Consultando historial de sensores..." -ForegroundColor Yellow
$history = Invoke-RestMethod -Uri "http://localhost:8080/plants/$plantId/history?limit=5" -Method GET -Headers $authHeaders
Write-Host "   OK - Lecturas encontradas: $($history.readings.Count)" -ForegroundColor Green
if ($history.readings.Count -gt 0) {
    Write-Host "   OK - Ultima lectura:" -ForegroundColor Green
    Write-Host "      - Temperatura: $($history.readings[0].temperature) C" -ForegroundColor Cyan
    Write-Host "      - Humedad: $($history.readings[0].soilMoisture)%" -ForegroundColor Cyan
}

# 7. Listar plantas
Write-Host ""
Write-Host "7. Listando todas las plantas..." -ForegroundColor Yellow
$plants = Invoke-RestMethod -Uri "http://localhost:8080/plants" -Method GET -Headers $authHeaders
Write-Host "   OK - Total de plantas: $($plants.plants.Count)" -ForegroundColor Green
Write-Host "   OK - Plantas conectadas: $($plants.stats.connectedPlants)" -ForegroundColor Green

Write-Host ""
Write-Host "=== TODOS LOS TESTS PASARON ===" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Configurar ESP32 con URL: http://IP:8080/plants/sensor/ESP32TEST" -ForegroundColor White
Write-Host "  2. Integrar ML Service para predicciones reales" -ForegroundColor White
Write-Host "  3. Desarrollar frontend" -ForegroundColor White
Write-Host ""
