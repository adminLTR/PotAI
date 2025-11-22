const axios = require('axios');

const POTS_SERVICE_URL = process.env.POTS_SERVICE_URL || 'http://pots-service:3003';

const getOrCreatePot = async (userId, potLabel, accessToken, sessionToken) => {
  try {
    const response = await axios.post(
      `${POTS_SERVICE_URL}/pots/get-or-create`,
      { label: potLabel },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Session-Token': sessionToken,
          'X-User-Id': userId
        },
        timeout: 5000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Pots service error:', error.message);
    throw new Error('Failed to create/get pot');
  }
};

const getPotById = async (potId, accessToken, sessionToken) => {
  try {
    const response = await axios.get(`${POTS_SERVICE_URL}/pots/${potId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Session-Token': sessionToken
      },
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    console.error('Pots service error:', error.message);
    return null;
  }
};

module.exports = { getOrCreatePot, getPotById };
