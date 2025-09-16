const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const auth = require('../middlewares/auth');

// Public routes
router.post('/register', deviceController.registerDevice);
router.post('/verify', deviceController.verifyDevice);

// Protected routes (require authentication)
router.use(auth);
router.get('/me', deviceController.getDeviceInfo);
router.put('/token', deviceController.updateDeviceToken);
router.put('/me/status', deviceController.updateDeviceStatus);
router.put('/me/settings', deviceController.updateDeviceSettings);

module.exports = router;
