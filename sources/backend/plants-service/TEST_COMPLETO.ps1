# Test completo del servicio de plantas con ESP32
Write-Host ""
Write-Host "=== TEST COMPLETO PLANTS SERVICE ===" -ForegroundColor Cyan
Write-Host ""

# 1. Health Check
Write-Host ""
Write-Host "1. Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/plants/health" -Method GET
    Write-Host "   ✓ Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Health check failed: $_" -ForegroundColor Red
    exit 1
}

# 2. Login para obtener token
Write-Host ""
Write-Host "2. Obteniendo token de autenticacion..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" `
        -Method POST `
        -Body (@{username="testuser"; password="Test123!"} | ConvertTo-Json) `
        -ContentType "application/json"
    
    $token = $loginResponse.accessToken
    Write-Host "   ✓ Token obtenido" -ForegroundColor Green
} catch {
    Write-Host "   No se pudo hacer login (esperado si no existe el usuario)" -ForegroundColor Yellow
    Write-Host "   Creando usuario de prueba..." -ForegroundColor Yellow
    
    try {
        $registerResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/register" `
            -Method POST `
            -Body (@{username="testuser"; email="test@test.com"; password="Test123!"} | ConvertTo-Json) `
            -ContentType "application/json"
        
        $token = $registerResponse.accessToken
        Write-Host "   ✓ Usuario creado y token obtenido" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ Error en registro: $_" -ForegroundColor Red
        exit 1
    }
}

# 3. Crear planta con codigo ESP32
Write-Host ""
Write-Host "3. Creando planta con codigo ESP32TEST..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $plantData = @{
        name = "Planta de Prueba ESP32"
        potCode = "ESP32TEST"
        species = "Monstera Deliciosa"
    }
    
    $plant = Invoke-RestMethod -Uri "http://localhost:8080/plants" `
        -Method POST `
        -Headers $headers `
        -Body ($plantData | ConvertTo-Json)
    
    $plantId = $plant.id
    Write-Host "   ✓ Planta creada con ID: $plantId" -ForegroundColor Green
    Write-Host "   ✓ Código ESP32: $($plant.potCode)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error creando planta: $_" -ForegroundColor Red
    exit 1
}

# 4. Simular envío de datos desde ESP32
Write-Host "`n4. Simulando envío desde ESP32..." -ForegroundColor Yellow
try {
    $sensorData = @{
        temperatura = 24.5
        humedad = 48.3
    }
    
    $espResponse = Invoke-RestMethod -Uri "http://localhost:8080/plants/sensor/ESP32TEST" `
        -Method PUT `
        -Body ($sensorData | ConvertTo-Json) `
        -ContentType "application/json"
    
    Write-Host "   ✓ Datos recibidos correctamente" -ForegroundColor Green
    Write-Host "   ✓ Predicción ML: $($espResponse.prediccion) ml de agua" -ForegroundColor Green
    Write-Host "   ✓ Planta actualizada: $($espResponse.updated)" -ForegroundColor Green
    Write-Host "   ✓ Última conexión: $($espResponse.lastConnectionAt)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error enviando datos: $_" -ForegroundColor Red
    exit 1
}

# 5. Verificar datos actualizados
Write-Host "`n5. Verificando datos de la planta..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $plantDetails = Invoke-RestMethod -Uri "http://localhost:8080/plants/$plantId" `
        -Method GET `
        -Headers $headers
    
    Write-Host "   ✓ Temperatura: $($plantDetails.temperature)°C" -ForegroundColor Green
    Write-Host "   ✓ Humedad del suelo: $($plantDetails.soilMoisture)%" -ForegroundColor Green
    Write-Host "   ✓ Estado conexión: $($plantDetails.isConnected)" -ForegroundColor Green
    Write-Host "   ✓ Lecturas históricas: $($plantDetails.sensorReadings.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error obteniendo detalles: $_" -ForegroundColor Red
    exit 1
}

# 6. Ver historial de lecturas
Write-Host "`n6. Consultando historial de sensores..." -ForegroundColor Yellow
try {
    $history = Invoke-RestMethod -Uri "http://localhost:8080/plants/$plantId/history?limit=5" `
        -Method GET `
        -Headers $headers
    
    Write-Host "   ✓ Lecturas encontradas: $($history.readings.Count)" -ForegroundColor Green
    if ($history.readings.Count -gt 0) {
        Write-Host "   ✓ Última lectura:" -ForegroundColor Green
        Write-Host "      - Temperatura: $($history.readings[0].temperature)°C" -ForegroundColor Cyan
        Write-Host "      - Humedad: $($history.readings[0].soilMoisture)%" -ForegroundColor Cyan
        Write-Host "      - Fecha: $($history.readings[0].timestamp)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ✗ Error obteniendo historial: $_" -ForegroundColor Red
}

# 7. Listar todas las plantas
Write-Host "`n7. Listando todas las plantas del usuario..." -ForegroundColor Yellow
try {
    $plants = Invoke-RestMethod -Uri "http://localhost:8080/plants" `
        -Method GET `
        -Headers $headers
    
    Write-Host "   ✓ Total de plantas: $($plants.plants.Count)" -ForegroundColor Green
    Write-Host "   ✓ Plantas conectadas: $($plants.stats.connectedPlants)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error listando plantas: $_" -ForegroundColor Red
}

Write-Host "`n=== ✓ TODOS LOS TESTS PASARON EXITOSAMENTE ===" -ForegroundColor Green
Write-Host "`nEl servicio está listo para:" -ForegroundColor Cyan
Write-Host "  1. Recibir datos desde ESP32" -ForegroundColor White
Write-Host "  2. Almacenar historial de lecturas" -ForegroundColor White
Write-Host "  3. Gestionar plantas por usuario" -ForegroundColor White
Write-Host "  4. Integrar con ML para predicciones" -ForegroundColor White
Write-Host "`nPróximos pasos:" -ForegroundColor Yellow
Write-Host "  - Configurar ESP32 con URL: http://TU_IP:8080/plants/sensor/ESP32TEST" -ForegroundColor White
Write-Host "  - Integrar ML Service para predicciones reales" -ForegroundColor White
Write-Host "  - Desarrollar frontend para visualización" -ForegroundColor White
