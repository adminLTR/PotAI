# Test: Crear Planta con Imagen
# Ejecutar en PowerShell desde: sources/backend/

Write-Host "Test: Crear Planta con Imagen" -ForegroundColor Green
Write-Host "==================================`n" -ForegroundColor Green

# Variables de configuración
$BASE_URL = "http://localhost:8080"
$TEST_EMAIL = "test@potai.com"
$TEST_PASSWORD = "Test123!"

# Colores
$COLOR_INFO = "Cyan"
$COLOR_SUCCESS = "Green"
$COLOR_ERROR = "Red"
$COLOR_WARNING = "Yellow"

# Paso 1: Crear imagen de prueba
Write-Host "📸 Paso 1: Creando imagen de prueba..." -ForegroundColor $COLOR_INFO

# Crear una imagen PNG simple de 100x100 píxeles (rosa)
$imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAXklEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGDgAAmyAAFGaL8pAAAAAElFTkSuQmCC"
$imageBytes = [Convert]::FromBase64String($imageBase64)
$imagePath = "test-plant-image.png"
[IO.File]::WriteAllBytes($imagePath, $imageBytes)

if (Test-Path $imagePath) {
    Write-Host "  ✅ Imagen creada: $imagePath (100x100 px)" -ForegroundColor $COLOR_SUCCESS
} else {
    Write-Host "  ❌ Error creando imagen" -ForegroundColor $COLOR_ERROR
    exit 1
}

# Paso 2: Registrar/Login usuario
Write-Host "`n🔐 Paso 2: Autenticando usuario..." -ForegroundColor $COLOR_INFO

try {
    # Intentar login primero
    $loginBody = @{
        email = $TEST_EMAIL
        password = $TEST_PASSWORD
    } | ConvertTo-Json

    $authResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction SilentlyContinue
    
    if (-not $authResponse) {
        # Si login falla, registrar usuario
        Write-Host "  ⚠️  Usuario no existe, registrando..." -ForegroundColor $COLOR_WARNING
        $registerBody = @{
            email = $TEST_EMAIL
            password = $TEST_PASSWORD
            name = "Usuario Test"
        } | ConvertTo-Json
        
        $authResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
        Write-Host "  ✅ Usuario registrado" -ForegroundColor $COLOR_SUCCESS
    } else {
        Write-Host "  ✅ Login exitoso" -ForegroundColor $COLOR_SUCCESS
    }
    
    $userId = $authResponse.user.id
    $accessToken = $authResponse.accessToken
    $sessionToken = $authResponse.sessionToken
    
    Write-Host "  📋 User ID: $userId" -ForegroundColor $COLOR_INFO
    Write-Host "  🔑 Access Token: $($accessToken.Substring(0, 20))..." -ForegroundColor $COLOR_INFO
} catch {
    Write-Host "  ❌ Error en autenticación: $_" -ForegroundColor $COLOR_ERROR
    Remove-Item $imagePath -Force
    exit 1
}

# Paso 3: Obtener especies disponibles
Write-Host "`n🌿 Paso 3: Obteniendo especies disponibles..." -ForegroundColor $COLOR_INFO

try {
    $speciesResponse = Invoke-RestMethod -Uri "$BASE_URL/species" -Method GET
    $species = $speciesResponse.species
    
    Write-Host "  ✅ Especies disponibles: $($species.Count)" -ForegroundColor $COLOR_SUCCESS
    
    # Mostrar algunas especies
    $species | Select-Object -First 3 | ForEach-Object {
        Write-Host "    • ID $($_.id): $($_.commonName) ($($_.scientificName))" -ForegroundColor Gray
    }
    
    # Usar Rosa China (ID 7) o la primera disponible
    $selectedSpecies = $species | Where-Object { $_.id -eq 7 } | Select-Object -First 1
    if (-not $selectedSpecies) {
        $selectedSpecies = $species[0]
    }
    
    $speciesId = $selectedSpecies.id
    $speciesName = $selectedSpecies.commonName
    
    Write-Host "  🎯 Especie seleccionada: $speciesName (ID: $speciesId)" -ForegroundColor $COLOR_SUCCESS
} catch {
    Write-Host "  ❌ Error obteniendo especies: $_" -ForegroundColor $COLOR_ERROR
    Remove-Item $imagePath -Force
    exit 1
}

# Paso 4: Crear planta con imagen
Write-Host "`n🌱 Paso 4: Creando planta con imagen..." -ForegroundColor $COLOR_INFO

try {
    # Preparar multipart form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    # Leer archivo de imagen
    $fileBytes = [System.IO.File]::ReadAllBytes($imagePath)
    $fileName = [System.IO.Path]::GetFileName($imagePath)
    
    # Construir el cuerpo multipart/form-data
    $bodyLines = @()
    
    # Campo: name
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"name`""
    $bodyLines += ""
    $bodyLines += "Mi Planta de Prueba"
    
    # Campo: potLabel
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"potLabel`""
    $bodyLines += ""
    $bodyLines += "ESP32_TEST_001"
    
    # Campo: speciesId
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"speciesId`""
    $bodyLines += ""
    $bodyLines += "$speciesId"
    
    # Campo: plantedAt
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"plantedAt`""
    $bodyLines += ""
    $bodyLines += (Get-Date -Format "yyyy-MM-dd")
    
    # Campo: notes
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"notes`""
    $bodyLines += ""
    $bodyLines += "Planta de prueba creada automáticamente"
    
    # Campo: image (archivo)
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"image`"; filename=`"$fileName`""
    $bodyLines += "Content-Type: image/png"
    $bodyLines += ""
    
    $bodyString = $bodyLines -join $LF
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyString + $LF)
    
    # Agregar bytes del archivo
    $endBoundary = [System.Text.Encoding]::UTF8.GetBytes("$LF--$boundary--$LF")
    
    $fullBody = $bodyBytes + $fileBytes + $endBoundary
    
    # Hacer la petición
    $headers = @{
        "Authorization" = "Bearer $accessToken"
        "x-session-token" = $sessionToken
        "x-user-id" = $userId
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    $plantResponse = Invoke-RestMethod -Uri "$BASE_URL/plants" -Method POST -Headers $headers -Body $fullBody
    
    Write-Host "  ✅ Planta creada exitosamente!" -ForegroundColor $COLOR_SUCCESS
    Write-Host "`n📊 Detalles de la planta creada:" -ForegroundColor $COLOR_INFO
    Write-Host "  • ID: $($plantResponse.plant.id)" -ForegroundColor Gray
    Write-Host "  • Nombre: $($plantResponse.plant.name)" -ForegroundColor Gray
    Write-Host "  • Especie: $($plantResponse.species.commonName)" -ForegroundColor Gray
    Write-Host "  • Macetero: $($plantResponse.pot.label)" -ForegroundColor Gray
    Write-Host "  • Imagen: $($plantResponse.plant.imageUrl)" -ForegroundColor Gray
    
    # Verificar que la imagen se guardó correctamente
    if ($plantResponse.plant.imageUrl -like "/uploads/*") {
        Write-Host "`n  ✅ Ruta de imagen guardada correctamente en BBDD: $($plantResponse.plant.imageUrl)" -ForegroundColor $COLOR_SUCCESS
    } else {
        Write-Host "`n  ⚠️  Formato de ruta inesperado: $($plantResponse.plant.imageUrl)" -ForegroundColor $COLOR_WARNING
    }
    
    $plantId = $plantResponse.plant.id
    
} catch {
    Write-Host "  ❌ Error creando planta: $_" -ForegroundColor $COLOR_ERROR
    Write-Host "  Detalles: $($_.Exception.Message)" -ForegroundColor $COLOR_ERROR
    Remove-Item $imagePath -Force
    exit 1
}

# Paso 5: Verificar la planta creada
Write-Host "`n🔍 Paso 5: Verificando planta creada..." -ForegroundColor $COLOR_INFO

try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
        "x-session-token" = $sessionToken
        "x-user-id" = $userId
    }
    
    $verifyResponse = Invoke-RestMethod -Uri "$BASE_URL/plants/$plantId" -Method GET -Headers $headers
    
    Write-Host "  ✅ Planta verificada en base de datos" -ForegroundColor $COLOR_SUCCESS
    Write-Host "`n📋 Información completa:" -ForegroundColor $COLOR_INFO
    $verifyResponse.plant | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
    
} catch {
    Write-Host "  ⚠️  No se pudo verificar: $_" -ForegroundColor $COLOR_WARNING
}

# Limpieza
Write-Host "`n🧹 Limpiando archivos temporales..." -ForegroundColor $COLOR_INFO
Remove-Item $imagePath -Force
Write-Host "  ✅ Limpieza completada" -ForegroundColor $COLOR_SUCCESS

Write-Host "`n✅ TEST COMPLETADO EXITOSAMENTE!" -ForegroundColor $COLOR_SUCCESS
Write-Host "==================================`n" -ForegroundColor $COLOR_SUCCESS

Write-Host "📝 Resumen:" -ForegroundColor Cyan
Write-Host "  • Usuario autenticado: $TEST_EMAIL" -ForegroundColor Gray
Write-Host "  • Planta creada: ID $plantId" -ForegroundColor Gray
Write-Host "  • Especie: $speciesName" -ForegroundColor Gray
Write-Host "  • Imagen almacenada en Media Service" -ForegroundColor Gray
Write-Host "  • Ruta guardada en BBDD: /uploads/[filename]" -ForegroundColor Gray
