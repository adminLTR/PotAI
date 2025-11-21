const crypto = require('crypto');

/**
 * Genera un token aleatorio seguro
 * @param {number} length - Longitud del token en bytes (default: 32)
 * @returns {string} Token hexadecimal
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Genera un UUID v4
 * @returns {string} UUID
 */
const generateUUID = () => {
  return crypto.randomUUID();
};

module.exports = {
  generateSecureToken,
  generateUUID
};
