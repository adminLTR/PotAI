const axios = require('axios');

const IOT_SERVICE_URL = process.env.IOT_SERVICE_URL || 'http://iot-service:3004';

const getEnvironmentalData = async (plantId, limit = 10) => {
  try {
    const response = await axios.get(`${IOT_SERVICE_URL}/iot/plants/${plantId}/conditions`, {
      params: { limit },
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    console.error('IoT service error:', error.message);
    return [];
  }
};

const getWateringLogs = async (plantId, limit = 10) => {
  try {
    const response = await axios.get(`${IOT_SERVICE_URL}/iot/plants/${plantId}/watering-logs`, {
      params: { limit },
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    console.error('IoT service error:', error.message);
    return [];
  }
};

module.exports = { getEnvironmentalData, getWateringLogs };
