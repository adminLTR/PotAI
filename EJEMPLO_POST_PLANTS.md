# 📝 EJEMPLO DE PETICIÓN POST /plants - Crear Planta con Imagen

## ✅ Resumen de Implementación

El endpoint `POST /plants` permite crear una planta con imagen. La imagen se:
1. Envía al **Media Service** como multipart/form-data
2. Media Service guarda la imagen en `/uploads/`
3. Plants Service guarda la **ruta relativa** `/uploads/filename` en la base de datos

## 🔧 Ejemplo Completo con Postman (RECOMENDADO)

### 1. Importar Colección
- Archivo: `PotAI_Postman_Collection.json`
- La colección ya tiene todo configurado

### 2. Ejecutar en Orden

**A. Auth Service → Register User**
```
POST /auth/register
Body:
{
  "email": "test@potai.com",
  "password": "Test123!",
  "username": "testuser",
  "name": "Test User"
}
```
✅ Guarda automáticamente: `access_token`, `session_token`, `user_id`

**B. Species Service → Get All Species**
```
GET /species
```
✅ Guarda automáticamente: `species_id` (primera especie)

**C. Plants Service → Create Plant (with Image)**
```
POST /plants
Headers:
  Authorization: Bearer {{access_token}}
  x-session-token: {{session_token}}
  x-user-id: {{user_id}}

Body (form-data):
  name: "Mi Rosa China"
  potLabel: "ESP32_TEST_001"
  speciesId: 7
  plantedAt: "2025-11-22"
  notes: "Planta de prueba"
  image: [SELECCIONAR ARCHIVO]
```

**Respuesta Esperada:**
```json
{
  "plant": {
    "id": 1,
    "userId": 1,
    "potId": 1,
    "name": "Mi Rosa China",
    "imageUrl": "/uploads/1732247123456-image.png",  ← RUTA RELATIVA
    "speciesId": 7,
    "plantedAt": "2025-11-22T00:00:00.000Z",
    "notes": "Planta de prueba",
    "createdAt": "2025-11-22T05:45:23.456Z",
    "updatedAt": "2025-11-22T05:45:23.456Z"
  },
  "pot": {
    "id": 1,
    "label": "ESP32_TEST_001",
    "userId": 1
  },
  "species": {
    "id": 7,
    "commonName": "Rosa China",
    "scientificName": "Hibiscus rosa-sinensis",
    "waterRequirements": "...",
    "lightRequirements": "...",
    "humidityRequirements": "..."
  }
}
```

## 💻 Ejemplo con cURL (PowerShell/CMD)

### Paso 1: Registrar Usuario

**PowerShell:**
```powershell
$body = @{
    email = "test@potai.com"
    password = "Test123!"
    username = "testuser"
    name = "Test User"
} | ConvertTo-Json

$auth = Invoke-RestMethod -Uri "http://localhost:8080/auth/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$userId = $auth.user.id
$accessToken = $auth.accessToken
$sessionToken = $auth.sessionToken

Write-Host "User ID: $userId"
Write-Host "Token: $accessToken"
```

### Paso 2: Obtener Especies

**PowerShell:**
```powershell
$species = Invoke-RestMethod -Uri "http://localhost:8080/species"
$speciesId = 7  # Rosa China
```

### Paso 3: Crear Imagen de Prueba

**PowerShell:**
```powershell
# PNG simple 100x100 px
$pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAXklEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGDgAAmyAAFGaL8pAAAAAElFTkSuQmCC"
$imageBytes = [Convert]::FromBase64String($pngBase64)
[IO.File]::WriteAllBytes("test-plant.png", $imageBytes)
```

### Paso 4: Crear Planta con curl

**PowerShell/CMD:**
```powershell
curl.exe -X POST http://localhost:8080/plants `
  -H "Authorization: Bearer $accessToken" `
  -H "x-session-token: $sessionToken" `
  -H "x-user-id: $userId" `
  -F "name=Mi Rosa China" `
  -F "potLabel=ESP32_TEST_001" `
  -F "speciesId=7" `
  -F "plantedAt=2025-11-22" `
  -F "notes=Planta de prueba automatica" `
  -F "image=@test-plant.png"
```

**Nota:** En PowerShell usa `` ` `` para continuar líneas. En CMD/Bash usa `^` o `\`.

## 📊 Estructura de la Petición

### Headers Requeridos
```
Authorization: Bearer <access_token>
x-session-token: <session_token>
x-user-id: <user_id>
Content-Type: multipart/form-data
```

### Body (multipart/form-data)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | ✅ Sí | Nombre de la planta |
| `potLabel` | string | ✅ Sí | Código del ESP32 |
| `speciesId` | number | ❌ No | ID de la especie (de Species Service) |
| `plantedAt` | date | ❌ No | Fecha de plantación (YYYY-MM-DD) |
| `notes` | string | ❌ No | Notas adicionales |
| `image` | file | ❌ No | Archivo de imagen (JPG, PNG, etc.) |

### Validaciones

- **name**: Obligatorio, string no vacío
- **potLabel**: Obligatorio, identifica el macetero ESP32
- **speciesId**: Opcional, debe existir en Species Service
- **image**: Opcional, máximo 10MB, solo imágenes

## 🔄 Flujo Interno

```
1. Cliente → Gateway → Plants Service
   POST /plants con multipart/form-data

2. Plants Service → Media Service
   POST /upload/single con imagen
   
3. Media Service responde:
   {
     "file": {
       "filename": "1732247123456-image.png",
       "url": "http://..."
     }
   }

4. Plants Service extrae filename y crea ruta:
   imageUrl = "/uploads/1732247123456-image.png"

5. Plants Service → Pots Service
   POST /pots/get-or-create
   Busca o crea pot con label

6. Plants Service → Species Service
   GET /species/:id
   Obtiene datos de especie

7. Plants Service guarda en BBDD:
   {
     name, potId, speciesId, 
     imageUrl: "/uploads/filename",  ← RUTA RELATIVA
     ...
   }

8. Plants Service responde con:
   { plant, pot, species }
```

## 🗄️ Datos Guardados en Base de Datos

**Tabla: plants**
```sql
INSERT INTO plants (
  userId, potId, name, imageUrl, speciesId, 
  plantedAt, notes, createdAt, updatedAt
) VALUES (
  1, 
  1, 
  'Mi Rosa China', 
  '/uploads/1732247123456-image.png',  -- ← RUTA RELATIVA
  7, 
  '2025-11-22', 
  'Planta de prueba', 
  NOW(), 
  NOW()
);
```

**Campo imageUrl:**
- ✅ Formato: `/uploads/filename`
- ✅ Ruta relativa al servidor de media
- ✅ Frontend construye URL completa: `http://localhost:8080/media/files/filename`

## 🌐 Acceder a la Imagen

### Desde Frontend
```javascript
const plant = await fetch('http://localhost:8080/plants/1');
const imageUrl = plant.imageUrl;  // "/uploads/1732247123456-image.png"

// Construir URL completa
const fullUrl = `http://localhost:8080/media/files${imageUrl.replace('/uploads/', '')}`;
// o
const fullUrl = `http://localhost:8080/media${imageUrl}`;

// Usar en <img>
<img src={fullUrl} alt={plant.name} />
```

### Endpoints de Media Service
```
GET /media/files/:filename          - Descargar archivo
GET /media/info/:filename           - Info del archivo
GET /media/files                    - Listar archivos
DELETE /media/files/:filename       - Eliminar archivo
```

## ✅ Verificación

### 1. Verificar Planta Creada
```
GET /plants/:id
```

**Respuesta debe incluir:**
```json
{
  "plant": {
    "imageUrl": "/uploads/filename.png"  ← Verificar formato
  }
}
```

### 2. Verificar Imagen en Media Service
```
GET /media/files/filename.png
```
Debe devolver la imagen

### 3. Verificar en Base de Datos
```sql
SELECT id, name, imageUrl FROM plants WHERE id = 1;
```

## 🐛 Troubleshooting

### Error: "User authentication required"
- ✅ Incluir headers: `Authorization`, `x-session-token`, `x-user-id`

### Error: "Plant name is required"
- ✅ Campo `name` es obligatorio

### Error: "Pot label (ESP32 code) is required"
- ✅ Campo `potLabel` es obligatorio

### Error: "Only image files are allowed"
- ✅ Archivo debe ser imagen (JPG, PNG, GIF, WEBP)

### Error: "Failed to upload image"
- ✅ Verificar que Media Service esté corriendo
- ✅ Verificar conectividad: `curl http://localhost:8080/media/health`

### Imagen no se guarda correctamente
- ✅ Verificar que Media Service responda con `file.filename`
- ✅ Verificar que Plants Service construya ruta `/uploads/filename`
- ✅ Revisar logs: `docker logs potai-plants-service`

## 📌 Notas Importantes

1. **Formato de imageUrl**: Siempre `/uploads/filename`, nunca URL completa
2. **Tamaño máximo**: 10MB por imagen
3. **Formatos soportados**: JPG, JPEG, PNG, GIF, WEBP, SVG
4. **ESP32 potLabel**: Debe ser único por usuario
5. **speciesId**: Opcional, si se omite la planta no tendrá especie asignada

## 🎯 Próximos Pasos

1. **Integrar con ML Service**: Reconocer planta antes de crear
2. **Optimizar imágenes**: Resize automático al subir
3. **Thumbnails**: Generar miniaturas
4. **Validar formato**: Verificar que sea imagen válida
5. **Límites por usuario**: Máximo de plantas por usuario

---

**Estado**: ✅ Implementado y Funcional

**Colección Postman**: ✅ Actualizada en `PotAI_Postman_Collection.json`

**Documentación**: ✅ Completa
