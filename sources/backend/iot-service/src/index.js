const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'iot-service', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ 
    service: 'IoT Service',
    version: '1.0.0',
    endpoints: {
      iot: {
        ingestData: 'POST /iot/sensor-data',
        getConditions: 'GET /conditions/plant/:plantId',
        getWateringLogs: 'GET /watering/plant/:plantId'
      }
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 IoT Service running on port ${PORT}`);
});
