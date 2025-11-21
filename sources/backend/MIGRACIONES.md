# Guía de Migraciones de Base de Datos con Prisma

## 📖 ¿Qué son las migraciones?

Las migraciones son cambios versionados en tu esquema de base de datos. Prisma ORM te permite:

1. **Definir tu esquema** en `prisma/schema.prisma`
2. **Crear migraciones** que generan SQL para aplicar los cambios
3. **Aplicar migraciones** automáticamente al iniciar los contenedores

## 🚀 Configuración Actual

Todos los servicios están configurados para:

✅ **Ejecutar migraciones automáticamente** al iniciar el contenedor
✅ **Generar Prisma Client** antes de iniciar la app
✅ **Usar bases de datos shadow** para validar migraciones

### Archivos clave por servicio:

```
service/
├── prisma/
│   ├── schema.prisma          # Definición del esquema
│   └── migrations/            # Historial de migraciones
│       └── YYYYMMDDHHMMSS_init/
│           └── migration.sql  # SQL generado
├── docker-entrypoint.sh       # Script que ejecuta migraciones
└── Dockerfile                 # Configurado con ENTRYPOINT
```

## 🔄 Flujo de Trabajo

### Primera vez (desarrollo local):

1. **Inicializar las bases de datos:**
   ```powershell
   # Desde sources/backend/
   .\init-databases.ps1
   ```

2. **Levantar los servicios:**
   ```bash
   docker-compose up --build
   ```

### Al modificar el esquema:

1. **Editar** `prisma/schema.prisma` en el servicio correspondiente

2. **Crear migración** (ejecutar DENTRO del contenedor):
   ```bash
   docker-compose exec auth-service npx prisma migrate dev --name descripcion_cambio
   ```

3. **Reiniciar el servicio:**
   ```bash
   docker-compose restart auth-service
   ```

## 📝 Comandos Útiles

### Crear una nueva migración:
```bash
# Desarrollo (crea y aplica)
npx prisma migrate dev --name nombre_migracion

# Producción (solo aplica las existentes)
npx prisma migrate deploy
```

### Ver estado de migraciones:
```bash
npx prisma migrate status
```

### Resetear base de datos (⚠️ CUIDADO en desarrollo):
```bash
npx prisma migrate reset
```

### Generar Prisma Client:
```bash
npx prisma generate
```

### Ver datos en interfaz gráfica:
```bash
npx prisma studio
```

## 🏗️ Ejemplo: Agregar un campo

1. **Editar** `auth-service/prisma/schema.prisma`:
   ```prisma
   model User {
     id            Int       @id @default(autoincrement())
     username      String    @unique
     email         String    @unique
     passwordHash  String
     firstName     String?   // ⬅️ NUEVO CAMPO
     lastName      String?   // ⬅️ NUEVO CAMPO
     createdAt     DateTime  @default(now())
     updatedAt     DateTime  @updatedAt
     sessions      Session[]
   }
   ```

2. **Crear migración:**
   ```bash
   docker-compose exec auth-service npx prisma migrate dev --name add_user_names
   ```

3. **Prisma genera automáticamente:**
   ```sql
   -- migrations/20251121_add_user_names/migration.sql
   ALTER TABLE `users` ADD COLUMN `firstName` VARCHAR(191) NULL;
   ALTER TABLE `users` ADD COLUMN `lastName` VARCHAR(191) NULL;
   ```

4. **El servicio se reinicia automáticamente** (nodemon detecta cambios)

## 🐳 Migraciones en Docker

### ¿Cómo funcionan?

El archivo `docker-entrypoint.sh` en cada servicio ejecuta:

```bash
#!/bin/sh
set -e

echo "🔄 Starting migration process..."

# 1. Generar Prisma Client
npx prisma generate

# 2. Aplicar migraciones pendientes
npx prisma migrate deploy

echo "✅ Migrations completed!"

# 3. Iniciar la aplicación
exec "$@"
```

### ¿Cuándo se ejecutan?

- ✅ **Al iniciar el contenedor por primera vez**
- ✅ **Al reiniciar el contenedor**
- ✅ **Al hacer `docker-compose up`**

### Variables de entorno necesarias:

```env
DATABASE_URL=mysql://root:rootpass@auth-db:3306/potai_auth
SHADOW_DATABASE_URL=mysql://root:rootpass@auth-db:3306/potai_auth_shadow
```

## 🔐 Base de Datos Shadow

Prisma usa una "shadow database" temporal para:

1. Validar que las migraciones funcionen
2. Comparar el esquema actual vs el nuevo
3. Detectar cambios no capturados en migraciones

**Importante:** La shadow database:
- Se crea automáticamente
- Se limpia después de validar
- No contiene datos reales

## 📊 Servicios y sus Modelos

### Auth Service
```prisma
- User (usuarios)
- Session (sesiones activas)
```

### Plants Service
```prisma
- Plant (plantas del usuario)
```

### Pots Service
```prisma
- Pot (macetas)
```

### IoT Service
```prisma
- AmbientalCondition (condiciones ambientales)
- WateringLog (registro de riego)
```

### Species Service
```prisma
- Species (especies de plantas)
```

## ⚠️ Buenas Prácticas

### ✅ HACER:

- Crear migraciones con nombres descriptivos
- Revisar el SQL generado antes de aplicar
- Hacer backup antes de migraciones importantes
- Probar migraciones en desarrollo primero
- Versionar las migraciones en Git

### ❌ NO HACER:

- Editar archivos de migración existentes
- Eliminar carpetas de `migrations/`
- Hacer cambios directos en la BD (bypass Prisma)
- Ejecutar `migrate reset` en producción
- Ignorar errores de migración

## 🚨 Troubleshooting

### Error: "Database does not exist"
```bash
# Crear la base de datos manualmente
docker-compose exec auth-db mysql -u root -prootpass -e "CREATE DATABASE potai_auth;"
```

### Error: "Migration failed"
```bash
# Ver detalles
docker-compose logs auth-service

# Resetear (⚠️ solo desarrollo)
docker-compose exec auth-service npx prisma migrate reset
```

### Error: "Can't reach database"
```bash
# Verificar que la BD esté corriendo
docker-compose ps

# Esperar a que esté healthy
docker-compose up -d auth-db
sleep 10
```

### Sincronizar esquema sin migración (⚠️ solo desarrollo)
```bash
npx prisma db push
```

## 📚 Recursos

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma CLI Reference](https://www.prisma.io/docs/reference/api-reference/command-reference)

## 🎯 Resumen

1. **Las migraciones están automatizadas** - Se ejecutan al iniciar los contenedores
2. **Usa `npx prisma migrate dev`** - Para crear nuevas migraciones
3. **Versiona las migraciones** - Haz commit de la carpeta `migrations/`
4. **Revisa el SQL generado** - Antes de aplicar en producción
5. **Usa `migrate deploy`** - En producción (no `migrate dev`)
