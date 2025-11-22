const express = require('express');
const router = express.Router();

const speciesController = require('../controllers/species.controller');

// Health check
router.get('/health', speciesController.healthCheck);

// CRUD de especies
router.post('/species', speciesController.createSpecies);
router.get('/species', speciesController.getAllSpecies);
router.get('/species/search', speciesController.searchSpecies);
router.get('/species/:id', speciesController.getSpeciesById);
router.put('/species/:id', speciesController.updateSpecies);
router.delete('/species/:id', speciesController.deleteSpecies);

module.exports = router;
