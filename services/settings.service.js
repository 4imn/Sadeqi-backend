const Settings = require('../models/settings.model');
const { ERRORS, SETTINGS } = require('../config/constants');
const { PRAYER_NAMES, TIME_SYSTEM, ALARM_TONES, FONT_SIZES, DEFAULTS } = SETTINGS;

/**
 * Get user settings or create default if not exists
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User settings
 */
const getUserSettings = async (userId) => {
  try {
    let settings = await Settings.findOne({ user: userId });
    
    if (!settings) {
      settings = await createDefaultSettings(userId);
    }
    
    return settings;
  } catch (error) {
    throw new Error(ERRORS.SETTINGS.FETCH_FAILED);
  }
};

/**
 * Update user settings
 * @param {string} userId - User ID
 * @param {Object} updates - Settings to update
 * @returns {Promise<Object>} Updated settings
 */
const updateUserSettings = async (userId, updates) => {
  try {
    const allowedUpdates = {
      prayerReminders: (val) => {
        if (typeof val !== 'object') return false;
        return Object.keys(val).every(key => 
          PRAYER_NAMES.ALL.includes(key) && 
          typeof val[key]?.enabled === 'boolean'
        );
      },
      timeSystem: (val) => TIME_SYSTEM.ALL.includes(val),
      reminderAfterPrayer: (val) => 
        DEFAULTS.REMINDER_AFTER_PRAYER_OPTIONS.includes(Number(val)),
      alarmTone: (val) => ALARM_TONES.ALL.includes(val),
      fontSize: (val) => FONT_SIZES.ALL.includes(val),
      language: (val) => DEFAULTS.SUPPORTED_LANGUAGES.includes(val),
      country: (val) => typeof val === 'string' && val.length === 2,
      notificationsEnabled: (val) => typeof val === 'boolean'
    };
    
    const updatesToApply = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (key in allowedUpdates && allowedUpdates[key](value)) {
        updatesToApply[key] = value;
      }
    }
    
    if (Object.keys(updatesToApply).length === 0) {
      throw new Error(ERRORS.VALIDATION.INVALID_INPUT);
    }
    
    const settings = await Settings.findOneAndUpdate(
      { user: userId },
      { $set: updatesToApply },
      { new: true, upsert: true, runValidators: true }
    );
    
    return settings;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new Error(ERRORS.VALIDATION.INVALID_INPUT);
    }
    throw error;
  }
};

/**
 * Update prayer reminder settings
 * @param {string} userId - User ID
 * @param {string} prayerName - Name of the prayer
 * @param {boolean} enabled - Whether the reminder is enabled
 * @returns {Promise<Object>} Updated settings
 */
const updatePrayerReminder = async (userId, prayerName, enabled) => {
  try {
    if (!PRAYER_NAMES.ALL.includes(prayerName)) {
      throw new Error(ERRORS.VALIDATION.INVALID_PRAYER_NAME);
    }
    
    const settings = await Settings.findOneAndUpdate(
      { user: userId },
      { $set: { [`prayerReminders.${prayerName}.enabled`]: enabled } },
      { new: true, upsert: true, runValidators: true }
    );
    
    return settings.prayerReminders;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new Error(ERRORS.VALIDATION.INVALID_INPUT);
    }
    throw error;
  }
};

/**
 * Create default settings for a new user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Default settings
 */
const createDefaultSettings = async (userId) => {
  const defaultPrayerReminders = PRAYER_NAMES.ALL.reduce((acc, prayer) => {
    acc[prayer] = { enabled: true };
    return acc;
  }, {});
  
  const defaultSettings = new Settings({
    user: userId,
    prayerReminders: defaultPrayerReminders,
    timeSystem: TIME_SYSTEM.DEFAULT,
    reminderAfterPrayer: DEFAULTS.REMINDER_AFTER_PRAYER,
    alarmTone: ALARM_TONES.DEFAULT_VALUE,
    fontSize: FONT_SIZES.DEFAULT,
    language: DEFAULTS.LANGUAGE,
    country: DEFAULTS.COUNTRY,
    notificationsEnabled: DEFAULTS.NOTIFICATIONS_ENABLED
  });
  
  return await defaultSettings.save();
};

/**
 * Delete user settings
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
const deleteUserSettings = async (userId) => {
  try {
    await Settings.deleteOne({ user: userId });
    return true;
  } catch (error) {
    throw new Error(ERRORS.SETTINGS.DELETE_FAILED);
  }
};

module.exports = {
  getUserSettings,
  updateUserSettings,
  updatePrayerReminder,
  createDefaultSettings,
  deleteUserSettings
};