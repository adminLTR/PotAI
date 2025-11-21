# ✅ Sistema PotAI - Configuración Completada

## 🎉 ¡MIGRACIONES AUTOMÁTICAS FUNCIONANDO!

### ¿Qué se logró?

El sistema ahora aplica **automáticamente** las migraciones de Prisma cada vez que levantas los servicios, ya sea la primera vez o después de hacer `git pull` con nuevas migraciones.

---

## 📋 Cambios Realizados

### 1. Scripts `docker-entrypoint.sh` (5 servicios)

Cada servicio con Prisma (`auth`, `plants`, `pots`, `iot`, `species`) ahora tiene un script que:

✅ Espera a que MySQL esté listo  
✅ Crea automáticamente la **shadow database** (necesaria para Prisma Migrate)  
✅ Genera el Prisma Client  
✅ **Aplica todas las migraciones pendientes**  
✅ Inicia el servicio

**Ubicación:** `<servicio>/docker-entrypoint.sh`

**Características:**
- Usa `--skip-ssl` para conectar con MySQL (compatible con MariaDB client)
- Crea shadow databases con permisos completos
- Usa `prisma migrate deploy` para aplicar migraciones
- Maneja errores gracefully

### 2. Bases de Datos MySQL

Todas las bases de datos ahora usan:
```yaml
command: --default-authentication-plugin=mysql_native_password
```

**¿Por qué?**  
MariaDB client (instalado en Alpine) no puede autenticar con `caching_sha2_password` (default de MySQL 8.0). Al usar `mysql_native_password`, la autenticación funciona perfectamente.

### 3. Dockerfiles

Todos los servicios con Prisma tienen instalado:
```dockerfile
RUN apk add --no-cache openssl mysql-client
```

- `openssl`: Requerido por Prisma para generar binaries
- `mysql-client`: Necesario para verificar conexión y crear shadow databases

---

## 🚀 Cómo Usar

### Primera Vez (Clonar Proyecto)

```bash
# 1. Clonar repositorio
git clone https://github.com/adminLTR/PotAI.git
cd PotAI/sources/backend

# 2. Configurar .env
cp .env.example .env
# Editar .env con JWT_SECRET y IOT_API_KEY seguros

# 3. Levantar TODO
docker-compose up -d --build

# ¡Eso es todo! Las migraciones se aplican automáticamente
```

**Lo que sucede automáticamente:**
1. Se construyen todas las imágenes
2. Se levantan las bases de datos
3. Los servicios esperan a que las DBs estén ready
4. Se crean las shadow databases
5. Se generan los Prisma Clients
6. **Se aplican todas las migraciones**
7. Los servicios inician normalmente

### Después de Git Pull (Nuevas Migraciones)

```bash
# 1. Obtener cambios
git pull origin master

# 2. Reconstruir servicios
docker-compose up -d --build

# ¡Las nuevas migraciones se aplican automáticamente!
```

### Crear una Nueva Migración

```bash
# Dentro del contenedor del servicio
docker-compose exec auth-service npx prisma migrate dev --name nombre_migracion

# Commit y push
git add .
git commit -m "feat: add nueva migración"
git push
```

La próxima vez que alguien haga `git pull` y levante el proyecto, la migración se aplicará automáticamente.

---

## 🗄️ Shadow Databases Creadas

Cada servicio tiene su shadow database automática:

| Servicio | Database Principal | Shadow Database |
|----------|-------------------|-----------------|
| Auth     | potai_auth        | potai_auth_shadow |
| Plants   | potai_plants      | potai_plants_shadow |
| Pots     | potai_pots        | potai_pots_shadow |
| IoT      | potai_iot         | potai_iot_shadow |
| Species  | potai_species     | potai_species_shadow |

**Verificar:**
```bash
docker exec potai-auth-db mysql -u root -prootpass -e "SHOW DATABASES;"
```

---

## ✅ Verificación del Sistema

### Estado de Contenedores
```bash
docker-compose ps
```

**Esperado:** Todos "Up" y las DBs "(healthy)"

### Health Checks
```powershell
@(8080, 3001, 3002, 3003, 3004, 3005, 3006, 5000) | ForEach-Object {
  try {
    $r = Invoke-WebRequest "http://localhost:$_/health" -UseBasicParsing -TimeoutSec 2
    Write-Host "✓ Puerto $_" -ForegroundColor Green
  } catch {
    Write-Host "✗ Puerto $_" -ForegroundColor Red
  }
}
```

### Verificar Migraciones Aplicadas
```bash
docker-compose exec auth-service npx prisma migrate status
```

---

## 🔧 Solución de Problemas

### Las migraciones no se aplican

```bash
# Ver logs del servicio
docker-compose logs auth-service

# Reiniciar el servicio
docker-compose restart auth-service

# Si persiste, reconstruir
docker-compose up -d --build auth-service
```

### Error: "Shadow database not found"

Esto ya no debería pasar. El script crea automáticamente la shadow database. Si sucede:

```bash
# Crear manualmente
docker exec potai-auth-db mysql -u root -prootpass -e \
  "CREATE DATABASE IF NOT EXISTS potai_auth_shadow;"
  
# Reiniciar servicio
docker-compose restart auth-service
```

### Error: "Can't connect to MySQL"

Verifica que la DB esté healthy:
```bash
docker-compose ps | grep db
```

Si no está healthy:
```bash
docker-compose restart auth-db
```

---

## 📊 Flujo de Migraciones

```
┌─────────────────┐
│  docker-compose │
│     up -d       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Bases de Datos  │
│   se levantan   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Healthchecks   │
│ confirman ready │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ docker-entrypoint.sh│
│ de cada servicio    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Espera DB ready     │
│ (until mysql ping)  │
└────────┬────────────┘
         │
         ▼
┌──────────────────────┐
│ Crea Shadow Database │
│ con permisos root    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ npx prisma generate  │
│ (genera client)      │
└────────┬─────────────┘
         │
         ▼
┌───────────────────────┐
│ npx prisma migrate    │
│ deploy                │
│ (aplica migraciones)  │
└────────┬──────────────┘
         │
         ▼
┌───────────────────────┐
│ npm run dev           │
│ (inicia servicio)     │
└───────────────────────┘
```

---

## 🎯 Casos de Uso

### Desarrollador Nuevo en el Equipo
1. Clona el repo
2. Ejecuta `docker-compose up -d --build`
3. **Todo funciona automáticamente**

### Actualización con Nuevas Migraciones
1. `git pull`
2. `docker-compose up -d --build`
3. **Migraciones se aplican automáticamente**

### Crear Nueva Feature con Migración
1. Modifica `prisma/schema.prisma`
2. `docker-compose exec auth-service npx prisma migrate dev --name add_campo`
3. Commit y push
4. Otros devs: `git pull` + `docker-compose up -d --build`
5. **Migración se aplica automáticamente en sus máquinas**

---

## 📝 Notas Importantes

### ✅ Qué SÍ hace el sistema:
- Aplica migraciones automáticamente al iniciar
- Crea shadow databases necesarias
- Genera Prisma Client
- Espera a que las DBs estén listas
- Funciona en primera ejecución y en updates

### ❌ Qué NO hace el sistema:
- **NO** crea migraciones automáticamente (debes usar `prisma migrate dev`)
- **NO** hace rollback automático de migraciones
- **NO** modifica schemas existentes sin migración

### 🔒 Seguridad:
- Shadow databases se crean en runtime (no persistentes)
- Usa credenciales de root solo para creación de DB
- Prisma Client se regenera en cada inicio

---

## 🌟 Ventajas de Esta Configuración

✅ **Cero configuración manual** después del primer setup  
✅ **Migraciones siempre sincronizadas** con el código  
✅ **Funciona en cualquier máquina** (dev, staging, prod)  
✅ **No más "olvidé correr las migraciones"**  
✅ **Equipo siempre con la misma versión de schema**  
✅ **CI/CD friendly** (funciona en pipelines automáticas)  

---

## 📚 Documentación Adicional

- **INSTALLATION.md** - Guía completa de instalación
- **DEPLOYMENT_STATUS.md** - Estado actual del sistema
- **docker-entrypoint.sh** - Scripts de inicialización

---

**Fecha:** Noviembre 2025  
**Versión:** 1.0.0  
**Estado:** ✅ PRODUCCIÓN READY
