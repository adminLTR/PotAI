# Media Service

Servicio de gestión de archivos multimedia (imágenes de plantas).

## Puerto
- **3005**

## Endpoints

### 1. Subir Imagen
```http
POST /upload
Content-Type: multipart/form-data

Body:
- image: File (imagen de planta)
```

**Response:**
```json
{
  "url": "http://localhost:3005/uploads/1234567890-plantimage.jpg",
  "filename": "1234567890-plantimage.jpg"
}
```

### 2. Obtener Imagen
```http
GET /uploads/:filename
```

**Response:** Archivo de imagen

## Configuración de Multer (TODO)

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed'));
  }
});
```

## Volumen Docker
- `/app/uploads` -> persistencia de imágenes

## Comunicación entre servicios

**Plants Service** llama a Media Service:
```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await axios.post('http://media-service:3005/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

const imageUrl = response.data.url;
```
