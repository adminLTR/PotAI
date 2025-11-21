#!/bin/sh
set -e

echo "🔄 Starting migration process..."

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
