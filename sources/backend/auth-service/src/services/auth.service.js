const { prisma } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken, verifyToken } = require('../utils/jwt');
const { generateSecureToken } = require('../utils/crypto');
const sessionService = require('./session.service');
const { UnauthorizedError, ConflictError, BadRequestError } = require('../utils/errors');

class AuthService {
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado
   */
  async register({ username, email, password }) {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'Username' : 'Email';
      throw new ConflictError(`${field} already exists`);
    }

    // Hashear contraseña
    const passwordHash = await hashPassword(password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        isActive: true,
        isVerified: false // Puede requerir verificación de email en el futuro
      },
      select: {
        id: true,
        username: true,
        email: true,
        isActive: true,
        isVerified: true,
        createdAt: true
      }
    });

    console.log(`✅ User registered: ${username} (${email})`);
    return user;
  }

  /**
   * Autentica un usuario
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @param {Object} clientInfo - Información del cliente (IP, User-Agent)
   * @returns {Promise<Object>} Tokens y datos del usuario
   */
  async login(username, password, clientInfo = {}) {
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    // Verificar contraseña
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Crear nueva sesión con información del cliente
    const session = await sessionService.createSession(user.id, clientInfo);

    // Generar tokens
    const accessToken = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    console.log(`✅ User logged in: ${username} from IP ${clientInfo.ipAddress || 'unknown'}`);

    return {
      accessToken,
      refreshToken: session.refreshToken,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      }
    };
  }

  /**
   * Refresca el access token usando un refresh token
   * @param {string} refreshToken - Refresh token
   * @param {Object} clientInfo - Información del cliente
   * @returns {Promise<Object>} Nuevo access token
   */
  async refreshAccessToken(refreshToken, clientInfo = {}) {
    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }

    // Validar y refrescar sesión
    const session = await sessionService.refreshSession(refreshToken, clientInfo);
    
    if (!session) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Generar nuevo access token
    const accessToken = generateToken({
      userId: session.userId,
      username: session.username,
      email: session.email
    });

    console.log(`✅ Access token refreshed for user ${session.username}`);

    return {
      accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt
    };
  }

  /**
   * Cierra sesión de un usuario
   * @param {string} sessionToken - Token de sesión (opcional)
   * @param {string} refreshToken - Refresh token (opcional)
   */
  async logout(sessionToken, refreshToken) {
    if (sessionToken) {
      await sessionService.deleteSession(sessionToken);
    }
    if (refreshToken) {
      await sessionService.deleteSessionByRefreshToken(refreshToken);
    }
    console.log(`✅ User logged out`);
  }

  /**
   * Cierra todas las sesiones de un usuario
   * @param {number} userId - ID del usuario
   */
  async logoutAll(userId) {
    await sessionService.deleteUserSessions(userId);
    console.log(`✅ All sessions logged out for user ${userId}`);
  }

  /**
   * Valida un token y sesión
   * @param {string} accessToken - JWT token
   * @param {string} sessionToken - Session token (opcional)
   * @returns {Promise<Object>} Datos del usuario
   */
  async validateTokens(accessToken, sessionToken) {
    // Verificar JWT
    let decoded;
    try {
      decoded = verifyToken(accessToken);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired access token');
    }

    // Si se proporciona session token, validarlo también
    if (sessionToken) {
      const session = await sessionService.validateSession(sessionToken);
      if (!session) {
        throw new UnauthorizedError('Invalid or expired session');
      }

      // Verificar que el session token pertenece al usuario del JWT
      if (session.userId !== decoded.userId) {
        throw new UnauthorizedError('Token mismatch');
      }
    }

    return {
      valid: true,
      user: {
        id: decoded.userId,
        username: decoded.username,
        email: decoded.email
      }
    };
  }

  /**
   * Obtiene información del usuario actual
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    return user;
  }

  /**
   * Cambia la contraseña de un usuario
   * @param {number} userId - ID del usuario
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Verificar contraseña actual
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hashear nueva contraseña
    const passwordHash = await hashPassword(newPassword);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    // Cerrar todas las sesiones por seguridad
    await sessionService.deleteUserSessions(userId);

    console.log(`✅ Password changed for user ${user.username}`);
  }

  /**
   * Obtiene todas las sesiones activas de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} Lista de sesiones
   */
  async getUserSessions(userId) {
    return await sessionService.getUserSessions(userId);
  }

  /**
   * Revoca una sesión específica
   * @param {number} userId - ID del usuario
   * @param {string} sessionToken - Token de la sesión a revocar
   */
  async revokeSession(userId, sessionToken) {
    // Verificar que la sesión pertenece al usuario
    const session = await prisma.session.findUnique({
      where: { sessionToken }
    });

    if (!session || session.userId !== userId) {
      throw new BadRequestError('Session not found');
    }

    await sessionService.deleteSession(sessionToken);
    console.log(`✅ Session revoked for user ${userId}`);
  }
}

module.exports = new AuthService();
