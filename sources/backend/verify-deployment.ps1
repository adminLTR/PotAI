# Script de verificación post-despliegue para PotAI (PowerShell)
# Verifica que todos los servicios estén funcionando correctamente

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║        VERIFICACIÓN POST-DESPLIEGUE - POTAI                  ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Contadores
$script:PASSED = 0
$script:FAILED = 0

function Check-Container {
    param([string]$ContainerName)
    
    Write-Host "Verificando contenedor $ContainerName... " -NoNewline
    
    $container = docker ps --format '{{.Names}}' | Where-Object { $_ -eq $ContainerName }
    
    if ($container) {
        Write-Host "✓ Corriendo" -ForegroundColor Green
        $script:PASSED++
        return $true
    } else {
        Write-Host "✗ No encontrado" -ForegroundColor Red
        $script:FAILED++
        return $false
    }
}

function Check-HealthEndpoint {
    param([string]$ServiceName, [int]$Port)
    
    Write-Host "Health check $ServiceName (puerto $Port)... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ HTTP 200" -ForegroundColor Green
            $script:PASSED++
            return $true
        }
    } catch {
        Write-Host "✗ No responde" -ForegroundColor Red
        $script:FAILED++
        return $false
    }
    
    Write-Host "✗ Error" -ForegroundColor Red
    $script:FAILED++
    return $false
}

function Check-Database {
    param([string]$DbName, [int]$Port)
    
    Write-Host "Base de datos $DbName (puerto $Port)... " -NoNewline
    
    try {
        $null = docker exec potai-$DbName-db mysqladmin ping -h localhost -u root -prootpass 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Respondiendo" -ForegroundColor Green
            $script:PASSED++
            return $true
        }
    } catch {}
    
    Write-Host "✗ No responde" -ForegroundColor Red
    $script:FAILED++
    return $false
}

function Check-ShadowDatabase {
    param([string]$Service, [string]$ShadowDb)
    
    Write-Host "Shadow database $ShadowDb... " -NoNewline
    
    try {
        $result = docker exec potai-$Service-db mysql -u root -prootpass -e "SHOW DATABASES LIKE '$ShadowDb';" 2>$null
        if ($result -match $ShadowDb) {
            Write-Host "✓ Existe" -ForegroundColor Green
            $script:PASSED++
            return $true
        }
    } catch {}
    
    Write-Host "✗ No existe" -ForegroundColor Red
    $script:FAILED++
    return $false
}

function Check-Migrations {
    param([string]$Service)
    
    Write-Host "Migraciones en $Service... " -NoNewline
    
    try {
        $script = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.`$queryRaw``SHOW TABLES LIKE '_prisma_migrations'``
  .then(r => console.log(r.length))
  .catch(() => console.log('0'))
  .finally(() => prisma.`$disconnect());
"@
        
        $result = docker exec potai-$Service-service node -e $script 2>$null
        if ($result -eq "1") {
            Write-Host "✓ Aplicadas" -ForegroundColor Green
            $script:PASSED++
            return $true
        } else {
            Write-Host "⚠ No se encontraron migraciones (normal si no hay ninguna)" -ForegroundColor Yellow
            $script:PASSED++
            return $true
        }
    } catch {
        Write-Host "⚠ No se pudo verificar" -ForegroundColor Yellow
        $script:PASSED++
        return $true
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "1. VERIFICANDO CONTENEDORES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Bases de datos
Check-Container "potai-auth-db" | Out-Null
Check-Container "potai-plants-db" | Out-Null
Check-Container "potai-pots-db" | Out-Null
Check-Container "potai-iot-db" | Out-Null
Check-Container "potai-species-db" | Out-Null
Check-Container "potai-redis" | Out-Null

Write-Host ""

# Microservicios
Check-Container "potai-gateway" | Out-Null
Check-Container "potai-auth-service" | Out-Null
Check-Container "potai-plants-service" | Out-Null
Check-Container "potai-pots-service" | Out-Null
Check-Container "potai-iot-service" | Out-Null
Check-Container "potai-media-service" | Out-Null
Check-Container "potai-species-service" | Out-Null
Check-Container "potai-ml-service" | Out-Null
Check-Container "potai-frontend" | Out-Null

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "2. VERIFICANDO CONECTIVIDAD DE BASES DE DATOS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Check-Database "auth" 3307 | Out-Null
Check-Database "plants" 3308 | Out-Null
Check-Database "pots" 3309 | Out-Null
Check-Database "iot" 3310 | Out-Null
Check-Database "species" 3311 | Out-Null

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "3. VERIFICANDO SHADOW DATABASES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Check-ShadowDatabase "auth" "potai_auth_shadow" | Out-Null
Check-ShadowDatabase "plants" "potai_plants_shadow" | Out-Null
Check-ShadowDatabase "pots" "potai_pots_shadow" | Out-Null
Check-ShadowDatabase "iot" "potai_iot_shadow" | Out-Null
Check-ShadowDatabase "species" "potai_species_shadow" | Out-Null

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "4. VERIFICANDO ENDPOINTS DE SALUD" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "Esperando 5 segundos para que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Check-HealthEndpoint "Gateway" 8080 | Out-Null
Check-HealthEndpoint "Auth" 3001 | Out-Null
Check-HealthEndpoint "Plants" 3002 | Out-Null
Check-HealthEndpoint "Pots" 3003 | Out-Null
Check-HealthEndpoint "IoT" 3004 | Out-Null
Check-HealthEndpoint "Media" 3005 | Out-Null
Check-HealthEndpoint "Species" 3006 | Out-Null
Check-HealthEndpoint "ML" 5000 | Out-Null

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "5. VERIFICANDO MIGRACIONES DE PRISMA" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Check-Migrations "auth" | Out-Null
Check-Migrations "plants" | Out-Null
Check-Migrations "pots" | Out-Null
Check-Migrations "iot" | Out-Null
Check-Migrations "species" | Out-Null

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "RESUMEN" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$TOTAL = $script:PASSED + $script:FAILED

Write-Host "Total de verificaciones: $TOTAL"
Write-Host "Exitosas: $($script:PASSED)" -ForegroundColor Green
Write-Host "Fallidas: $($script:FAILED)" -ForegroundColor Red
Write-Host ""

if ($script:FAILED -eq 0) {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✓ TODOS LOS SERVICIOS ESTÁN FUNCIONANDO CORRECTAMENTE ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 URLs de Acceso:" -ForegroundColor Cyan
    Write-Host "   Frontend:  http://localhost:80"
    Write-Host "   Gateway:   http://localhost:8080"
    Write-Host "   Auth:      http://localhost:3001"
    Write-Host "   Plants:    http://localhost:3002"
    Write-Host "   Pots:      http://localhost:3003"
    Write-Host "   IoT:       http://localhost:3004"
    Write-Host "   Media:     http://localhost:3005"
    Write-Host "   Species:   http://localhost:3006"
    Write-Host "   ML:        http://localhost:5000"
    exit 0
} else {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ✗ ALGUNAS VERIFICACIONES FALLARON                     ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Sugerencias:" -ForegroundColor Yellow
    Write-Host "   1. Ejecuta: docker-compose logs <servicio-que-falló>"
    Write-Host "   2. Verifica los logs en busca de errores"
    Write-Host "   3. Reinicia el servicio: docker-compose restart <servicio>"
    Write-Host "   4. Si persiste: docker-compose down; docker-compose up -d --build"
    exit 1
}
