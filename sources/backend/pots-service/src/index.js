const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'pots-service', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ 
    service: 'Pots Service',
    version: '1.0.0',
    endpoints: {
      pots: {
        create: 'POST /pots',
        getAll: 'GET /pots',
        getById: 'GET /pots/:id',
        getOrCreate: 'POST /pots/get-or-create',
        update: 'PUT /pots/:id',
        delete: 'DELETE /pots/:id'
      }
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🪴 Pots Service running on port ${PORT}`);
});
