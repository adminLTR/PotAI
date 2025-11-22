const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { authMiddleware, requireAuth } = require('./middleware/auth.middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: { error: 'Too many requests, please try again later.' }
});

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(limiter);

// Middleware de autenticación global (opcional, no bloquea)
app.use(authMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'API Gateway',
    version: '2.0.0',
    description: 'API Gateway with automatic authentication validation',
    services: {
      auth: '/auth/* - Authentication service (public)',
      plants: '/plants/* - Plants management (auth optional)',
      pots: '/pots/* - Pots management (auth optional)',
      iot: '/iot/* - IoT devices (auth optional)',
      media: '/media/* - Media storage (auth optional)',
      species: '/species/* - Species information (auth optional)',
      ml: '/ml/* - Machine Learning predictions (auth optional)'
    },
    authentication: {
      description: 'All requests are validated if Authorization header is present',
      headers: {
        authorization: 'Bearer <access_token>',
        session: 'x-session-token: <session_token>'
      },
      userInfo: 'Validated user info is injected in headers: x-user-id, x-user-username, x-user-email'
    }
  });
});

// Proxy configurations
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'warn',
  timeout: 30000, // 30 segundos
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(503).json({ 
      error: 'Service Unavailable', 
      message: 'The requested service is temporarily unavailable' 
    });
  }
};

// Rutas de microservicios
app.use('/auth', createProxyMiddleware({
  ...proxyOptions,
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  onProxyReq: (proxyReq, req, res) => {
    // Fix para body en PUT/POST
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }
}));

app.use('/plants', createProxyMiddleware({
  ...proxyOptions,
  target: process.env.PLANTS_SERVICE_URL || 'http://plants-service:3002',
  pathRewrite: { '^/plants': '' },
  onProxyReq: (proxyReq, req, res) => {
    // Fix para body en PUT/POST
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }
}));

app.use('/pots', createProxyMiddleware({
  ...proxyOptions,
  target: process.env.POTS_SERVICE_URL || 'http://pots-service:3003',
  pathRewrite: { '^/pots': '' }
}));

app.use('/iot', createProxyMiddleware({
  ...proxyOptions,
  target: process.env.IOT_SERVICE_URL || 'http://iot-service:3004',
  pathRewrite: { '^/iot': '' }
}));

app.use('/media', createProxyMiddleware({
  ...proxyOptions,
  target: process.env.MEDIA_SERVICE_URL || 'http://media-service:3005',
  pathRewrite: { '^/media': '' }
}));

app.use('/species', createProxyMiddleware({
  ...proxyOptions,
  target: process.env.SPECIES_SERVICE_URL || 'http://species-service:3006',
  pathRewrite: { '^/species': '' }
}));

app.use('/ml', createProxyMiddleware({
  ...proxyOptions,
  target: process.env.ML_SERVICE_URL || 'http://ml-service:5000',
  pathRewrite: { '^/ml': '' },
  onProxyReq: (proxyReq, req, res) => {
    // Fix para body en PUT/POST
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: 'The requested endpoint does not exist' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚪 API Gateway running on port ${PORT}`);
  console.log('Available routes:');
  console.log('  - /auth -> auth-service:3001');
  console.log('  - /plants -> plants-service:3002');
  console.log('  - /pots -> pots-service:3003');
  console.log('  - /iot -> iot-service:3004');
  console.log('  - /media -> media-service:3005');
  console.log('  - /species -> species-service:3006');
  console.log('  - /ml -> ml-service:5000');
});
