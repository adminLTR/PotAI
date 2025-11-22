const potsService = require('../services/pots.service');

/**
 * Crear maceta
 */
const createPot = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const { label } = req.body;
    
    const pot = await potsService.createPot(parseInt(userId), label);
    
    res.status(201).json(pot);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener todas las macetas del usuario
 */
const getAllPots = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const pots = await potsService.getAllPots(parseInt(userId));
    
    res.json(pots);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener maceta por ID
 */
const getPotById = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const potId = parseInt(req.params.id);
    
    const pot = await potsService.getPotById(potId, parseInt(userId));
    
    res.json(pot);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener o crear maceta
 */
const getOrCreatePot = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const { label } = req.body;
    
    const result = await potsService.getOrCreatePot(parseInt(userId), label);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar maceta
 */
const updatePot = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const potId = parseInt(req.params.id);
    const updateData = req.body;
    
    const pot = await potsService.updatePot(potId, parseInt(userId), updateData);
    
    res.json(pot);
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar maceta
 */
const deletePot = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const potId = parseInt(req.params.id);
    
    await potsService.deletePot(potId, parseInt(userId));
    
    res.json({ message: 'Pot deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Health check
 */
const healthCheck = (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'pots-service',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  createPot,
  getAllPots,
  getPotById,
  getOrCreatePot,
  updatePot,
  deletePot,
  healthCheck
};
