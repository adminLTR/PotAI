const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const iotRoutes = require('./routes/iot.routes');

const app = express();
const PORT = process.env.PORT || 3004;

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
    service: 'IoT Service',
    version: '2.0.0',
    description: 'Gestión de datos de sensores ESP32 y control de riego automático',
    endpoints: {
      health: 'GET /health - Health check',
      sensorData: 'POST /iot/sensor-data - Recibir datos del ESP32 (público)',
      conditions: 'GET /iot/plants/:plantId/conditions?limit=100 - Obtener condiciones ambientales',
      latest: 'GET /iot/plants/:plantId/latest - Obtener última condición',
      wateringLogs: 'GET /iot/plants/:plantId/watering-logs?limit=100 - Historial de riego',
      manualWatering: 'POST /iot/watering - Registrar riego manual (auth requerido)'
    },
    esp32: {
      endpoint: 'POST /iot/sensor-data',
      payload: '{ plantId, temperature, humidity, moisture, light }',
      response: '{ wateringDecision: { needsWatering, amountMl } }'
    }
  });
});

// Mount routes
app.use('/', iotRoutes);

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
  console.log(`📡 IoT Service running on port ${PORT}`);
  console.log(`🌡️ Ready to receive ESP32 sensor data`);
});
