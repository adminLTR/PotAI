# Test Plants Service

Write-Host "🌱 Testing Plants Service..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8080/plants"

# 1. Health Check
Write-Host "1️⃣ Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# 2. Simular ESP32 enviando datos (sin autenticación)
Write-Host "2️⃣ Testing ESP32 Sensor Update..." -ForegroundColor Yellow
try {
    $sensorData = @{
        temperatura = 24.5
        humedad = 45.2
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/sensor/ESP32TEST" -Method Put -Body $sensorData -ContentType "application/json"
    Write-Host "⚠️  Expected: 404 (pot code not registered yet)" -ForegroundColor Yellow
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorDetails.error -like "*not found*") {
        Write-Host "✅ Correct: Pot code not registered (expected)" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($errorDetails.error)" -ForegroundColor Red
    }
}
Write-Host ""

# 3. Intentar crear planta sin autenticación
Write-Host "3️⃣ Testing Create Plant without Auth..." -ForegroundColor Yellow
try {
    $plantData = @{
        potCode = "ESP32TEST"
        name = "Test Plant"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $plantData -ContentType "application/json"
    Write-Host "❌ Should have required authentication" -ForegroundColor Red
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorDetails.error -like "*authentication*") {
        Write-Host "✅ Correctly requires authentication" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Different error: $($errorDetails.error)" -ForegroundColor Yellow
    }
}
Write-Host ""

# 4. Información del servicio
Write-Host "4️⃣ Getting Service Info..." -ForegroundColor Yellow
try {
    $info = Invoke-RestMethod -Uri "http://localhost:8080/plants/" -Method Get
    Write-Host "✅ Service: $($info.service) v$($info.version)" -ForegroundColor Green
    Write-Host "   Description: $($info.description)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📚 Available Endpoints:" -ForegroundColor Cyan
    Write-Host "   🔓 Public (ESP32):" -ForegroundColor White
    Write-Host "      PUT /sensor/:potCode - Update sensor data" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   🔐 Protected (require auth):" -ForegroundColor White
    Write-Host "      POST / - Create plant" -ForegroundColor Gray
    Write-Host "      GET / - Get all user plants" -ForegroundColor Gray
    Write-Host "      GET /:id - Get plant by ID" -ForegroundColor Gray
    Write-Host "      PUT /:id - Update plant" -ForegroundColor Gray
    Write-Host "      DELETE /:id - Delete plant" -ForegroundColor Gray
    Write-Host "      GET /:id/history - Get sensor history" -ForegroundColor Gray
    Write-Host "      GET /:id/stats - Get plant statistics" -ForegroundColor Gray
    Write-Host "      GET /pot/:potCode - Get plant by pot code" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to get service info: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "✨ Basic tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Login to get authentication token" -ForegroundColor White
Write-Host "   2. Create a plant with the token" -ForegroundColor White
Write-Host "   3. ESP32 sends sensor data to /sensor/:potCode" -ForegroundColor White
Write-Host "   4. Get plant list and sensor history" -ForegroundColor White
Write-Host ""
Write-Host "📖 See README_PLANTS.md for detailed examples" -ForegroundColor Cyan
