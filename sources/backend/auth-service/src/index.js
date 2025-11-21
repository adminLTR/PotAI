const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
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
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    service: 'Auth Service',
    version: '2.0.0',
    description: 'Complete authentication service with JWT, sessions, and refresh tokens',
    endpoints: {
      public: {
        register: 'POST /auth/register - Register new user',
        login: 'POST /auth/login - Login and get tokens',
        refresh: 'POST /auth/refresh - Refresh access token',
        validate: 'GET /auth/validate - Validate tokens (for other services)',
        health: 'GET /auth/health - Health check'
      },
      protected: {
        logout: 'POST /auth/logout - Logout current session',
        logoutAll: 'POST /auth/logout-all - Logout all sessions',
        me: 'GET /auth/me - Get current user info',
        changePassword: 'PUT /auth/change-password - Change password',
        sessions: 'GET /auth/sessions - Get all active sessions',
        revokeSession: 'DELETE /auth/sessions/:sessionToken - Revoke specific session'
      }
    },
    features: [
      'JWT access tokens',
      'Refresh token rotation',
      'Session management with Redis caching',
      'IP address and User-Agent tracking',
      'HttpOnly cookies for refresh tokens',
      'Password hashing with bcrypt',
      'Automatic session cleanup'
    ]
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
