const { prisma } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const sessionService = require('./session.service');
const { UnauthorizedError, ConflictError } = require('../utils/errors');

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
        passwordHash
      },
      select: {
        id: true,
        username: true,
        email: true,
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
   * @returns {Promise<Object>} Tokens y datos del usuario
   */
  async login(username, password) {
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verificar contraseña
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Eliminar sesiones antiguas del usuario
    await sessionService.deleteUserSessions(user.id);

    // Crear nueva sesión
    const session = await sessionService.createSession(user.id);

    // Generar JWT
    const accessToken = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    console.log(`✅ User logged in: ${username}`);

    return {
      accessToken,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }

  /**
   * Cierra sesión de un usuario
   * @param {string} sessionToken - Token de sesión
   */
  async logout(sessionToken) {
    await sessionService.deleteSession(sessionToken);
    console.log(`✅ User logged out`);
  }

  /**
   * Valida un token y sesión
   * @param {string} accessToken - JWT token
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object>} Datos del usuario
   */
  async validateTokens(accessToken, sessionToken) {
    // Validar sesión
    const session = await sessionService.validateSession(sessionToken);
    if (!session) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    return {
      valid: true,
      user: {
        id: session.userId,
        username: session.username,
        email: session.email
      },
      expiresAt: session.expiresAt
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
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return user;
  }
}

module.exports = new AuthService();
