const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const auth = require('../middlewares/auth');
const medicineController = require('../controllers/medicine.controller');

// Apply authentication middleware to all routes
router.use(auth);

// Create a new medicine reminder
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('reminderType').isIn(['specific_time', 'every_x_hours']).withMessage('Invalid reminder type'),
    body('specificTime').optional().isObject(),
    body('specificTime.time').if(body('reminderType').equals('specific_time')).notEmpty().withMessage('Time is required for specific time reminders'),
    body('specificTime.frequency').optional().isInt({ min: 1, max: 4 }),
    body('interval').optional().isObject(),
    body('interval.hours').if(body('reminderType').equals('every_x_hours')).isIn([4, 6, 8, 12]).withMessage('Interval must be 4, 6, 8, or 12 hours'),
    body('notes').optional().isString(),
  ],
  medicineController.createMedicineReminder
);

// Get all medicine reminders for the authenticated user
router.get(
  '/',
  [
    query('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  medicineController.getMedicineReminders
);

// Get a single medicine reminder by ID
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid medicine ID'),
  ],
  medicineController.getMedicineReminder
);

// Update a medicine reminder
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid medicine ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('reminderType').optional().isIn(['specific_time', 'every_x_hours']).withMessage('Invalid reminder type'),
    body('specificTime').optional().isObject(),
    body('specificTime.time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
    body('specificTime.frequency').optional().isInt({ min: 1, max: 4 }),
    body('interval').optional().isObject(),
    body('interval.hours').optional().isIn([4, 6, 8, 12]).withMessage('Interval must be 4, 6, 8, or 12 hours'),
    body('notes').optional().isString(),
    body('enabled').optional().isBoolean(),
  ],
  medicineController.updateMedicineReminder
);

// Delete a medicine reminder
router.delete(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid medicine ID'),
  ],
  medicineController.deleteMedicineReminder
);

// Toggle medicine reminder status
router.patch(
  '/:id/toggle',
  [
    param('id').isMongoId().withMessage('Invalid medicine ID'),
    body('enabled').isBoolean().withMessage('Enabled must be a boolean'),
  ],
  medicineController.toggleMedicineReminder
);

module.exports = router;