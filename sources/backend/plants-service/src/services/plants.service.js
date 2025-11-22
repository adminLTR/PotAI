const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { 
  BadRequestError, 
  NotFoundError, 
  ConflictError 
} = require('../utils/errors');

const { uploadImage } = require('./media.service');
const { findSpeciesByName, getSpeciesById } = require('./species.service');
const { getOrCreatePot, getPotById } = require('./pots.service');
const { getEnvironmentalData, getWateringLogs } = require('./iot.service');

/**
 * Crear nueva planta con imagen y relaciones
 */
const createPlant = async (userId, plantData, imageFile, accessToken, sessionToken) => {
  const { name, potLabel, speciesName, plantedAt, notes } = plantData;
  
  if (!name) {
    throw new BadRequestError('Plant name is required');
  }
  
  if (!potLabel) {
    throw new BadRequestError('Pot label (ESP32 code) is required');
  }
  
  let imageUrl = null;
  let potId = null;
  let speciesId = null;
  let potData = null;
  let speciesData = null;
  
  // 1. Subir imagen si existe
  if (imageFile) {
    try {
      imageUrl = await uploadImage(imageFile);
    } catch (error) {
      console.error('Failed to upload image:', error.message);
      // Continuar sin imagen
    }
  }
  
  // 2. Obtener o crear macetero
  try {
    const potResult = await getOrCreatePot(userId, potLabel, accessToken, sessionToken);
    potData = potResult.pot;
    potId = potData.id;
  } catch (error) {
    throw new BadRequestError('Failed to associate pot');
  }
  
  // 3. Buscar especie si se proporcionó
  if (speciesName) {
    speciesData = await findSpeciesByName(speciesName);
    if (speciesData) {
      speciesId = speciesData.id;
    }
  }
  
  // 4. Crear planta
  const plant = await prisma.plant.create({
    data: {
      userId,
      potId,
      name,
      imageUrl,
      speciesId,
      plantedAt: plantedAt ? new Date(plantedAt) : null,
      notes
    }
  });
  
  return {
    plant,
    pot: potData,
    species: speciesData
  };
};

/**
 * Obtener todas las plantas del usuario
 */
const getPlantsByUser = async (userId, limit = 50, offset = 0, accessToken, sessionToken) => {
  const plants = await prisma.plant.findMany({
    where: { userId },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' }
  });
  
  const total = await prisma.plant.count({ where: { userId } });
  
  // Enriquecer con datos de pots y species
  const enrichedPlants = await Promise.all(
    plants.map(async (plant) => {
      const enriched = { ...plant };
      
      // Obtener datos del pot
      if (plant.potId) {
        const pot = await getPotById(plant.potId, accessToken, sessionToken);
        enriched.pot = pot ? { id: pot.id, label: pot.label } : null;
      }
      
      // Obtener datos de species
      if (plant.speciesId) {
        const species = await getSpeciesById(plant.speciesId);
        enriched.species = species;
      }
      
      return enriched;
    })
  );
  
  return {
    plants: enrichedPlants,
    total,
    limit,
    offset
  };
};

/**
 * Obtener planta por ID con todos sus datos
 */
const getPlantById = async (plantId, userId, accessToken, sessionToken) => {
  const plant = await prisma.plant.findFirst({
    where: { 
      id: plantId,
      userId 
    }
  });
  
  if (!plant) {
    throw new NotFoundError('Plant not found');
  }
  
  // Enriquecer con datos relacionados
  const enriched = { ...plant };
  
  // Datos del pot
  if (plant.potId) {
    const pot = await getPotById(plant.potId, accessToken, sessionToken);
    enriched.pot = pot;
  }
  
  // Datos de species con requerimientos
  if (plant.speciesId) {
    const species = await getSpeciesById(plant.speciesId);
    enriched.species = species;
  }
  
  // Condiciones ambientales del IoT Service
  const environmentalConditions = await getEnvironmentalData(plantId, 10);
  enriched.environmentalConditions = environmentalConditions;
  
  // Historial de riego del IoT Service
  const wateringLogs = await getWateringLogs(plantId, 10);
  enriched.wateringLogs = wateringLogs;
  
  return enriched;
};

/**
 * Actualizar planta
 */
const updatePlant = async (plantId, userId, updateData) => {
  // Verificar que la planta existe y pertenece al usuario
  const existingPlant = await prisma.plant.findFirst({
    where: { 
      id: plantId,
      userId 
    }
  });
  
  if (!existingPlant) {
    throw new NotFoundError('Plant not found');
  }
  
  const plant = await prisma.plant.update({
    where: { id: plantId },
    data: {
      name: updateData.name,
      notes: updateData.notes,
      plantedAt: updateData.plantedAt ? new Date(updateData.plantedAt) : undefined
    }
  });
  
  return plant;
};

/**
 * Eliminar planta
 */
const deletePlant = async (plantId, userId) => {
  const plant = await prisma.plant.findFirst({
    where: { 
      id: plantId,
      userId 
    }
  });
  
  if (!plant) {
    throw new NotFoundError('Plant not found');
  }
  
  await prisma.plant.delete({
    where: { id: plantId }
  });
  
  return { plantId };
};

/**
 * Obtener plantas por potId
 */
const getPlantsByPotId = async (potId, userId, accessToken, sessionToken) => {
  const plants = await prisma.plant.findMany({
    where: { 
      potId,
      userId 
    }
  });
  
  const pot = await getPotById(potId, accessToken, sessionToken);
  
  return {
    plants,
    pot,
    total: plants.length
  };
};

/**
 * Actualizar datos de sensores desde IoT Service
 */
const updateSensorData = async (plantId, sensorData) => {
  const { temperature, soilMoisture, lightLevel } = sensorData;
  
  const plant = await prisma.plant.update({
    where: { id: plantId },
    data: {
      temperature,
      soilMoisture,
      lightLevel,
      lastSensorUpdate: new Date(),
      isConnected: true,
      lastConnectionAt: new Date()
    }
  });
  
  return plant;
};

module.exports = {
  createPlant,
  getPlantsByUser,
  getPlantById,
  updatePlant,
  deletePlant,
  getPlantsByPotId,
  updateSensorData
};
