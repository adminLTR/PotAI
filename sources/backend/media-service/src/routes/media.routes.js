const express = require('express');
const { upload } = require('../config/multer.config');
const mediaController = require('../controllers/media.controller');

const router = express.Router();

// Upload routes
router.post('/upload', upload.array('files', 10), mediaController.uploadFiles.bind(mediaController));
router.post('/upload/single', upload.single('file'), mediaController.uploadSingleFile.bind(mediaController));

// File management routes
router.get('/files', mediaController.listFiles.bind(mediaController));
router.get('/files/:filename', mediaController.getFile.bind(mediaController));
router.get('/info/:filename', mediaController.getFileInfo.bind(mediaController));
router.delete('/files/:filename', mediaController.deleteFile.bind(mediaController));

// Health check
router.get('/health', mediaController.healthCheck.bind(mediaController));

module.exports = router;
