const { verifyToken } = require('../utils/jwt');
const sessionService = require('../services/session.service');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Middleware para autenticar requests
 * Verifica JWT y session token
 */
const authenticate = async (req, res, next) => {
  try {
    // Extraer tokens de los headers
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-session-token'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing access token');
    }

    const accessToken = authHeader.substring(7);

    // Verificar JWT
    let decoded;
    try {
      decoded = verifyToken(accessToken);
    } catch (error) {
      throw new UnauthorizedError(error.message);
    }

    // Validar sesión si se proporciona
    if (sessionToken) {
      const session = await sessionService.validateSession(sessionToken);
      if (!session) {
        throw new UnauthorizedError('Invalid or expired session');
      }

      // Verificar que el userId del JWT coincida con la sesión
      if (session.userId !== decoded.userId) {
        throw new UnauthorizedError('Token mismatch');
      }

      req.sessionToken = sessionToken;
    }

    // Agregar información del usuario al request
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Middleware opcional para autenticar si hay token
 * No falla si no hay token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-session-token'];

    if (authHeader && authHeader.startsWith('Bearer ') && sessionToken) {
      const accessToken = authHeader.substring(7);
      const decoded = verifyToken(accessToken);
      const session = await sessionService.validateSession(sessionToken);

      if (session && session.userId === decoded.userId) {
        req.user = {
          id: decoded.userId,
          username: decoded.username,
          email: decoded.email
        };
        req.sessionToken = sessionToken;
      }
    }
  } catch (error) {
    // Ignorar errores en auth opcional
    console.log('Optional auth failed:', error.message);
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuth
};
