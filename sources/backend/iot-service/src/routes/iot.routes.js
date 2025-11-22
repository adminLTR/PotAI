const express = require('express');
const router = express.Router();

const iotController = require('../controllers/iot.controller');

// Health check
router.get('/health', iotController.healthCheck);

// Recibir datos de sensores (ESP32 - público)
router.post('/iot/sensor-data', iotController.receiveSensorData);

// Obtener condiciones ambientales
router.get('/iot/plants/:plantId/conditions', iotController.getPlantConditions);

// Obtener última condición
router.get('/iot/plants/:plantId/latest', iotController.getLatestCondition);

// Obtener historial de riego
router.get('/iot/plants/:plantId/watering-logs', iotController.getPlantWateringLogs);

// Registrar riego manual (requiere auth)
router.post('/iot/watering', iotController.createManualWatering);

module.exports = router;
