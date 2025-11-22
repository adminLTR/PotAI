const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
 * Crear especie
 */
const createSpecies = async (speciesData) => {
  const { commonName, scientificName, waterRequirements, lightRequirements, humidityRequirements, moistureRequirements } = speciesData;
  
  if (!commonName || !scientificName) {
    throw new BadRequestError('Common name and scientific name are required');
  }
  
  const species = await prisma.species.create({
    data: {
      commonName,
      scientificName,
      waterRequirements,
      lightRequirements,
      humidityRequirements,
      moistureRequirements
    }
  });
  
  return species;
};

/**
 * Obtener todas las especies
 */
const getAllSpecies = async () => {
  const species = await prisma.species.findMany({
    orderBy: { commonName: 'asc' }
  });
  
  return species;
};

/**
 * Obtener especie por ID
 */
const getSpeciesById = async (speciesId) => {
  const species = await prisma.species.findUnique({
    where: { id: parseInt(speciesId) }
  });
  
  if (!species) {
    throw new NotFoundError('Species not found');
  }
  
  return species;
};

/**
 * Buscar especies por nombre
 */
const searchSpecies = async (query) => {
  if (!query) {
    return await getAllSpecies();
  }
  
  const species = await prisma.species.findMany({
    where: {
      OR: [
        { commonName: { contains: query, mode: 'insensitive' } },
        { scientificName: { contains: query, mode: 'insensitive' } }
      ]
    },
    orderBy: { commonName: 'asc' }
  });
  
  return species;
};

/**
 * Actualizar especie
 */
const updateSpecies = async (speciesId, updateData) => {
  const existing = await prisma.species.findUnique({
    where: { id: parseInt(speciesId) }
  });
  
  if (!existing) {
    throw new NotFoundError('Species not found');
  }
  
  const species = await prisma.species.update({
    where: { id: parseInt(speciesId) },
    data: {
      commonName: updateData.commonName,
      scientificName: updateData.scientificName,
      waterRequirements: updateData.waterRequirements,
      lightRequirements: updateData.lightRequirements,
      humidityRequirements: updateData.humidityRequirements,
      moistureRequirements: updateData.moistureRequirements
    }
  });
  
  return species;
};

/**
 * Eliminar especie
 */
const deleteSpecies = async (speciesId) => {
  const species = await prisma.species.findUnique({
    where: { id: parseInt(speciesId) }
  });
  
  if (!species) {
    throw new NotFoundError('Species not found');
  }
  
  await prisma.species.delete({
    where: { id: parseInt(speciesId) }
  });
  
  return { speciesId };
};

module.exports = {
  createSpecies,
  getAllSpecies,
  getSpeciesById,
  searchSpecies,
  updateSpecies,
  deleteSpecies,
  BadRequestError,
  NotFoundError
};
