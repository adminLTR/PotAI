# Media Service

Servicio de almacenamiento y gestión de archivos multimedia para PotAI.

## 🚀 Características

- ✅ Subida de archivos múltiples (hasta 10 archivos por request)
- ✅ Subida de archivo único
- ✅ Validación de tipos de archivo
- ✅ Límite de tamaño: 50MB por archivo
- ✅ Nombres de archivo únicos automáticos
- ✅ API RESTful completa
- ✅ Listado de archivos
- ✅ Descarga de archivos
- ✅ Eliminación de archivos
- ✅ Información detallada de archivos

## 📁 Tipos de Archivo Soportados

### Imágenes
- JPEG, JPG, PNG, GIF, WebP, SVG

### Videos
- MP4, MPEG, QuickTime, AVI, WebM

### Audio
- MP3, WAV, WebM, OGG

### Documentos
- PDF, DOC, DOCX, XLS, XLSX

### Texto
- TXT, CSV, JSON

## 🔌 Endpoints

### 1. Subir Múltiples Archivos
```http
POST /media/upload
Content-Type: multipart/form-data

Campo: files (array, máximo 10 archivos)
```

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:8080/media/upload \
  -F "files=@image1.jpg" \
  -F "files=@image2.png" \
  -F "files=@document.pdf"
```

**Respuesta:**
```json
{
  "message": "Files uploaded successfully",
  "count": 3,
  "files": [
    {
      "filename": "image1-1234567890-123456789.jpg",
      "originalName": "image1.jpg",
      "mimetype": "image/jpeg",
      "size": 245678,
      "url": "http://localhost:8080/media/files/image1-1234567890-123456789.jpg",
      "uploadedAt": "2025-11-21T23:00:00.000Z"
    }
  ]
}
```

### 2. Subir Archivo Único
```http
POST /media/upload/single
Content-Type: multipart/form-data

Campo: file (un solo archivo)
```

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:8080/media/upload/single \
  -F "file=@photo.jpg"
```

### 3. Listar Archivos
```http
GET /media/files
```

**Respuesta:**
```json
{
  "count": 5,
  "files": [
    {
      "filename": "photo-1234567890-123456789.jpg",
      "size": 245678,
      "url": "http://localhost:8080/media/files/photo-1234567890-123456789.jpg",
      "createdAt": "2025-11-21T23:00:00.000Z",
      "modifiedAt": "2025-11-21T23:00:00.000Z"
    }
  ]
}
```

### 4. Obtener Archivo
```http
GET /media/files/:filename
```

Devuelve el archivo para descarga o visualización.

### 5. Información del Archivo
```http
GET /media/info/:filename
```

**Respuesta:**
```json
{
  "filename": "photo-1234567890-123456789.jpg",
  "extension": ".jpg",
  "size": 245678,
  "url": "http://localhost:8080/media/files/photo-1234567890-123456789.jpg",
  "createdAt": "2025-11-21T23:00:00.000Z",
  "modifiedAt": "2025-11-21T23:00:00.000Z",
  "isFile": true,
  "isDirectory": false
}
```

### 6. Eliminar Archivo
```http
DELETE /media/files/:filename
```

**Respuesta:**
```json
{
  "message": "File deleted successfully",
  "filename": "photo-1234567890-123456789.jpg"
}
```

### 7. Health Check
```http
GET /media/health
```

## 🔧 Uso desde Otros Servicios

### Ejemplo en JavaScript/Node.js

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Subir archivo
async function uploadFile(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await axios.post('http://gateway:8080/media/upload/single', form, {
    headers: form.getHeaders()
  });

  return response.data.file.url;
}

// Usar
const imageUrl = await uploadFile('./plant-photo.jpg');
console.log('Image uploaded:', imageUrl);
```

### Ejemplo en Python

```python
import requests

def upload_file(file_path):
    url = 'http://localhost:8080/media/upload/single'
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files)
    
    return response.json()['file']['url']

# Usar
image_url = upload_file('plant-photo.jpg')
print(f'Image uploaded: {image_url}')
```

## 🔒 Límites y Restricciones

- **Tamaño máximo por archivo:** 50MB
- **Archivos por request:** Máximo 10
- **Tipos de archivo:** Solo los listados en la sección "Tipos Soportados"

## 🛠️ Variables de Entorno

```env
PORT=3005
NODE_ENV=development
CORS_ORIGIN=http://localhost,http://localhost:80
```

## 📂 Estructura de Directorios

```
media-service/
├── src/
│   ├── config/
│   │   └── multer.config.js      # Configuración de Multer
│   ├── controllers/
│   │   └── media.controller.js   # Controladores de endpoints
│   ├── middleware/
│   │   └── error.middleware.js   # Manejo de errores
│   ├── routes/
│   │   └── media.routes.js       # Definición de rutas
│   └── index.js                  # Punto de entrada
├── uploads/                       # Archivos subidos (creado automáticamente)
├── package.json
└── README.md
```

## 🚀 Despliegue

El servicio se despliega automáticamente con Docker Compose:

```bash
docker-compose up -d media-service
```

## 🔍 Logs

Ver logs del servicio:
```bash
docker-compose logs -f media-service
```

## ⚠️ Notas Importantes

1. Los archivos se almacenan en el directorio `uploads/` dentro del contenedor
2. Los nombres de archivo se generan automáticamente con timestamp para evitar colisiones
3. El servicio valida tipos MIME, no solo extensiones
4. Los archivos persisten mientras el volumen de Docker exista
5. Para producción, considerar usar almacenamiento en la nube (S3, Azure Blob, etc.)
