const axios = require('axios');

const SPECIES_SERVICE_URL = process.env.SPECIES_SERVICE_URL || 'http://species-service:3006';

const findSpeciesByName = async (speciesName) => {
  try {
    const response = await axios.get(`${SPECIES_SERVICE_URL}/species/search`, {
      params: { q: speciesName },
      timeout: 5000
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0]; // Retorna la primera coincidencia
    }
    
    return null;
  } catch (error) {
    console.error('Species service error:', error.message);
    return null;
  }
};

const getSpeciesById = async (speciesId) => {
  try {
    const response = await axios.get(`${SPECIES_SERVICE_URL}/species/${speciesId}`, {
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    console.error('Species service error:', error.message);
    return null;
  }
};

module.exports = { findSpeciesByName, getSpeciesById };
