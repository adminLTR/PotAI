const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateRegister, validateLogin } = require('../middleware/validation.middleware');

const router = express.Router();

// Rutas públicas (sin prefijo /auth porque el gateway ya lo añade)
router.post('/auth/register', validateRegister, authController.register.bind(authController));
router.post('/auth/login', validateLogin, authController.login.bind(authController));
router.post('/auth/refresh', authController.refreshToken.bind(authController));
router.get('/auth/validate', authController.validate.bind(authController));
router.get('/auth/health', authController.healthCheck.bind(authController));

// Rutas protegidas (requieren autenticación)
router.post('/auth/logout', authenticate, authController.logout.bind(authController));
router.post('/auth/logout-all', authenticate, authController.logoutAll.bind(authController));
router.get('/auth/me', authenticate, authController.getCurrentUser.bind(authController));
router.put('/auth/change-password', authenticate, authController.changePassword.bind(authController));
router.get('/auth/sessions', authenticate, authController.getSessions.bind(authController));
router.delete('/auth/sessions/:sessionToken', authenticate, authController.revokeSession.bind(authController));

module.exports = router;
