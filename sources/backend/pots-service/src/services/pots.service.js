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

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.isOperational = true;
  }
}

/**
 * Crear maceta
 */
const createPot = async (userId, label) => {
  const pot = await prisma.pot.create({
    data: {
      userId,
      label: label || null
    }
  });
  
  return pot;
};

/**
 * Obtener todas las macetas del usuario
 */
const getAllPots = async (userId) => {
  const pots = await prisma.pot.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  
  return pots;
};

/**
 * Obtener maceta por ID
 */
const getPotById = async (potId, userId) => {
  const pot = await prisma.pot.findFirst({
    where: { 
      id: potId,
      userId 
    }
  });
  
  if (!pot) {
    throw new NotFoundError('Pot not found');
  }
  
  return pot;
};

/**
 * Obtener o crear maceta por label
 */
const getOrCreatePot = async (userId, label) => {
  if (!label) {
    throw new BadRequestError('Label is required');
  }
  
  // Buscar maceta existente
  let pot = await prisma.pot.findFirst({
    where: { 
      userId,
      label 
    }
  });
  
  let created = false;
  
  // Si no existe, crear
  if (!pot) {
    pot = await prisma.pot.create({
      data: {
        userId,
        label
      }
    });
    created = true;
  }
  
  return { pot, created };
};

/**
 * Actualizar maceta
 */
const updatePot = async (potId, userId, updateData) => {
  // Verificar que existe y pertenece al usuario
  const existingPot = await prisma.pot.findFirst({
    where: { 
      id: potId,
      userId 
    }
  });
  
  if (!existingPot) {
    throw new NotFoundError('Pot not found');
  }
  
  const pot = await prisma.pot.update({
    where: { id: potId },
    data: {
      label: updateData.label
    }
  });
  
  return pot;
};

/**
 * Eliminar maceta
 */
const deletePot = async (potId, userId) => {
  const pot = await prisma.pot.findFirst({
    where: { 
      id: potId,
      userId 
    }
  });
  
  if (!pot) {
    throw new NotFoundError('Pot not found');
  }
  
  await prisma.pot.delete({
    where: { id: potId }
  });
  
  return { potId };
};

module.exports = {
  createPot,
  getAllPots,
  getPotById,
  getOrCreatePot,
  updatePot,
  deletePot,
  BadRequestError,
  NotFoundError,
  ConflictError
};
