const prayerService = require('../services/prayer.service');
const Country = require('../models/country.model');

/**
 * @desc    Get list of all countries with names and codes
 * @route   GET /api/prayer/countries
 * @access  Public
 */
const getCountries = async (req, res, next) => {
  try {
    const countries = await Country.find({}, '_id code name').sort({ 'name.en': 1 });
    
    res.status(200).json({
      success: true,
      count: countries.length,
      data: countries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get prayer times for a specific country and date
 * @route   GET /api/prayer/times
 * @access  Public
 */
const getPrayerTimes = async (req, res, next) => {
  try {
    const { country, date } = req.query;
    
    // Get prayer times (if date is not provided, it defaults to today)
    const prayerTimes = await prayerService.getPrayerTimes(
      country,
      date ? new Date(date) : new Date()
    );

    res.status(200).json({
      success: true,
      data: {
        country: prayerTimes.country,
        date: prayerTimes.date,
        times: prayerTimes.times,
        calculationMethod: prayerTimes.calculationMethod
      }
    });
  } catch (error) {
    console.error('Error in getPrayerTimes controller:', error);
    next(error);
  }
};

module.exports = {
  getPrayerTimes,
  getCountries
};