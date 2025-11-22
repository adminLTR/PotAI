const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const speciesRoutes = require('./routes/species.routes');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    service: 'Species Service',
    version: '2.0.0',
    description: 'Catálogo de especies de plantas con requerimientos de cuidado',
    endpoints: {
      health: 'GET /health - Health check',
      getAll: 'GET /species - Get all species (público)',
      search: 'GET /species/search?q=rosa - Search species (público)',
      getById: 'GET /species/:id - Get species by ID (público)',
      create: 'POST /species - Create species (auth requerido)',
      update: 'PUT /species/:id - Update species (auth requerido)',
      delete: 'DELETE /species/:id - Delete species (auth requerido)'
    },
    mlIntegration: {
      recognizedSpecies: ['ajo', 'geranio', 'hierbabuena', 'menta', 'oregano', 'orquidea', 'rosachina', 'tomatecherry']
    }
  });
});

// Mount routes
app.use('/', speciesRoutes);

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
  
  // Operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  
  // Generic error
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌿 Species Service running on port ${PORT}`);
});
