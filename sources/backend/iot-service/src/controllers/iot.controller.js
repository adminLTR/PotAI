const iotService = require('../services/iot.service');

/**
 * Recibir datos de sensores desde ESP32
 * Endpoint público (no requiere autenticación)
 */
const receiveSensorData = async (req, res, next) => {
  try {
    const { plantId, temperature, humidity, moisture, light } = req.body;
    
    if (!plantId) {
      return res.status(400).json({ error: 'Plant ID is required' });
    }
    
    const result = await iotService.createSensorData(plantId, {
      temperature,
      humidity,
      moisture,
      light
    });
    
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener condiciones ambientales de una planta
 */
const getPlantConditions = async (req, res, next) => {
  try {
    const plantId = parseInt(req.params.plantId);
    const limit = parseInt(req.query.limit) || 100;
    
    const conditions = await iotService.getPlantConditions(plantId, limit);
    
    res.json(conditions);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener historial de riego de una planta
 */
const getPlantWateringLogs = async (req, res, next) => {
  try {
    const plantId = parseInt(req.params.plantId);
    const limit = parseInt(req.query.limit) || 100;
    
    const logs = await iotService.getPlantWateringLogs(plantId, limit);
    
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar riego manual
 */
const createManualWatering = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    const { ambientalConditionsId, amountMl } = req.body;
    
    const wateringLog = await iotService.createManualWatering(
      ambientalConditionsId,
      amountMl
    );
    
    res.status(201).json(wateringLog);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener última condición de una planta
 */
const getLatestCondition = async (req, res, next) => {
  try {
    const plantId = parseInt(req.params.plantId);
    
    const condition = await iotService.getLatestCondition(plantId);
    
    if (!condition) {
      return res.status(404).json({ error: 'No conditions found for this plant' });
    }
    
    res.json(condition);
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
    service: 'iot-service',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  receiveSensorData,
  getPlantConditions,
  getPlantWateringLogs,
  createManualWatering,
  getLatestCondition,
  healthCheck
};
