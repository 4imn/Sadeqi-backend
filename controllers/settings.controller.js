const settingsService = require('../services/settings.service');
const { STATUS_CODES, ERRORS } = require('../config/constants');

/**
 * @desc    Get user settings
 * @route   GET /api/settings
 * @access  Private
 */
const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getUserSettings(req.user.id);
    res.status(STATUS_CODES.OK).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next({
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: ERRORS.SETTINGS.FETCH_FAILED,
      error: error.message
    });
  }
};

/**
 * @desc    Update user settings
 * @route   PUT /api/settings
 * @access  Private
 */
const updateSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.updateUserSettings(
      req.user.id,
      req.body
    );
    
    res.status(STATUS_CODES.OK).json({
      success: true,
      data: settings
    });
  } catch (error) {
    const status = error.message === ERRORS.VALIDATION.INVALID_INPUT 
      ? STATUS_CODES.BAD_REQUEST 
      : STATUS_CODES.INTERNAL_SERVER_ERROR;
      
    next({
      status,
      message: error.message,
      error: error.message
    });
  }
};

/**
 * @desc    Toggle prayer reminder
 * @route   PATCH /api/settings/prayer-reminder
 * @access  Private
 */
const togglePrayerReminder = async (req, res, next) => {
  try {
    const { enabled, prayerName } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        error: ERRORS.VALIDATION.INVALID_INPUT
      });
    }
    
    const settings = await settingsService.updatePrayerReminder(
      req.user.id,
      prayerName,
      enabled
    );
    
    res.status(STATUS_CODES.OK).json({
      success: true,
      data: settings
    });
  } catch (error) {
    const status = error.message === ERRORS.VALIDATION.INVALID_PRAYER_NAME || 
                 error.message === ERRORS.VALIDATION.INVALID_INPUT
      ? STATUS_CODES.BAD_REQUEST 
      : STATUS_CODES.INTERNAL_SERVER_ERROR;
      
    next({
      status,
      message: error.message,
      error: error.message
    });
  }
};

/**
 * @desc    Reset settings to default
 * @route   DELETE /api/settings/reset
 * @access  Private
 */
const resetSettings = async (req, res, next) => {
  try {
    await settingsService.deleteUserSettings(req.user.id);
    const settings = await settingsService.getUserSettings(req.user.id);
    
    res.status(STATUS_CODES.OK).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next({
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: ERRORS.SETTINGS.RESET_FAILED,
      error: error.message
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  togglePrayerReminder,
  resetSettings
};