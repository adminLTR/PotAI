# Test simple con curl en PowerShell
# Crear Planta con Imagen

$BASE_URL = "http://localhost:8080"
$TEST_EMAIL = "test@potai.com"
$TEST_PASSWORD = "Test123!"

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  Test: Crear Planta con Imagen" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Paso 1: Login
Write-Host "`n[1/5] Autenticando usuario..." -ForegroundColor Yellow

$loginJson = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method POST -Body $loginJson -ContentType "application/json"
} catch {
    Write-Host "  Usuario no existe, registrando..." -ForegroundColor Gray
    $registerJson = @{
        email = $TEST_EMAIL
        password = $TEST_PASSWORD
        name = "Usuario Test"
    } | ConvertTo-Json
    $authResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method POST -Body $registerJson -ContentType "application/json"
}

$userId = $authResponse.user.id
$accessToken = $authResponse.accessToken
$sessionToken = $authResponse.sessionToken

Write-Host "  User ID: $userId" -ForegroundColor Green
Write-Host "  Token: $($accessToken.Substring(0, 20))..." -ForegroundColor Green

# Paso 2: Obtener especies
Write-Host "`n[2/5] Obteniendo especies..." -ForegroundColor Yellow

$speciesResponse = Invoke-RestMethod -Uri "$BASE_URL/species" -Method GET
$species = $speciesResponse.species | Where-Object { $_.id -eq 7 }
if (-not $species) {
    $species = $speciesResponse.species[0]
}

$speciesId = $species.id
$speciesName = $species.commonName

Write-Host "  Especie: $speciesName (ID: $speciesId)" -ForegroundColor Green

# Paso 3: Crear imagen de prueba
Write-Host "`n[3/5] Creando imagen de prueba..." -ForegroundColor Yellow

# Crear PNG simple 100x100 (rosa)
$pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAXklEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGDgAAmyAAFGaL8pAAAAAElFTkSuQmCC"
$imageBytes = [Convert]::FromBase64String($pngBase64)
$imagePath = "test-plant-temp.png"
[IO.File]::WriteAllBytes($imagePath, $imageBytes)

Write-Host "  Imagen creada: $imagePath" -ForegroundColor Green

# Paso 4: Crear planta usando curl (más confiable para multipart)
Write-Host "`n[4/5] Creando planta con curl..." -ForegroundColor Yellow

$curlCommand = @"
curl.exe -X POST "$BASE_URL/plants" `
  -H "Authorization: Bearer $accessToken" `
  -H "x-session-token: $sessionToken" `
  -H "x-user-id: $userId" `
  -F "name=Mi Planta de Prueba" `
  -F "potLabel=ESP32_TEST_001" `
  -F "speciesId=$speciesId" `
  -F "plantedAt=$(Get-Date -Format 'yyyy-MM-dd')" `
  -F "notes=Planta de prueba automatica" `
  -F "image=@$imagePath"
"@

Write-Host "  Ejecutando curl..." -ForegroundColor Gray

$plantResponseRaw = Invoke-Expression $curlCommand
$plantResponse = $plantResponseRaw | ConvertFrom-Json

Write-Host "`n  Planta creada!" -ForegroundColor Green
Write-Host "  ID: $($plantResponse.plant.id)" -ForegroundColor Cyan
Write-Host "  Nombre: $($plantResponse.plant.name)" -ForegroundColor Cyan
Write-Host "  Especie: $($plantResponse.species.commonName)" -ForegroundColor Cyan
Write-Host "  Macetero: $($plantResponse.pot.label)" -ForegroundColor Cyan
Write-Host "  Imagen URL: $($plantResponse.plant.imageUrl)" -ForegroundColor Cyan

$plantId = $plantResponse.plant.id
$imageUrl = $plantResponse.plant.imageUrl

# Verificar ruta
if ($imageUrl -like "/uploads/*") {
    Write-Host "`n  Ruta de imagen correcta en BBDD!" -ForegroundColor Green
} else {
    Write-Host "`n  Advertencia: Formato de ruta inesperado" -ForegroundColor Yellow
}

# Paso 5: Verificar planta
Write-Host "`n[5/5] Verificando planta en BBDD..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "x-session-token" = $sessionToken
    "x-user-id" = $userId
}

$verifyResponse = Invoke-RestMethod -Uri "$BASE_URL/plants/$plantId" -Method GET -Headers $headers

Write-Host "`nDatos completos de la planta:" -ForegroundColor Gray
$verifyResponse.plant | Format-List

# Limpieza
Remove-Item $imagePath -Force -ErrorAction SilentlyContinue

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`nResumen:" -ForegroundColor White
Write-Host "  Usuario: $TEST_EMAIL" -ForegroundColor Gray
Write-Host "  Planta ID: $plantId" -ForegroundColor Gray
Write-Host "  Especie: $speciesName" -ForegroundColor Gray
Write-Host "  Imagen guardada: $imageUrl" -ForegroundColor Gray
Write-Host "  Ruta en BBDD: /uploads/[filename]`n" -ForegroundColor Gray
