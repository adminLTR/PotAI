# Guía paso a paso para probar el endpoint POST /plants
# Usar estos comandos directamente en PowerShell

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host " GUÍA: Test de Endpoint POST /plants" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

Write-Host "PASO 1: Registrar usuario" -ForegroundColor Yellow
Write-Host "---------------------------------------" -ForegroundColor Gray
$cmd1 = @'
curl.exe -X POST http://localhost:8080/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@potai.com\",\"password\":\"Test123!\",\"username\":\"testuser\",\"name\":\"Test User\"}'
'@
Write-Host $cmd1 -ForegroundColor White
Write-Host "`nEjecuta este comando y guarda el accessToken, sessionToken y user.id`n" -ForegroundColor Green

Write-Host "`nPASO 2: Obtener lista de especies" -ForegroundColor Yellow
Write-Host "---------------------------------------" -ForegroundColor Gray
$cmd2 = @'
curl.exe -X GET http://localhost:8080/species
'@
Write-Host $cmd2 -ForegroundColor White
Write-Host "`nGuarda el ID de una especie (ejemplo: 7 para Rosa China)`n" -ForegroundColor Green

Write-Host "`nPASO 3: Crear imagen de prueba" -ForegroundColor Yellow
Write-Host "---------------------------------------" -ForegroundColor Gray
$cmd3 = @'
# Crear imagen PNG simple (100x100 px rosa)
$pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAXklEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGDgAAmyAAFGaL8pAAAAAElFTkSuQmCC"
$imageBytes = [Convert]::FromBase64String($pngBase64)
[IO.File]::WriteAllBytes("test-plant.png", $imageBytes)
'@
Write-Host $cmd3 -ForegroundColor White
Write-Host "`nEsto crea el archivo test-plant.png`n" -ForegroundColor Green

Write-Host "`nPASO 4: Crear planta con imagen" -ForegroundColor Yellow
Write-Host "---------------------------------------" -ForegroundColor Gray
$cmd4 = @'
curl.exe -X POST http://localhost:8080/plants ^
  -H "Authorization: Bearer TU_ACCESS_TOKEN" ^
  -H "x-session-token: TU_SESSION_TOKEN" ^
  -H "x-user-id: TU_USER_ID" ^
  -F "name=Mi Rosa China" ^
  -F "potLabel=ESP32_TEST_001" ^
  -F "speciesId=7" ^
  -F "plantedAt=2025-11-22" ^
  -F "notes=Planta de prueba" ^
  -F "image=@test-plant.png"
'@
Write-Host $cmd4 -ForegroundColor White
Write-Host "`nReemplaza TU_ACCESS_TOKEN, TU_SESSION_TOKEN y TU_USER_ID con tus valores del PASO 1" -ForegroundColor Green
Write-Host "Reemplaza speciesId=7 con el ID que obtuviste en el PASO 2`n" -ForegroundColor Green

Write-Host "`nPASO 5: Verificar planta creada" -ForegroundColor Yellow
Write-Host "---------------------------------------" -ForegroundColor Gray
$cmd5 = @'
curl.exe -X GET http://localhost:8080/plants/PLANT_ID ^
  -H "Authorization: Bearer TU_ACCESS_TOKEN" ^
  -H "x-session-token: TU_SESSION_TOKEN" ^
  -H "x-user-id: TU_USER_ID"
'@
Write-Host $cmd5 -ForegroundColor White
Write-Host "`nReemplaza PLANT_ID con el ID devuelto en el PASO 4`n" -ForegroundColor Green

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host " EJEMPLO COMPLETO CON DATOS REALES" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

Write-Host "1. Ejecuta el registro:" -ForegroundColor Yellow
Write-Host 'curl.exe -X POST http://localhost:8080/auth/register -H "Content-Type: application/json" -d "{\""email\"":\""test@potai.com\"",\""password\"":\""Test123!\"",\""username\"":\""testuser\"",\""name\"":\""Test User\""}"' -ForegroundColor White

Write-Host "`n2. Copia los valores devueltos" -ForegroundColor Yellow
Write-Host "   accessToken: eyJhbGc..." -ForegroundColor Gray
Write-Host "   sessionToken: abc123..." -ForegroundColor Gray
Write-Host "   user.id: 1" -ForegroundColor Gray

Write-Host "`n3. Crea la imagen:" -ForegroundColor Yellow
Write-Host '$pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAXklEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGDgAAmyAAFGaL8pAAAAAElFTkSuQmCC"; $imageBytes = [Convert]::FromBase64String($pngBase64); [IO.File]::WriteAllBytes("test-plant.png", $imageBytes)' -ForegroundColor White

Write-Host "`n4. Crea la planta (reemplaza los valores):" -ForegroundColor Yellow
Write-Host 'curl.exe -X POST http://localhost:8080/plants -H "Authorization: Bearer TU_TOKEN" -H "x-session-token: TU_SESSION" -H "x-user-id: 1" -F "name=Mi Rosa China" -F "potLabel=ESP32_TEST_001" -F "speciesId=7" -F "plantedAt=2025-11-22" -F "notes=Test" -F "image=@test-plant.png"' -ForegroundColor White

Write-Host "`n5. Resultado esperado:" -ForegroundColor Yellow
Write-Host '{
  "plant": {
    "id": 1,
    "name": "Mi Rosa China",
    "imageUrl": "/uploads/1234567-test-plant.png",
    ...
  },
  "pot": { ... },
  "species": { ... }
}' -ForegroundColor Green

Write-Host "`nNota: El campo 'imageUrl' debe contener /uploads/filename" -ForegroundColor Cyan
Write-Host "      Este es el formato guardado en la base de datos`n" -ForegroundColor Cyan
