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

      // Validación básica
      if (!username || !email || !password) {
        return res.status(400).json({
          error: 'Username, email and password are required'
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters long'
        });
      }

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

      if (!username || !password) {
        return res.status(400).json({
          error: 'Username and password are required'
        });
      }

      // Obtener información del cliente
      const clientInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      };

      const result = await authService.login(username, password, clientInfo);

      // Enviar refresh token como httpOnly cookie (más seguro)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
      });

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
   * POST /auth/refresh
   * Refresca el access token usando refresh token
   */
  async refreshToken(req, res, next) {
    try {
      // Obtener refresh token de cookie o body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token is required'
        });
      }

      // Obtener información del cliente
      const clientInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      };

      const result = await authService.refreshAccessToken(refreshToken, clientInfo);

      // Actualizar refresh token cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        message: 'Token refreshed successfully',
        accessToken: result.accessToken,
        expiresAt: result.expiresAt
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
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      await authService.logout(sessionToken, refreshToken);

      // Limpiar refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/logout-all
   * Cierra todas las sesiones del usuario
   */
  async logoutAll(req, res, next) {
    try {
      const userId = req.user.id;

      await authService.logoutAll(userId);

      // Limpiar refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        message: 'All sessions logged out successfully'
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

      if (!authHeader) {
        return res.status(401).json({
          valid: false,
          error: 'Missing access token'
        });
      }

      const accessToken = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7)
        : authHeader;

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
   * PUT /auth/change-password
   * Cambia la contraseña del usuario
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: 'New password must be at least 8 characters long'
        });
      }

      await authService.changePassword(userId, currentPassword, newPassword);

      // Limpiar refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        message: 'Password changed successfully. Please login again.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/sessions
   * Obtiene todas las sesiones activas del usuario
   */
  async getSessions(req, res, next) {
    try {
      const userId = req.user.id;

      const sessions = await authService.getUserSessions(userId);

      res.json({
        sessions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /auth/sessions/:sessionToken
   * Revoca una sesión específica
   */
  async revokeSession(req, res, next) {
    try {
      const userId = req.user.id;
      const { sessionToken } = req.params;

      if (!sessionToken) {
        return res.status(400).json({
          error: 'Session token is required'
        });
      }

      await authService.revokeSession(userId, sessionToken);

      res.json({
        message: 'Session revoked successfully'
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
