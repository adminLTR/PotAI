const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

/**
 * Genera un JWT token
 * @param {Object} payload - Datos a incluir en el token
 * @returns {string} Token JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256'
  });
};

/**
 * Verifica y decodifica un JWT token
 * @param {string} token - Token a verificar
 * @returns {Object} Payload decodificado
 * @throws {Error} Si el token es inválido o ha expirado
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Decodifica un token sin verificar (útil para debugging)
 * @param {string} token - Token a decodificar
 * @returns {Object} Payload decodificado
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Calcula la fecha de expiración basada en el JWT_EXPIRES_IN
 * @returns {Date} Fecha de expiración
 */
const getExpirationDate = () => {
  const expiresIn = JWT_EXPIRES_IN;
  const now = new Date();
  
  // Parse time string (e.g., "2h", "30m", "7d")
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    // Default to 2 hours if format is invalid
    return new Date(now.getTime() + 2 * 60 * 60 * 1000);
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers = {
    s: 1000,           // seconds
    m: 60 * 1000,      // minutes
    h: 60 * 60 * 1000, // hours
    d: 24 * 60 * 60 * 1000 // days
  };
  
  return new Date(now.getTime() + value * multipliers[unit]);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  getExpirationDate
};
