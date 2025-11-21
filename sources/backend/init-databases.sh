#!/bin/bash

# Script para inicializar todas las bases de datos y crear las shadow databases
# Ejecutar desde: sources/backend/

set -e

echo "ðŸ—„ï¸  Inicializando bases de datos..."

# Crear bases de datos shadow
docker-compose exec auth-db mysql -u root -prootpass -e "CREATE DATABASE IF NOT EXISTS potai_auth_shadow;" 2>/dev/null || true
docker-compose exec plants-db mysql -u root -prootpass -e "CREATE DATABASE IF NOT EXISTS potai_plants_shadow;" 2>/dev/null || true
docker-compose exec pots-db mysql -u root -prootpass -e "CREATE DATABASE IF NOT EXISTS potai_pots_shadow;" 2>/dev/null || true
docker-compose exec iot-db mysql -u root -prootpass -e "CREATE DATABASE IF NOT EXISTS potai_iot_shadow;" 2>/dev/null || true
docker-compose exec species-db mysql -u root -prootpass -e "CREATE DATABASE IF NOT EXISTS potai_species_shadow;" 2>/dev/null || true

echo "âœ… Bases de datos shadow creadas"

# Ejecutar migraciones en cada servicio
services=("auth-service" "plants-service" "pots-service" "iot-service" "species-service")

for service in "${services[@]}"; do
    echo ""
    echo "ðŸ“¦ Ejecutando migraciones para $service..."
    cd "$service"
    
    # Verificar si ya existen migraciones
    if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
        echo "   âœ“ Migraciones ya existen para $service"
    else
        echo "   ðŸ“ Creando migraciÃ³n inicial para $service..."
        npx prisma migrate dev --name init
    fi
    
    cd ..
done

echo ""
echo "âœ… Â¡Todas las migraciones estÃ¡n listas!"
echo ""
echo "Ahora puedes ejecutar: docker-compose up --build"
