const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3006;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'species-service', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ 
    service: 'Species Service',
    version: '1.0.0',
    endpoints: {
      species: {
        getAll: 'GET /species',
        getById: 'GET /species/:id',
        search: 'GET /species/search?name=...',
        create: 'POST /species',
        update: 'PUT /species/:id'
      }
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌿 Species Service running on port ${PORT}`);
});
