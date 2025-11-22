const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const mediaRoutes = require('./routes/media.routes');
const { multerErrorHandler, errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware de seguridad y parseo
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    service: 'Media Service',
    version: '2.0.0',
    description: 'Multimedia file upload and storage service',
    endpoints: {
      upload: {
        multiple: 'POST /upload - Upload multiple files (max 10)',
        single: 'POST /upload/single - Upload single file'
      },
      files: {
        list: 'GET /files - List all files',
        get: 'GET /files/:filename - Get file',
        info: 'GET /info/:filename - Get file info',
        delete: 'DELETE /files/:filename - Delete file'
      },
      health: 'GET /health - Health check'
    },
    limits: {
      maxFileSize: '50MB',
      maxFilesPerUpload: 10
    },
    supportedTypes: [
      'Images: jpeg, jpg, png, gif, webp, svg',
      'Videos: mp4, mpeg, quicktime, avi, webm',
      'Audio: mp3, wav, webm, ogg',
      'Documents: pdf, doc, docx, xls, xlsx',
      'Text: txt, csv, json'
    ]
  });
});

// Media routes - sin prefijo porque el Gateway ya hace pathRewrite de /media -> ''
app.use('/', mediaRoutes);

// Error handlers
app.use(multerErrorHandler);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📁 Media Service running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📂 Upload directory: ${path.join(__dirname, '../uploads')}`);
});
