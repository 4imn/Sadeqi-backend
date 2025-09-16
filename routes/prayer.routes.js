const express = require('express');
const { query } = require('express-validator');
const prayerController = require('../controllers/prayer.controller');

const router = express.Router();

/**
 * @route   GET /api/prayer/countries
 * @desc    Get list of all countries with names and codes
 * @access  Public
 */
router.get('/countries', prayerController.getCountries);

/**
 * @route   GET /api/prayer/times
 * @desc    Get prayer times for a specific country and date
 * @access  Public
 */
router.get(
  '/times',
  [
    query('country').trim().notEmpty().withMessage('Country is required'),
    query('date')
      .optional()
      .isISO8601()
      .withMessage('Date must be a valid ISO date (YYYY-MM-DD)')
  ],
  prayerController.getPrayerTimes
);

module.exports = router;