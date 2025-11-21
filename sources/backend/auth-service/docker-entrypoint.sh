#!/bin/sh
set -e

echo "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ Starting migration process for Auth Service..."

# Esperar a que la base de datos estÃƒÂ© lista
echo "Ã¢ÂÂ³ Waiting for database to be ready..."
until mysql -h auth-db -u root -prootpass --skip-ssl -e "SELECT 1" >/dev/null 2>&1; do
  echo "   Database is unavailable - sleeping"
  sleep 2
done
echo "ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Database is ready!"

# Crear shadow database con permisos completos
echo "Ã°Å¸â€”â€žÃ¯Â¸Â  Creating shadow database if not exists..."
mysql -h auth-db -u root -prootpass --skip-ssl <<-EOSQL
	CREATE DATABASE IF NOT EXISTS potai_auth_shadow;
	GRANT ALL PRIVILEGES ON potai_auth_shadow.* TO 'root'@'%';
	FLUSH PRIVILEGES;
EOSQL
echo "ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Shadow database ready!"

# Generar Prisma Client
echo "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â¦ Generating Prisma Client..."
npx prisma generate

# Ejecutar migraciones
echo "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â  Running database migrations..."
npx prisma migrate deploy

echo "ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Migrations completed successfully!"

# Iniciar la aplicaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n
echo "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â¡ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Starting application..."
exec "$@"
