const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

const validateToken = async (accessToken, sessionToken) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Session-Token': sessionToken
      },
      timeout: 5000
    });
    
    if (!response.data.valid) {
      throw new Error('Invalid token');
    }
    
    return response.data.user;
  } catch (error) {
    throw new Error('Authentication failed');
  }
};

module.exports = { validateToken };
