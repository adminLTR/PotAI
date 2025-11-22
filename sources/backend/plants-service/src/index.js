const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const plantsRoutes = require('./routes/plants.routes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    service: 'Plants Service',
    version: '2.0.0',
    description: 'Gestión de plantas con integración a servicios de macetas, especies, IoT y media',
    endpoints: {
      health: 'GET /health - Health check',
      createPlant: 'POST /plants - Create plant (multipart/form-data: name, potLabel, speciesName, image, plantedAt, notes)',
      getAll: 'GET /plants?limit=50&offset=0 - Get all user plants',
      getById: 'GET /plants/:id - Get plant by ID with IoT data',
      update: 'PUT /plants/:id - Update plant',
      delete: 'DELETE /plants/:id - Delete plant',
      getByPot: 'GET /plants/pot/:potId - Get plants by pot ID'
    },
    integrations: {
      media: 'Uploads plant images to Media Service',
      pots: 'Creates/associates pots via Pots Service',
      species: 'Searches species via Species Service',
      iot: 'Retrieves sensor data and watering logs from IoT Service'
    },
    authentication: {
      required: 'All endpoints require authentication via Gateway',
      headers: 'x-user-id, x-session-token, Authorization'
    }
  });
});

// Mount routes
app.use('/', plantsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Route ${req.method} ${req.path} not found` 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({ error: 'Database error', message: err.message });
  }
  
  // Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: 'File upload error', message: err.message });
  }
  
  // Operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  
  // Generic error
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌱 Plants Service running on port ${PORT}`);
  console.log(`📡 Integrated with: Auth, Media, Pots, Species, IoT services`);
});
