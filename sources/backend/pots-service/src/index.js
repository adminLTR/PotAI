const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const potsRoutes = require('./routes/pots.routes');

const app = express();
const PORT = process.env.PORT || 3003;

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
    service: 'Pots Service',
    version: '2.0.0',
    description: 'Gestión de macetas (códigos ESP32) para PotAI',
    endpoints: {
      health: 'GET /health - Health check',
      create: 'POST /pots - Create pot',
      getAll: 'GET /pots - Get all user pots',
      getById: 'GET /pots/:id - Get pot by ID',
      getOrCreate: 'POST /pots/get-or-create - Get or create pot by label',
      update: 'PUT /pots/:id - Update pot',
      delete: 'DELETE /pots/:id - Delete pot'
    },
    authentication: {
      required: 'All endpoints require x-user-id header from Gateway'
    }
  });
});

// Mount routes
app.use('/', potsRoutes);

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
  console.log(`🪴 Pots Service running on port ${PORT}`);
});
