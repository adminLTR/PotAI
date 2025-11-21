const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const authRoutes = require('./routes/auth.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const sessionService = require('./services/session.service');

const app = express();
const PORT = process.env.PORT || 3001;

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
    service: 'Auth Service',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        logout: 'POST /auth/logout',
        validate: 'GET /auth/validate',
        me: 'GET /auth/me',
        health: 'GET /auth/health'
      }
    }
  });
});

// Rutas - sin prefijo adicional porque el gateway ya añade /auth
app.use('/', authRoutes);

// Manejadores de error
app.use(notFoundHandler);
app.use(errorHandler);

// Inicialización del servidor
const startServer = async () => {
  try {
    // Conectar a base de datos
    await connectDatabase();

    // Conectar a Redis
    await connectRedis();

    // Limpiar sesiones expiradas cada hora
    setInterval(() => {
      sessionService.cleanupExpiredSessions().catch(console.error);
    }, 60 * 60 * 1000);

    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🔐 Auth Service running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Manejo de señales de terminación
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();
