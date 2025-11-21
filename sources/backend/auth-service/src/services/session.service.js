const { prisma } = require('../config/database');
const { getRedisClient } = require('../config/redis');
const { generateSecureToken } = require('../utils/crypto');
const { getExpirationDate } = require('../utils/jwt');

class SessionService {
  /**
   * Crea una nueva sesión para un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Sesión creada con token
   */
  async createSession(userId) {
    const sessionToken = generateSecureToken(32);
    const expiresAt = getExpirationDate();

    // Crear sesión en base de datos
    const session = await prisma.session.create({
      data: {
        userId,
        sessionToken,
        expiresAt
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    // Guardar en Redis para acceso rápido
    await this.cacheSession(session);

    return session;
  }

  /**
   * Guarda una sesión en Redis
   * @param {Object} session - Sesión a cachear
   */
  async cacheSession(session) {
    try {
      const redis = getRedisClient();
      const ttl = Math.floor((new Date(session.expiresAt) - new Date()) / 1000);
      
      const sessionData = {
        userId: session.userId,
        username: session.user?.username,
        email: session.user?.email,
        expiresAt: session.expiresAt
      };

      await redis.setEx(
        `session:${session.sessionToken}`,
        ttl > 0 ? ttl : 1,
        JSON.stringify(sessionData)
      );
    } catch (error) {
      console.error('Error caching session:', error);
      // No lanzar error, la sesión está en DB
    }
  }

  /**
   * Valida una sesión por su token
   * @param {string} sessionToken - Token de sesión
   * @returns {Promise<Object|null>} Datos de sesión o null si inválida
   */
  async validateSession(sessionToken) {
    if (!sessionToken) return null;

    try {
      // Intentar obtener de Redis primero
      const redis = getRedisClient();
      const cached = await redis.get(`session:${sessionToken}`);
      
      if (cached) {
        const sessionData = JSON.parse(cached);
        // Verificar que no haya expirado
        if (new Date(sessionData.expiresAt) > new Date()) {
          return sessionData;
        }
      }
    } catch (error) {
      console.error('Redis error:', error);
      // Continuar con DB si Redis falla
    }

    // Si no está en Redis, buscar en DB
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!session) return null;

    // Verificar expiración
    if (new Date(session.expiresAt) <= new Date()) {
      await this.deleteSession(sessionToken);
      return null;
    }

    // Re-cachear en Redis
    await this.cacheSession(session);

    return {
      userId: session.userId,
      username: session.user.username,
      email: session.user.email,
      expiresAt: session.expiresAt
    };
  }

  /**
   * Elimina una sesión
   * @param {string} sessionToken - Token de sesión a eliminar
   */
  async deleteSession(sessionToken) {
    // Eliminar de Redis
    try {
      const redis = getRedisClient();
      await redis.del(`session:${sessionToken}`);
    } catch (error) {
      console.error('Error deleting from Redis:', error);
    }

    // Eliminar de DB
    await prisma.session.deleteMany({
      where: { sessionToken }
    });
  }

  /**
   * Elimina todas las sesiones de un usuario
   * @param {number} userId - ID del usuario
   */
  async deleteUserSessions(userId) {
    // Obtener todas las sesiones del usuario para limpiar Redis
    const sessions = await prisma.session.findMany({
      where: { userId },
      select: { sessionToken: true }
    });

    // Eliminar de Redis
    try {
      const redis = getRedisClient();
      const keys = sessions.map(s => `session:${s.sessionToken}`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error('Error deleting from Redis:', error);
    }

    // Eliminar de DB
    await prisma.session.deleteMany({
      where: { userId }
    });
  }

  /**
   * Limpia sesiones expiradas (ejecutar periódicamente)
   */
  async cleanupExpiredSessions() {
    const deleted = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lte: new Date()
        }
      }
    });

    console.log(`🧹 Cleaned up ${deleted.count} expired sessions`);
    return deleted.count;
  }
}

module.exports = new SessionService();
