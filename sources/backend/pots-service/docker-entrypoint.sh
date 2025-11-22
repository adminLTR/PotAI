#!/bin/sh
set -e

echo "Starting migration process for Pots Service..."

# Esperar a que la base de datos este lista
echo "Waiting for database to be ready..."
until mysql -h pots-db -u root -prootpass --skip-ssl -e "SELECT 1" >/dev/null 2>&1; do
  echo "   Database is unavailable - sleeping"
  sleep 2
done
echo "Database is ready!"

# Crear shadow database con permisos completos
echo "Creating shadow database if not exists..."
mysql -h pots-db -u root -prootpass --skip-ssl <<-EOSQL
	CREATE DATABASE IF NOT EXISTS potai_pots_shadow;
	GRANT ALL PRIVILEGES ON potai_pots_shadow.* TO 'root'@'%';
	FLUSH PRIVILEGES;
EOSQL
echo "Shadow database ready!"

# Generar Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Ejecutar migraciones
echo "Running database migrations..."
npx prisma migrate deploy

echo "Migrations completed successfully!"

# Iniciar la aplicacion
echo "Starting application..."
exec "$@"
