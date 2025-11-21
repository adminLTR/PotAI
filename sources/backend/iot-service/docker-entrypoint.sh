#!/bin/sh
set -e

echo "ðŸ”„ Starting migration process..."

# Generar Prisma Client
echo "ðŸ“¦ Generating Prisma Client..."
npx prisma generate

# Ejecutar migraciones
echo "ðŸ—„ï¸  Running database migrations..."
npx prisma migrate deploy

echo "âœ… Migrations completed successfully!"

# Iniciar la aplicaciÃ³n
echo "ðŸš€ Starting application..."
exec "$@"
