const express = require('express');
const multer = require('multer');
const router = express.Router();

const plantsController = require('../controllers/plants.controller');

// Configurar multer para recibir imágenes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Health check
router.get('/health', plantsController.healthCheck);

// CRUD de plantas
router.post('/plants', upload.single('image'), plantsController.createPlant);
router.get('/plants', plantsController.getUserPlants);
router.get('/plants/:id', plantsController.getPlantById);
router.put('/plants/:id', plantsController.updatePlant);
router.delete('/plants/:id', plantsController.deletePlant);

// Plantas por macetero
router.get('/plants/pot/:potId', plantsController.getPlantsByPotId);

module.exports = router;
