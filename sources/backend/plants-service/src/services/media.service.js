const axios = require('axios');
const FormData = require('form-data');

const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL || 'http://media-service:3005';

const uploadImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile.buffer, {
      filename: imageFile.originalname,
      contentType: imageFile.mimetype
    });
    
    const response = await axios.post(`${MEDIA_SERVICE_URL}/upload`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });
    
    return response.data.url;
  } catch (error) {
    console.error('Media service error:', error.message);
    throw new Error('Failed to upload image');
  }
};

module.exports = { uploadImage };
