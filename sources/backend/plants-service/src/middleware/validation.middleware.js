/**
 * Middleware para validar la creación de una planta
 */
const validateCreatePlant = (req, res, next) => {
  const { potCode, name } = req.body;
  const errors = [];

  if (!potCode || typeof potCode !== 'string' || potCode.trim() === '') {
    errors.push('potCode is required and must be a non-empty string');
  }

  if (potCode && potCode.length > 50) {
    errors.push('potCode must be 50 characters or less');
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (name && name.length > 100) {
    errors.push('name must be 100 characters or less');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

/**
 * Middleware para validar la actualización de una planta
 */
const validateUpdatePlant = (req, res, next) => {
  const { name, potCode, notes, imageUrl } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      errors.push('name must be a non-empty string');
    }
    if (name.length > 100) {
      errors.push('name must be 100 characters or less');
    }
  }

  if (potCode !== undefined) {
    if (typeof potCode !== 'string' || potCode.trim() === '') {
      errors.push('potCode must be a non-empty string');
    }
    if (potCode.length > 50) {
      errors.push('potCode must be 50 characters or less');
    }
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.push('notes must be a string');
    }
  }

  if (imageUrl !== undefined && imageUrl !== null) {
    if (typeof imageUrl !== 'string') {
      errors.push('imageUrl must be a string');
    }
    if (imageUrl.length > 255) {
      errors.push('imageUrl must be 255 characters or less');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

/**
 * Middleware para validar datos de sensores del ESP32
 */
const validateSensorData = (req, res, next) => {
  const { temperatura, humedad } = req.body;
  const errors = [];

  if (temperatura === undefined || temperatura === null) {
    errors.push('temperatura is required');
  } else {
    const temp = parseFloat(temperatura);
    if (isNaN(temp)) {
      errors.push('temperatura must be a valid number');
    } else if (temp < -50 || temp > 100) {
      errors.push('temperatura must be between -50 and 100 degrees Celsius');
    }
  }

  if (humedad === undefined || humedad === null) {
    errors.push('humedad is required');
  } else {
    const hum = parseFloat(humedad);
    if (isNaN(hum)) {
      errors.push('humedad must be a valid number');
    } else if (hum < 0 || hum > 100) {
      errors.push('humedad must be between 0 and 100 percent');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

/**
 * Middleware para validar parámetros numéricos
 */
const validateNumericParam = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];
    const numValue = parseInt(value);

    if (isNaN(numValue) || numValue < 1) {
      return res.status(400).json({
        error: `${paramName} must be a valid positive integer`
      });
    }

    req.params[paramName] = numValue;
    next();
  };
};

module.exports = {
  validateCreatePlant,
  validateUpdatePlant,
  validateSensorData,
  validateNumericParam
};
