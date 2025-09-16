const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { PRAYER_NAMES } = require('../config/constants');
const auth = require('../middlewares/auth');

// Input validation middleware
const validatePrayerReminder = (req, res, next) => {
  const { enabled, prayerName } = req.body;
  
  // Validate prayer name
  if (!SETTINGS.PRAYER_NAMES.ALL.includes(prayerName)) {
    return res.status(400).json({
      success: false,
      error: `Invalid prayer name. Must be one of: ${PRAYER_NAMES.ALL.join(', ')}`
    });
  }
  
  // Validate enabled flag
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'Enabled must be a boolean value'
    });
  }
  
  next();
};

// All routes are protected and require authentication
router.use(auth);

// GET /api/settings - Get user settings
router.get('/', settingsController.getSettings);

// PUT /api/settings - Update user settings
router.put('/', settingsController.updateSettings);

// PATCH /api/settings/prayer-reminder - Update prayer reminder
router.patch('/prayer-reminder', validatePrayerReminder, settingsController.togglePrayerReminder);

// DELETE /api/settings/reset - Reset settings to default
router.delete('/', settingsController.resetSettings)

module.exports = router;