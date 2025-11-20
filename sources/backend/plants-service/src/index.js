const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'plants-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    service: 'Plants Service',
    version: '1.0.0',
    endpoints: {
      plants: {
        create: 'POST /plants',
        getAll: 'GET /plants',
        getById: 'GET /plants/:id',
        update: 'PUT /plants/:id',
        delete: 'DELETE /plants/:id',
        getByUser: 'GET /plants/user/:userId'
      }
    }
  });
});

// TODO: Implementar rutas
// const plantsRoutes = require('./routes/plants.routes');
// app.use('/plants', plantsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌱 Plants Service running on port ${PORT}`);
});
