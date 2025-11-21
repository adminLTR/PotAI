# 🚀 Guía de Instalación y Despliegue - PotAI

## 📋 Requisitos Previos

- Docker Desktop instalado y corriendo
- Git
- PowerShell (Windows) o Bash (Linux/Mac)

## 🔧 Instalación desde Cero

### 1. Clonar el Repositorio

```bash
git clone https://github.com/adminLTR/PotAI.git
cd PotAI/sources/backend
```

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo y genera valores seguros:

```powershell
# En PowerShell (Windows)
Copy-Item .env.example .env

# Generar JWT_SECRET (64 caracteres aleatorios)
$JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
(Get-Content .env) -replace 'JWT_SECRET=.*', "JWT_SECRET=$JWT_SECRET" | Set-Content .env

# Generar IOT_API_KEY (32 caracteres aleatorios)
$IOT_API_KEY = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
(Get-Content .env) -replace 'IOT_API_KEY=.*', "IOT_API_KEY=$IOT_API_KEY" | Set-Content .env
```

```bash
# En Bash (Linux/Mac)
cp .env.example .env

# Generar JWT_SECRET
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-64)
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env

# Generar IOT_API_KEY
IOT_API_KEY=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-32)
sed -i "s/IOT_API_KEY=.*/IOT_API_KEY=$IOT_API_KEY/" .env
```

### 3. Levantar el Proyecto

```bash
docker-compose up -d --build
```

**¿Qué hace este comando?**
- 🏗️ Construye todas las imágenes Docker
- 🗄️ Levanta 17 contenedores (5 bases de datos + 8 microservicios + Redis + Frontend)
- 🔄 **Ejecuta AUTOMÁTICAMENTE las migraciones de Prisma** en cada servicio
- 🌱 Crea las tablas necesarias en todas las bases de datos
- ⚙️ Genera las shadow databases necesarias para futuras migraciones

### 4. Verificar que Todo Funcione

```powershell
# Verificar estado de los contenedores
docker-compose ps

# Debería mostrar todos los servicios "Up" y las DBs "(healthy)"
```

### 5. Cargar Datos de Especies (Primera vez)

```bash
docker-compose exec species-service npm run seed
```

Esto carga 8 especies de plantas en la base de datos.

---

## 🔄 Actualizar el Proyecto (Pull de Nuevos Cambios)

Cuando hagas `git pull` y haya nuevas migraciones:

```bash
# 1. Descargar cambios
git pull origin master

# 2. Reconstruir y reiniciar servicios
docker-compose up -d --build
```

**✅ Las migraciones se aplicarán AUTOMÁTICAMENTE** al iniciar cada contenedor.

No necesitas ejecutar comandos adicionales. El sistema:
1. Espera a que la base de datos esté lista
2. Crea/verifica la shadow database
3. Genera el Prisma Client
4. Aplica todas las migraciones pendientes
5. Inicia el servicio

---

## 🗄️ Sistema de Migraciones Automáticas

### ¿Cómo Funciona?

Cada servicio con Prisma (`auth`, `plants`, `pots`, `iot`, `species`) tiene un script `docker-entrypoint.sh` que se ejecuta **antes** de iniciar el servicio:

1. **Espera a la DB**: Verifica que MySQL esté listo
2. **Shadow Database**: Crea automáticamente la base de datos shadow (necesaria para Prisma Migrate)
3. **Prisma Generate**: Genera el cliente de Prisma
4. **Prisma Migrate Deploy**: Aplica todas las migraciones pendientes
5. **Inicia el Servicio**: Ejecuta `npm run dev`

### Crear una Nueva Migración

Si haces cambios en el esquema de Prisma:

```bash
# 1. Modificar prisma/schema.prisma
# 2. Crear la migración dentro del contenedor
docker-compose exec <servicio> npx prisma migrate dev --name <nombre_migracion>

# Ejemplo:
docker-compose exec auth-service npx prisma migrate dev --name add_user_role
```

La próxima vez que alguien haga `git pull` y levante el proyecto, la migración se aplicará automáticamente.

---

## 🐳 Comandos Útiles Docker

### Ver Logs
```bash
# Todos los servicios
docker-compose logs -f

# Un servicio específico
docker-compose logs -f auth-service

# Últimas 100 líneas
docker-compose logs --tail=100 auth-service
```

### Reiniciar un Servicio
```bash
docker-compose restart auth-service
```

### Detener Todo
```bash
docker-compose down
```

### Detener y Eliminar Volúmenes (⚠️ BORRA DATOS)
```bash
docker-compose down -v
```

### Reconstruir un Servicio Específico
```bash
docker-compose up -d --build auth-service
```

---

## 🔍 Verificar Salud de los Servicios

### Health Check Manual
```powershell
# PowerShell
$services = @(
  @{name='Gateway'; port=8080},
  @{name='Auth'; port=3001},
  @{name='Plants'; port=3002},
  @{name='Pots'; port=3003},
  @{name='IoT'; port=3004},
  @{name='Media'; port=3005},
  @{name='Species'; port=3006},
  @{name='ML'; port=5000}
)

foreach($s in $services) {
  $url = "http://localhost:$($s.port)/health"
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing
    Write-Host "✅ $($s.name): $($r.StatusCode)" -ForegroundColor Green
  } catch {
    Write-Host "❌ $($s.name): Error" -ForegroundColor Red
  }
}
```

### Respuesta Esperada
Todos deberían responder con HTTP 200:
```json
{"status":"healthy","service":"auth-service"}
```

---

## 📊 Estructura de Bases de Datos

Cada servicio tiene su propia base de datos:

| Servicio | Base de Datos | Puerto | Shadow Database |
|----------|---------------|--------|-----------------|
| Auth     | potai_auth    | 3307   | potai_auth_shadow |
| Plants   | potai_plants  | 3308   | potai_plants_shadow |
| Pots     | potai_pots    | 3309   | potai_pots_shadow |
| IoT      | potai_iot     | 3310   | potai_iot_shadow |
| Species  | potai_species | 3311   | potai_species_shadow |

### Conectarse a una Base de Datos

```bash
# Desde host
mysql -h 127.0.0.1 -P 3307 -u root -prootpass potai_auth

# Ver tablas desde un servicio
docker-compose exec auth-service node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SHOW TABLES\`.then(console.log).finally(() => prisma.\$disconnect());
"
```

---

## 🛠️ Solución de Problemas

### Problema: Contenedor no inicia
```bash
# Ver logs detallados
docker-compose logs <servicio>

# Verificar que la DB esté healthy
docker-compose ps
```

### Problema: Error de migraciones
```bash
# Reiniciar el servicio para que reintente
docker-compose restart <servicio>

# Si persiste, entrar al contenedor
docker-compose exec <servicio> sh
npx prisma migrate deploy
```

### Problema: Shadow database no se crea
Los scripts ahora crean automáticamente la shadow database con:
```sql
CREATE DATABASE IF NOT EXISTS potai_<servicio>_shadow;
GRANT ALL PRIVILEGES ON potai_<servicio>_shadow.* TO 'root'@'%';
FLUSH PRIVILEGES;
```

Si aún falla, verifica los logs del contenedor.

### Problema: Puerto en uso
```bash
# Ver qué está usando el puerto
netstat -ano | findstr :<puerto>

# Cambiar el puerto en docker-compose.yml
# Ejemplo: "3001:3001" -> "3101:3001"
```

---

## 🌐 URLs de Acceso

Una vez levantado:

- **Frontend**: http://localhost:80
- **API Gateway**: http://localhost:8080
- **Auth Service**: http://localhost:3001
- **Plants Service**: http://localhost:3002
- **Pots Service**: http://localhost:3003
- **IoT Service**: http://localhost:3004
- **Media Service**: http://localhost:3005
- **Species Service**: http://localhost:3006
- **ML Service**: http://localhost:5000

---

## 📝 Notas Importantes

### ✅ Primera Ejecución
- Tarda más porque construye todas las imágenes
- Las migraciones se aplican automáticamente
- No necesitas ejecutar comandos adicionales

### ✅ Ejecuciones Posteriores
- Mucho más rápido (usa cache)
- Solo reconstruye servicios con cambios
- Las nuevas migraciones se aplican automáticamente

### ✅ Después de Git Pull
- Si hay cambios en código: `docker-compose up -d --build`
- Si hay nuevas migraciones: Se aplican automáticamente al iniciar

### ⚠️ Eliminar Datos
```bash
# Solo elimina contenedores (conserva datos)
docker-compose down

# Elimina contenedores Y datos (bases de datos, uploads, etc.)
docker-compose down -v
```

---

## 🤝 Contribuir

1. Hacer fork del repositorio
2. Crear una rama: `git checkout -b feature/nueva-funcionalidad`
3. Hacer cambios y commit: `git commit -m 'Add nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Si Modificas Esquemas de Prisma

```bash
# 1. Modificar schema.prisma
# 2. Crear migración
docker-compose exec <servicio> npx prisma migrate dev --name descripcion_del_cambio

# 3. Commit de los cambios (incluye la carpeta prisma/migrations)
git add .
git commit -m "feat: add campo X a modelo Y"
git push
```

---

## 📦 Contenedores del Sistema

| Nombre | Tipo | Puerto | Descripción |
|--------|------|--------|-------------|
| potai-gateway | Node.js | 8080 | API Gateway |
| potai-auth-service | Node.js + Prisma | 3001 | Autenticación |
| potai-plants-service | Node.js + Prisma | 3002 | Gestión de plantas |
| potai-pots-service | Node.js + Prisma | 3003 | Gestión de macetas |
| potai-iot-service | Node.js + Prisma | 3004 | Datos IoT |
| potai-media-service | Node.js | 3005 | Gestión de archivos |
| potai-species-service | Node.js + Prisma | 3006 | Catálogo de especies |
| potai-ml-service | Python/Flask | 5000 | Machine Learning |
| potai-auth-db | MySQL 8.0 | 3307 | Base de datos Auth |
| potai-plants-db | MySQL 8.0 | 3308 | Base de datos Plants |
| potai-pots-db | MySQL 8.0 | 3309 | Base de datos Pots |
| potai-iot-db | MySQL 8.0 | 3310 | Base de datos IoT |
| potai-species-db | MySQL 8.0 | 3311 | Base de datos Species |
| potai-redis | Redis 7 | 6379 | Cache y sesiones |
| potai-frontend | Nginx | 80 | Frontend web |

---

## 📖 Documentación Adicional

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Última actualización**: Noviembre 2025  
**Versión del Sistema**: 1.0.0
