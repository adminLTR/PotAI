const plantsService = require('../services/plants.service');

/**
 * Crear planta (con imagen multipart/form-data)
 */
const createPlant = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const plantData = {
      name: req.body.name,
      potLabel: req.body.potLabel,
      speciesId: req.body.speciesId ? parseInt(req.body.speciesId) : null,
      plantedAt: req.body.plantedAt,
      notes: req.body.notes
    };
    
    const imageFile = req.file;
    const accessToken = req.headers.authorization?.split(' ')[1];
    const sessionToken = req.headers['x-session-token'];
    
    const result = await plantsService.createPlant(
      parseInt(userId),
      plantData,
      imageFile,
      accessToken,
      sessionToken
    );
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener todas las plantas del usuario
 */
const getUserPlants = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const accessToken = req.headers.authorization?.split(' ')[1];
    const sessionToken = req.headers['x-session-token'];
    
    const result = await plantsService.getPlantsByUser(
      parseInt(userId),
      limit,
      offset,
      accessToken,
      sessionToken
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener planta por ID
 */
const getPlantById = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const plantId = parseInt(req.params.id);
    const accessToken = req.headers.authorization?.split(' ')[1];
    const sessionToken = req.headers['x-session-token'];
    
    const plant = await plantsService.getPlantById(
      plantId,
      parseInt(userId),
      accessToken,
      sessionToken
    );
    
    res.json({ plant });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar planta
 */
const updatePlant = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const plantId = parseInt(req.params.id);
    const updateData = req.body;
    
    const plant = await plantsService.updatePlant(
      plantId,
      parseInt(userId),
      updateData
    );
    
    res.json({ plant });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar planta
 */
const deletePlant = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const plantId = parseInt(req.params.id);
    
    const result = await plantsService.deletePlant(plantId, parseInt(userId));
    
    res.json({ 
      message: 'Plant deleted successfully',
      plantId: result.plantId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener plantas por potId
 */
const getPlantsByPotId = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const potId = parseInt(req.params.potId);
    const accessToken = req.headers.authorization?.split(' ')[1];
    const sessionToken = req.headers['x-session-token'];
    
    const result = await plantsService.getPlantsByPotId(
      potId,
      parseInt(userId),
      accessToken,
      sessionToken
    );
    
    res.json(result);
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
    service: 'plants-service',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  createPlant,
  getUserPlants,
  getPlantById,
  updatePlant,
  deletePlant,
  getPlantsByPotId,
  healthCheck
};
