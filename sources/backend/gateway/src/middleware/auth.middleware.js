const axios = require('axios');

/**
 * Middleware para validar tokens con el Auth Service
 * Inyecta información del usuario en las requests a otros servicios
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-session-token'];

    // Si no hay token, continuar (servicios pueden tener rutas públicas)
    if (!authHeader || !sessionToken) {
      return next();
    }

    // Validar tokens con Auth Service
    const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
    
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/auth/validate`, {
        headers: {
          'Authorization': authHeader,
          'X-Session-Token': sessionToken
        },
        timeout: 5000
      });

      if (response.data.valid) {
        // Inyectar datos del usuario en los headers para los servicios
        req.headers['x-user-id'] = response.data.user.id;
        req.headers['x-user-username'] = response.data.user.username;
        req.headers['x-user-email'] = response.data.user.email;
        
        console.log(`✅ Request authenticated: user ${response.data.user.username}`);
      }
    } catch (error) {
      // Si falla la validación, no bloqueamos (servicios deciden si requieren auth)
      console.log(`⚠️ Token validation failed: ${error.message}`);
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next(); // No bloquear el request
  }
};

/**
 * Middleware para REQUERIR autenticación
 * Bloquea requests sin token válido
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-session-token'];

    if (!authHeader || !sessionToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Validar tokens con Auth Service
    const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
    
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/auth/validate`, {
        headers: {
          'Authorization': authHeader,
          'X-Session-Token': sessionToken
        },
        timeout: 5000
      });

      if (!response.data.valid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token'
        });
      }

      // Inyectar datos del usuario
      req.headers['x-user-id'] = response.data.user.id;
      req.headers['x-user-username'] = response.data.user.username;
      req.headers['x-user-email'] = response.data.user.email;
      req.user = response.data.user;

      next();
    } catch (error) {
      console.error('Token validation error:', error.message);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication service unavailable or token invalid'
      });
    }
  } catch (error) {
    console.error('Require auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication error'
    });
  }
};

module.exports = {
  authMiddleware,
  requireAuth
};
