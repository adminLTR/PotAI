#!/bin/sh
set -e

echo "ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬Å¾ Starting migration process for Plants Service..."

# Esperar a que la base de datos estÃ© lista
echo "â³ Waiting for database to be ready..."
until mysql -h plants-db -u root -prootpass --skip-ssl -e "SELECT 1" >/dev/null 2>&1; do
  echo "   Database is unavailable - sleeping"
  sleep 2
done
echo "ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Database is ready!"

# Crear shadow database con permisos completos
echo "ðŸ—„ï¸  Creating shadow database if not exists..."
mysql -h plants-db -u root -prootpass --skip-ssl <<-EOSQL
	CREATE DATABASE IF NOT EXISTS potai_plants_shadow;
	GRANT ALL PRIVILEGES ON potai_plants_shadow.* TO 'root'@'%';
	FLUSH PRIVILEGES;
EOSQL
echo "ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Shadow database ready!"

# Generar Prisma Client
echo "ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¦ Generating Prisma Client..."
npx prisma generate

# Ejecutar migraciones
echo "ÃƒÂ°Ã…Â¸Ã¢â‚¬â€Ã¢â‚¬Å¾ÃƒÂ¯Ã‚Â¸Ã‚Â  Running database migrations..."
npx prisma migrate deploy

echo "ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Migrations completed successfully!"

# Iniciar la aplicaciÃƒÆ’Ã‚Â³n
echo "ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€šÂ¬ Starting application..."
exec "$@"
