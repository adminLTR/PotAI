const express = require('express');
const router = express.Router();

const potsController = require('../controllers/pots.controller');

// Health check
router.get('/health', potsController.healthCheck);

// CRUD de macetas
router.post('/pots', potsController.createPot);
router.get('/pots', potsController.getAllPots);
router.get('/pots/:id', potsController.getPotById);
router.post('/pots/get-or-create', potsController.getOrCreatePot);
router.put('/pots/:id', potsController.updatePot);
router.delete('/pots/:id', potsController.deletePot);

module.exports = router;
