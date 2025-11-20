# 💡 EJEMPLOS DE IMPLEMENTACIÓN

Esta guía muestra ejemplos de cómo implementar los controllers y rutas en cada servicio.

## 📋 Tabla de Contenidos
1. [Auth Service - Ejemplo Completo](#auth-service)
2. [Plants Service - Ejemplo](#plants-service)
3. [Media Service - Upload con Multer](#media-service)
4. [ML Service - Predicciones](#ml-service)
5. [Middleware de Autenticación](#middleware)

---

## Auth Service

### 1. Middleware de Autenticación
**Archivo**: `auth-service/src/middleware/auth.middleware.js`

```javascript
const jwt = require('jsonwebtoken');
const axios = require('axios');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verificar JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validar sesión en Redis
    const isValid = await validateSession(decoded.sessionToken);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const validateSession = async (sessionToken) => {
  // Implementar validación con Redis
  // const redis = require('redis').createClient({ url: process.env.REDIS_URL });
  // const session = await redis.get(`session:${sessionToken}`);
  // return !!session;
  return true; // TODO: Implementar con Redis
};

module.exports = { authenticateToken };
```

### 2. Controller de Autenticación
**Archivo**: `auth-service/src/controllers/auth.controller.js`

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validar datos
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash
      }
    });

    // Crear sesión
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      }
    });

    // Guardar en Redis
    // await redis.set(`session:${sessionToken}`, JSON.stringify({ userId: user.id }), 'EX', 7*24*60*60);

    // Generar JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        sessionToken: session.sessionToken
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token,
      expiresIn: '7d'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Crear nueva sesión
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Guardar en Redis
    // await redis.set(`session:${sessionToken}`, JSON.stringify({ userId: user.id }), 'EX', 7*24*60*60);

    // Generar JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        sessionToken: session.sessionToken
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token,
      expiresIn: '7d'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  try {
    const { sessionToken } = req.user;

    // Eliminar sesión de DB
    await prisma.session.delete({
      where: { sessionToken }
    });

    // Eliminar de Redis
    // await redis.del(`session:${sessionToken}`);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login, logout, me };
```

### 3. Rutas de Autenticación
**Archivo**: `auth-service/src/routes/auth.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const { register, login, logout, me } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, me);

module.exports = router;
```

### 4. Actualizar index.js
**Archivo**: `auth-service/src/index.js`

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ 
    service: 'Auth Service',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /register',
        login: 'POST /login',
        logout: 'POST /logout',
        me: 'GET /me'
      }
    }
  });
});

// Rutas
app.use('/', authRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
});
```

---

## Plants Service

### Controller Ejemplo
**Archivo**: `plants-service/src/controllers/plants.controller.js`

```javascript
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

const createPlant = async (req, res) => {
  try {
    const { name, potId, speciesId, notes } = req.body;
    const userId = req.user.userId;

    // 1. Validar que la maceta existe y pertenece al usuario
    try {
      const potResponse = await axios.get(
        `${process.env.POTS_SERVICE_URL}/${potId}`,
        { headers: { 'Authorization': req.headers.authorization } }
      );

      if (potResponse.data.userId !== userId) {
        return res.status(403).json({ error: 'Pot does not belong to user' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid pot' });
    }

    // 2. Validar que la especie existe
    try {
      await axios.get(`${process.env.SPECIES_SERVICE_URL}/${speciesId}`);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid species' });
    }

    // 3. Manejar imagen si existe
    let imageUrl = null;
    if (req.file) {
      const formData = new FormData();
      formData.append('image', req.file.buffer, req.file.originalname);

      const uploadResponse = await axios.post(
        `${process.env.MEDIA_SERVICE_URL}/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      imageUrl = uploadResponse.data.url;
    }

    // 4. Crear planta
    const plant = await prisma.plant.create({
      data: {
        userId,
        potId,
        speciesId,
        name,
        imageUrl,
        notes
      }
    });

    res.status(201).json(plant);
  } catch (error) {
    console.error('Create plant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPlants = async (req, res) => {
  try {
    const userId = req.user.userId;

    const plants = await prisma.plant.findMany({
      where: { userId },
      orderBy: { plantedAt: 'desc' }
    });

    res.json(plants);
  } catch (error) {
    console.error('Get plants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createPlant, getPlants };
```

---

## Media Service

### Upload con Multer
**Archivo**: `media-service/src/routes/upload.routes.js`

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configurar almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configurar multer
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
    cb(new Error('Only images are allowed (jpeg, jpg, png, gif)'));
  }
});

// Endpoint de upload
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(201).json({
      url: url,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

**Actualizar index.js**:
```javascript
const uploadRoutes = require('./routes/upload.routes');
app.use('/', uploadRoutes);
```

---

## ML Service

### Predicciones con TensorFlow y scikit-learn
**Archivo**: `ml-service/app.py`

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import joblib
import numpy as np
from PIL import Image
import io
import os
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PORT = int(os.getenv('PORT', 5000))

# Cargar modelos al inicio
try:
    RECOGNITION_MODEL_PATH = 'models/model-recognition.h5'
    IRRIGATION_MODEL_PATH = 'models/modelo_riego_numerico.pkl'
    
    recognition_model = tf.keras.models.load_model(RECOGNITION_MODEL_PATH)
    irrigation_model = joblib.load(IRRIGATION_MODEL_PATH)
    
    logger.info('✅ Models loaded successfully')
except Exception as e:
    logger.error(f'❌ Error loading models: {e}')
    recognition_model = None
    irrigation_model = None

# Mapping de especies (debe coincidir con el orden del modelo)
SPECIES_MAP = {
    0: 'ajo',
    1: 'geranio',
    2: 'hierbabuena',
    3: 'menta',
    4: 'oregano',
    5: 'orquidea',
    6: 'rosachina',
    7: 'tomatecherry'
}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'ml-service',
        'models': {
            'recognition': 'loaded' if recognition_model else 'not loaded',
            'irrigation': 'loaded' if irrigation_model else 'not loaded'
        }
    })

@app.route('/predict/recognition', methods=['POST'])
def predict_recognition():
    """Reconoce el tipo de planta a partir de una imagen"""
    try:
        if recognition_model is None:
            return jsonify({'error': 'Recognition model not loaded'}), 503

        # Obtener imagen del request
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400

        image_file = request.files['image']

        # Preprocesar imagen
        img = Image.open(image_file).convert('RGB')
        img = img.resize((224, 224))  # Ajustar según tu modelo
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # Predicción
        predictions = recognition_model.predict(img_array)[0]
        species_idx = np.argmax(predictions)
        confidence = float(predictions[species_idx])

        # Top 3 predicciones
        top_indices = np.argsort(predictions)[-3:][::-1]
        top_predictions = [
            {
                'species': SPECIES_MAP[idx],
                'confidence': float(predictions[idx])
            }
            for idx in top_indices
        ]

        return jsonify({
            'species': SPECIES_MAP[species_idx],
            'confidence': confidence,
            'predictions': top_predictions
        })

    except Exception as e:
        logger.error(f'Recognition error: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/predict/irrigation', methods=['POST'])
def predict_irrigation():
    """Predice si una planta necesita riego y la cantidad"""
    try:
        if irrigation_model is None:
            return jsonify({'error': 'Irrigation model not loaded'}), 503

        data = request.get_json()

        # Validar datos
        required = ['speciesId', 'moisture', 'temperature', 'humidity', 'light']
        if not all(key in data for key in required):
            return jsonify({'error': f'Missing fields. Required: {required}'}), 400

        # Preparar features (ajustar según tu modelo)
        features = np.array([[
            data['speciesId'],
            data['moisture'],
            data['temperature'],
            data['humidity'],
            data['light']
        ]])

        # Predicción
        prediction = irrigation_model.predict(features)[0]
        needs_watering = bool(prediction > 0.5)

        # Calcular cantidad de agua (lógica simple, ajustar según tu modelo)
        water_amount = 0
        if needs_watering:
            if data['moisture'] < 30:
                water_amount = 300
            elif data['moisture'] < 50:
                water_amount = 200
            else:
                water_amount = 100

        return jsonify({
            'needsWatering': needs_watering,
            'waterAmountMl': water_amount,
            'confidence': float(abs(prediction)),
            'recommendation': f'La planta {"necesita" if needs_watering else "no necesita"} riego'
        })

    except Exception as e:
        logger.error(f'Irrigation error: {e}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info(f'🤖 ML Service starting on port {PORT}')
    app.run(host='0.0.0.0', port=PORT, debug=True)
```

---

## Middleware

### Middleware de Validación (Express Validator)
**Archivo**: `auth-service/src/middleware/validation.middleware.js`

```javascript
const { body, validationResult } = require('express-validator');

const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateRegister };
```

**Usar en rutas**:
```javascript
const { validateRegister } = require('../middleware/validation.middleware');

router.post('/register', validateRegister, register);
```

---

## Testing

### Test con curl
```bash
# Register
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Me (con token)
TOKEN="tu_token_aqui"
curl http://localhost:8080/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Upload imagen
curl -X POST http://localhost:8080/media/upload \
  -F "image=@/path/to/image.jpg"

# Crear planta
curl -X POST http://localhost:8080/plants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mi Rosa","potId":1,"speciesId":7}'
```

---

## Tips de Implementación

### 1. Manejo de Errores Consistente
```javascript
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error(err);
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

app.use(errorHandler);
```

### 2. Async/Await Wrapper
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usar en controllers
const getPlants = asyncHandler(async (req, res) => {
  const plants = await prisma.plant.findMany();
  res.json(plants);
});
```

### 3. Logger Centralizado
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

---

**Estos ejemplos te dan una base sólida para implementar todos los servicios! 🚀**
