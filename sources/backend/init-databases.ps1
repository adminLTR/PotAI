# Script PowerShell para inicializar bases de datos
# Ejecutar desde: sources\backend\

Write-Host "Inicializando bases de datos..." -ForegroundColor Cyan

# Crear bases de datos shadow
docker-compose exec plants-db mysql -u root -prootpass -e 'CREATE DATABASE IF NOT EXISTS potai_plants_shadow;' 2>$null
docker-compose exec pots-db mysql -u root -prootpass -e 'CREATE DATABASE IF NOT EXISTS potai_pots_shadow;' 2>$null
docker-compose exec iot-db mysql -u root -prootpass -e 'CREATE DATABASE IF NOT EXISTS potai_iot_shadow;' 2>$null
docker-compose exec species-db mysql -u root -prootpass -e 'CREATE DATABASE IF NOT EXISTS potai_species_shadow;' 2>$null

Write-Host "Bases de datos shadow creadas" -ForegroundColor Green

# Servicios
$services = @("plants-service", "pots-service", "iot-service", "species-service")

foreach ($service in $services) {
    Write-Host "Procesando $service..." -ForegroundColor Cyan
    Push-Location $service
    
    if (Test-Path "prisma\migrations") {
        Write-Host "Migraciones ya existen" -ForegroundColor Green
    } else {
        Write-Host "Creando migracion..." -ForegroundColor Yellow
        npx prisma migrate dev --name init
    }
    
    Pop-Location
}

Write-Host "Listo!" -ForegroundColor Green
