const speciesService = require('../services/species.service');

/**
 * Crear especie
 */
const createSpecies = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    // Solo admin puede crear especies (simplificado por ahora)
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const species = await speciesService.createSpecies(req.body);
    
    res.status(201).json(species);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener todas las especies (público)
 */
const getAllSpecies = async (req, res, next) => {
  try {
    const species = await speciesService.getAllSpecies();
    
    res.json(species);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener especie por ID (público)
 */
const getSpeciesById = async (req, res, next) => {
  try {
    const speciesId = parseInt(req.params.id);
    
    const species = await speciesService.getSpeciesById(speciesId);
    
    res.json(species);
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar especies (público)
 */
const searchSpecies = async (req, res, next) => {
  try {
    const query = req.query.q;
    
    const species = await speciesService.searchSpecies(query);
    
    res.json(species);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar especie
 */
const updateSpecies = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const speciesId = parseInt(req.params.id);
    
    const species = await speciesService.updateSpecies(speciesId, req.body);
    
    res.json(species);
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar especie
 */
const deleteSpecies = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const speciesId = parseInt(req.params.id);
    
    await speciesService.deleteSpecies(speciesId);
    
    res.json({ message: 'Species deleted successfully' });
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
    service: 'species-service',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  createSpecies,
  getAllSpecies,
  getSpeciesById,
  searchSpecies,
  updateSpecies,
  deleteSpecies,
  healthCheck
};
