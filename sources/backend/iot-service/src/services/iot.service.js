const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:5000';

class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BadRequestError';
    this.statusCode = 400;
    this.isOperational = true;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.isOperational = true;
  }
}

/**
 * Registrar datos de sensores desde ESP32
 */
const createSensorData = async (plantId, sensorData) => {
  const { temperature, humidity, moisture, light } = sensorData;
  
  if (!plantId) {
    throw new BadRequestError('Plant ID is required');
  }
  
  // Crear registro de condiciones ambientales
  const condition = await prisma.ambientalCondition.create({
    data: {
      plantId: parseInt(plantId),
      temperatureCelsius: temperature || null,
      humidityPercent: humidity || null,
      moisturePercent: moisture || null,
      light: light || null
    }
  });
  
  // Decidir si necesita riego (llamar ML Service en el futuro)
  let wateringDecision = {
    needsWatering: false,
    amountMl: 0
  };
  
  // TODO: Integrar con ML Service
  // Por ahora, lógica simple: si moisture < 30%, regar 200ml
  if (moisture && moisture < 30) {
    wateringDecision = {
      needsWatering: true,
      amountMl: 200
    };
    
    // Registrar riego
    await prisma.wateringLog.create({
      data: {
        ambientalConditionsId: condition.id,
        amountMl: 200
      }
    });
  }
  
  return {
    ...condition,
    wateringDecision
  };
};

/**
 * Obtener condiciones ambientales de una planta
 */
const getPlantConditions = async (plantId, limit = 100) => {
  const conditions = await prisma.ambientalCondition.findMany({
    where: { plantId: parseInt(plantId) },
    orderBy: { recordedAt: 'desc' },
    take: limit,
    include: {
      wateringLogs: true
    }
  });
  
  return conditions;
};

/**
 * Obtener historial de riego de una planta
 */
const getPlantWateringLogs = async (plantId, limit = 100) => {
  const logs = await prisma.wateringLog.findMany({
    where: {
      ambientalCondition: {
        plantId: parseInt(plantId)
      }
    },
    orderBy: { wateredAt: 'desc' },
    take: limit,
    include: {
      ambientalCondition: {
        select: {
          temperatureCelsius: true,
          humidityPercent: true,
          moisturePercent: true,
          recordedAt: true
        }
      }
    }
  });
  
  return logs;
};

/**
 * Registrar riego manual
 */
const createManualWatering = async (ambientalConditionsId, amountMl) => {
  if (!ambientalConditionsId) {
    throw new BadRequestError('Ambiental conditions ID is required');
  }
  
  if (!amountMl || amountMl <= 0) {
    throw new BadRequestError('Valid amount in ml is required');
  }
  
  // Verificar que existe la condición ambiental
  const condition = await prisma.ambientalCondition.findUnique({
    where: { id: parseInt(ambientalConditionsId) }
  });
  
  if (!condition) {
    throw new NotFoundError('Ambiental condition not found');
  }
  
  const wateringLog = await prisma.wateringLog.create({
    data: {
      ambientalConditionsId: parseInt(ambientalConditionsId),
      amountMl: parseInt(amountMl)
    }
  });
  
  return wateringLog;
};

/**
 * Obtener últimas condiciones de una planta
 */
const getLatestCondition = async (plantId) => {
  const condition = await prisma.ambientalCondition.findFirst({
    where: { plantId: parseInt(plantId) },
    orderBy: { recordedAt: 'desc' },
    include: {
      wateringLogs: {
        orderBy: { wateredAt: 'desc' },
        take: 1
      }
    }
  });
  
  return condition;
};

module.exports = {
  createSensorData,
  getPlantConditions,
  getPlantWateringLogs,
  createManualWatering,
  getLatestCondition,
  BadRequestError,
  NotFoundError
};
