const { prisma } = require('../config/database');
const { getRedisClient } = require('../config/redis');
const { generateSecureToken } = require('../utils/crypto');
const { getExpirationDate } = require('../utils/jwt');

class SessionService {
  /**
   * Crea una nueva sesión para un usuario
   * @param {number} userId - ID del usuario
   * @param {Object} clientInfo - Información del cliente (ipAddress, userAgent)
   * @returns {Promise<Object>} Sesión creada con tokens
   */
  async createSession(userId, clientInfo = {}) {
    const sessionToken = generateSecureToken(32);
    const refreshToken = generateSecureToken(48);
    const expiresAt = getExpirationDate();
    const now = new Date();

    // Crear sesión en base de datos
    const session = await prisma.session.create({
      data: {
        userId,
        sessionToken,
        refreshToken,
        expiresAt,
        ipAddress: clientInfo.ipAddress || null,
        userAgent: clientInfo.userAgent || null,
        isActive: true,
        lastActivityAt: now
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
        expiresAt: session.expiresAt,
        refreshToken: session.refreshToken,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        isActive: session.isActive
      };

      // Cachear por sessionToken
      await redis.setEx(
        `session:${session.sessionToken}`,
        ttl > 0 ? ttl : 1,
        JSON.stringify(sessionData)
      );

      // Cachear también por refreshToken para búsqueda rápida
      if (session.refreshToken) {
        await redis.setEx(
          `refresh:${session.refreshToken}`,
          ttl > 0 ? ttl : 1,
          session.sessionToken
        );
      }
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
        // Verificar que no haya expirado y esté activa
        if (sessionData.isActive && new Date(sessionData.expiresAt) > new Date()) {
          // Actualizar última actividad
          await this.updateSessionActivity(sessionToken);
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

    // Verificar expiración y estado
    if (!session.isActive || new Date(session.expiresAt) <= new Date()) {
      await this.deleteSession(sessionToken);
      return null;
    }

    // Actualizar última actividad
    await this.updateSessionActivity(sessionToken);

    // Re-cachear en Redis
    await this.cacheSession(session);

    return {
      userId: session.userId,
      username: session.user.username,
      email: session.user.email,
      expiresAt: session.expiresAt,
      refreshToken: session.refreshToken
    };
  }

  /**
   * Actualiza la última actividad de una sesión
   * @param {string} sessionToken - Token de sesión
   */
  async updateSessionActivity(sessionToken) {
    try {
      await prisma.session.update({
        where: { sessionToken },
        data: { lastActivityAt: new Date() }
      });
    } catch (error) {
      // No crítico, solo log
      console.error('Error updating session activity:', error);
    }
  }

  /**
   * Refresca una sesión usando refresh token
   * @param {string} refreshToken - Refresh token
   * @param {Object} clientInfo - Información del cliente
   * @returns {Promise<Object|null>} Nueva sesión o null
   */
  async refreshSession(refreshToken, clientInfo = {}) {
    if (!refreshToken) return null;

    let sessionToken;

    try {
      // Buscar sessionToken desde refresh token en Redis
      const redis = getRedisClient();
      sessionToken = await redis.get(`refresh:${refreshToken}`);
    } catch (error) {
      console.error('Redis error:', error);
    }

    // Buscar sesión en DB
    const session = await prisma.session.findUnique({
      where: sessionToken ? { sessionToken } : { refreshToken },
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

    if (!session || !session.isActive) return null;

    // Verificar expiración
    if (new Date(session.expiresAt) <= new Date()) {
      await this.deleteSession(session.sessionToken);
      return null;
    }

    // Generar nuevo refresh token (rotación)
    const newRefreshToken = generateSecureToken(48);
    const newExpiresAt = getExpirationDate();

    // Actualizar sesión
    const updatedSession = await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
        lastActivityAt: new Date(),
        ipAddress: clientInfo.ipAddress || session.ipAddress,
        userAgent: clientInfo.userAgent || session.userAgent
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

    // Eliminar cache anterior y cachear nueva sesión
    try {
      const redis = getRedisClient();
      await redis.del(`session:${session.sessionToken}`);
      await redis.del(`refresh:${refreshToken}`);
    } catch (error) {
      console.error('Error deleting old cache:', error);
    }

    await this.cacheSession(updatedSession);

    return {
      userId: updatedSession.userId,
      username: updatedSession.user.username,
      email: updatedSession.user.email,
      sessionToken: updatedSession.sessionToken,
      refreshToken: updatedSession.refreshToken,
      expiresAt: updatedSession.expiresAt
    };
  }

  /**
   * Elimina una sesión
   * @param {string} sessionToken - Token de sesión a eliminar
   */
  async deleteSession(sessionToken) {
    // Obtener refresh token antes de eliminar
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      select: { refreshToken: true }
    });

    // Eliminar de Redis
    try {
      const redis = getRedisClient();
      await redis.del(`session:${sessionToken}`);
      if (session?.refreshToken) {
        await redis.del(`refresh:${session.refreshToken}`);
      }
    } catch (error) {
      console.error('Error deleting from Redis:', error);
    }

    // Eliminar de DB
    await prisma.session.deleteMany({
      where: { sessionToken }
    });
  }

  /**
   * Elimina una sesión por refresh token
   * @param {string} refreshToken - Refresh token
   */
  async deleteSessionByRefreshToken(refreshToken) {
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      select: { sessionToken: true }
    });

    if (session) {
      await this.deleteSession(session.sessionToken);
    }
  }

  /**
   * Elimina todas las sesiones de un usuario
   * @param {number} userId - ID del usuario
   */
  async deleteUserSessions(userId) {
    // Obtener todas las sesiones del usuario para limpiar Redis
    const sessions = await prisma.session.findMany({
      where: { userId },
      select: { sessionToken: true, refreshToken: true }
    });

    // Eliminar de Redis
    try {
      const redis = getRedisClient();
      const keys = [];
      sessions.forEach(s => {
        keys.push(`session:${s.sessionToken}`);
        if (s.refreshToken) {
          keys.push(`refresh:${s.refreshToken}`);
        }
      });
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
   * Obtiene todas las sesiones activas de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} Lista de sesiones
   */
  async getUserSessions(userId) {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        sessionToken: true,
        ipAddress: true,
        userAgent: true,
        lastActivityAt: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: {
        lastActivityAt: 'desc'
      }
    });

    return sessions;
  }

  /**
   * Limpia sesiones expiradas (ejecutar periódicamente)
   */
  async cleanupExpiredSessions() {
    // Obtener sesiones expiradas para limpiar Redis
    const expiredSessions = await prisma.session.findMany({
      where: {
        expiresAt: {
          lte: new Date()
        }
      },
      select: { sessionToken: true, refreshToken: true }
    });

    // Eliminar de Redis
    try {
      const redis = getRedisClient();
      const keys = [];
      expiredSessions.forEach(s => {
        keys.push(`session:${s.sessionToken}`);
        if (s.refreshToken) {
          keys.push(`refresh:${s.refreshToken}`);
        }
      });
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error('Error cleaning Redis:', error);
    }

    // Eliminar de DB
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
