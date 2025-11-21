#!/bin/sh
set -e

echo "🔄 Starting migration process..."

# Crear shadow database si no existe (necesaria para prisma migrate dev)
echo "🗄️  Creating shadow database if not exists..."
mysql -h plants-db -u root -prootpass -e "CREATE DATABASE IF NOT EXISTS potai_plants_shadow;" 2>/dev/null || echo "   ℹ️  Could not create shadow database (may already exist)"

# Generar Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Ejecutar migraciones
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed successfully!"

# Iniciar la aplicación
echo "🚀 Starting application..."
exec "$@"
