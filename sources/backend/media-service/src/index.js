const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'media-service', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ 
    service: 'Media Service',
    version: '1.0.0',
    endpoints: {
      media: {
        upload: 'POST /upload',
        getFile: 'GET /uploads/:filename'
      }
    }
  });
});

// TODO: Implementar upload con multer
// const uploadRoutes = require('./routes/upload.routes');
// app.use('/', uploadRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📁 Media Service running on port ${PORT}`);
});
