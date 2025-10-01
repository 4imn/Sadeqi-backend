const Device = require('../models/device.model');
const { sendMulticastNotification } = require('./push-notification.service');
const logger = require('../utils/logger');

/**
 * Send prayer time notification to devices in a specific country
 * @param {Object} prayerInfo - Prayer time information
 * @param {string} prayerInfo.countryCode - Country code (e.g., 'SA', 'AE')
 * @param {string} prayerInfo.date - Date in YYYY-MM-DD format
 * @param {string} prayerInfo.prayerName - Name of the prayer (e.g., 'FAJR', 'DHUHR')
 * @param {string} prayerInfo.formattedTime - Formatted time string
 * @returns {Promise<void>}
 */
const sendPrayerTimeNotification = async (prayerInfo) => {
  try {
    const { countryCode, prayerName, formattedTime } = prayerInfo;
    
    // Get active devices for the specific country
    const devices = await Device.findActiveByCountry(countryCode);
    
    if (!devices || devices.length === 0) {
      logger.info(`No active devices found for country: ${countryCode}`);
      return;
    }

    // Prepare notification data
    const title = `It's time for ${prayerName} prayer`;
    const body = `The ${prayerName} prayer time is ${formattedTime}`;
    const data = {
      type: 'PRAYER_TIME',
      prayerName,
      time: formattedTime,
      countryCode,
      timestamp: Date.now()
    };

    // Extract valid tokens
    const tokens = devices
      .map(device => device.fcmtoken)
      .filter(token => token && token.trim() !== '');
    
    if (tokens.length === 0) {
      logger.warn(`No valid FCM tokens found for country: ${countryCode}`);
      return;
    }

    // Send multicast notification to all devices in the country
    await sendMulticastNotification({
      tokens,
      title,
      body,
      data
    });

    logger.info(`Sent ${prayerName} prayer time notifications to ${tokens.length} devices in ${countryCode}`);
  } catch (error) {
    logger.error(`Error sending prayer time notifications for ${prayerInfo.countryCode}:`, error);
    throw error;
  }
};

/**
 * Process prayer times and send notifications to specific countries
 * @param {Array} prayers - Array of prayer time objects
 * @returns {Promise<void>}
 */
const processPrayerTimes = async (prayers) => {
  if (!prayers || prayers.length === 0) {
    return;
  }

  // Process each prayer time notification
  for (const prayer of prayers) {
    try {
      await sendPrayerTimeNotification(prayer);
    } catch (error) {
      logger.error(`Error processing prayer time for ${prayer.countryCode}:`, error);
    }
  }
};

module.exports = {
  sendPrayerTimeNotification,
  processPrayerTimes
};