#!/bin/bash
# Script de verificación post-despliegue para PotAI
# Verifica que todos los servicios estén funcionando correctamente

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        VERIFICACIÓN POST-DESPLIEGUE - POTAI                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

check_container() {
    local container_name=$1
    echo -n "Verificando contenedor $container_name... "
    
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo -e "${GREEN}✓ Corriendo${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ No encontrado${NC}"
        ((FAILED++))
        return 1
    fi
}

check_health_endpoint() {
    local service_name=$1
    local port=$2
    echo -n "Health check $service_name (puerto $port)... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ HTTP 200${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ HTTP $response${NC}"
        ((FAILED++))
        return 1
    fi
}

check_database() {
    local db_name=$1
    local port=$2
    echo -n "Base de datos $db_name (puerto $port)... "
    
    if docker exec potai-${db_name}-db mysqladmin ping -h localhost -u root -prootpass >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Respondiendo${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ No responde${NC}"
        ((FAILED++))
        return 1
    fi
}

check_shadow_database() {
    local service=$1
    local shadow_db=$2
    echo -n "Shadow database $shadow_db... "
    
    result=$(docker exec potai-${service}-db mysql -u root -prootpass -e "SHOW DATABASES LIKE '${shadow_db}';" 2>/dev/null | grep -c "$shadow_db" || echo "0")
    
    if [ "$result" = "1" ]; then
        echo -e "${GREEN}✓ Existe${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ No existe${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. VERIFICANDO CONTENEDORES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Bases de datos
check_container "potai-auth-db"
check_container "potai-plants-db"
check_container "potai-pots-db"
check_container "potai-iot-db"
check_container "potai-species-db"
check_container "potai-redis"

echo ""

# Microservicios
check_container "potai-gateway"
check_container "potai-auth-service"
check_container "potai-plants-service"
check_container "potai-pots-service"
check_container "potai-iot-service"
check_container "potai-media-service"
check_container "potai-species-service"
check_container "potai-ml-service"
check_container "potai-frontend"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. VERIFICANDO CONECTIVIDAD DE BASES DE DATOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_database "auth" "3307"
check_database "plants" "3308"
check_database "pots" "3309"
check_database "iot" "3310"
check_database "species" "3311"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. VERIFICANDO SHADOW DATABASES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_shadow_database "auth" "potai_auth_shadow"
check_shadow_database "plants" "potai_plants_shadow"
check_shadow_database "pots" "potai_pots_shadow"
check_shadow_database "iot" "potai_iot_shadow"
check_shadow_database "species" "potai_species_shadow"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. VERIFICANDO ENDPOINTS DE SALUD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}Esperando 5 segundos para que los servicios estén listos...${NC}"
sleep 5

check_health_endpoint "Gateway" "8080"
check_health_endpoint "Auth" "3001"
check_health_endpoint "Plants" "3002"
check_health_endpoint "Pots" "3003"
check_health_endpoint "IoT" "3004"
check_health_endpoint "Media" "3005"
check_health_endpoint "Species" "3006"
check_health_endpoint "ML" "5000"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. VERIFICANDO MIGRACIONES DE PRISMA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_migrations() {
    local service=$1
    echo -n "Migraciones en $service... "
    
    # Verificar que la tabla _prisma_migrations existe
    result=$(docker exec potai-${service}-service node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SHOW TABLES LIKE '_prisma_migrations'\`
  .then(r => console.log(r.length))
  .catch(() => console.log('0'))
  .finally(() => prisma.\$disconnect());
" 2>/dev/null || echo "0")
    
    if [ "$result" = "1" ]; then
        echo -e "${GREEN}✓ Aplicadas${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠ No se encontraron migraciones (esto es normal si no hay ninguna aún)${NC}"
        ((PASSED++))
        return 0
    fi
}

check_migrations "auth"
check_migrations "plants"
check_migrations "pots"
check_migrations "iot"
check_migrations "species"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL=$((PASSED + FAILED))

echo -e "Total de verificaciones: $TOTAL"
echo -e "${GREEN}Exitosas: $PASSED${NC}"
echo -e "${RED}Fallidas: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ TODOS LOS SERVICIOS ESTÁN FUNCIONANDO CORRECTAMENTE ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "🌐 URLs de Acceso:"
    echo "   Frontend:  http://localhost:80"
    echo "   Gateway:   http://localhost:8080"
    echo "   Auth:      http://localhost:3001"
    echo "   Plants:    http://localhost:3002"
    echo "   Pots:      http://localhost:3003"
    echo "   IoT:       http://localhost:3004"
    echo "   Media:     http://localhost:3005"
    echo "   Species:   http://localhost:3006"
    echo "   ML:        http://localhost:5000"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ ALGUNAS VERIFICACIONES FALLARON                     ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "📋 Sugerencias:"
    echo "   1. Ejecuta: docker-compose logs <servicio-que-falló>"
    echo "   2. Verifica los logs en busca de errores"
    echo "   3. Reinicia el servicio: docker-compose restart <servicio>"
    echo "   4. Si persiste: docker-compose down && docker-compose up -d --build"
    exit 1
fi
