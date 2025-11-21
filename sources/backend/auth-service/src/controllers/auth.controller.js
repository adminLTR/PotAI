const authService = require('../services/auth.service');
const { sanitizeUser } = require('../middleware/validation.middleware');

class AuthController {
  /**
   * POST /auth/register
   * Registra un nuevo usuario
   */
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      const user = await authService.register({ username, email, password });

      res.status(201).json({
        message: 'User created successfully',
        user: sanitizeUser(user)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/login
   * Autentica un usuario y devuelve tokens
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      const result = await authService.login(username, password);

      res.json({
        message: 'Login successful',
        accessToken: result.accessToken,
        sessionToken: result.sessionToken,
        expiresAt: result.expiresAt,
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/logout
   * Cierra la sesión del usuario actual
   */
  async logout(req, res, next) {
    try {
      const sessionToken = req.sessionToken;

      await authService.logout(sessionToken);

      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/validate
   * Valida los tokens del usuario (usado por otros servicios)
   */
  async validate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const sessionToken = req.headers['x-session-token'];

      if (!authHeader || !sessionToken) {
        return res.status(401).json({
          valid: false,
          error: 'Missing tokens'
        });
      }

      const accessToken = authHeader.substring(7);

      const result = await authService.validateTokens(accessToken, sessionToken);

      res.json(result);
    } catch (error) {
      res.status(401).json({
        valid: false,
        error: error.message
      });
    }
  }

  /**
   * GET /auth/me
   * Obtiene información del usuario autenticado
   */
  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await authService.getCurrentUser(userId);

      res.json({
        user: sanitizeUser(user)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/health
   * Health check del servicio
   */
  async healthCheck(req, res) {
    res.json({
      status: 'healthy',
      service: 'auth-service',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new AuthController();
