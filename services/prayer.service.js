const { PrayerTimes } = require('adhan');
const moment = require('moment-timezone');
const { Coordinates, CalculationMethod } = require('adhan');
const Country = require('../models/country.model');
const redisClient = require('../config/redis');
const { processPrayerTimes } = require('./notification.service');

// Cache keys
const PRAYER_TIMES_SORTED_SET = 'prayer:times:sorted';
const PRAYER_DETAILS_HASH = 'prayer:details';

/**
 * Convert prayer time to timestamp (in seconds)
 */
const getPrayerTimestamp = (date, timeStr) => {
  try {
    // Parse the time string (format: HH:mm)
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create a new date object with the same date but the prayer time
    const prayerDate = new Date(date);
    prayerDate.setHours(hours, minutes, 0, 0);
    
    // Convert to timestamp in seconds
    return Math.floor(prayerDate.getTime() / 1000);
  } catch (error) {
    console.error('Error parsing prayer time:', { timeStr, error });
    throw new Error(`Invalid time format: ${timeStr}. Expected HH:mm`);
  }
};

/**
 * Cache prayer times for a country
 */
const cacheCountryPrayerTimes = async (countryCode, date, prayerTimes) => {
  const dateStr = date.toISOString().split('T')[0];
  const countryKey = `${countryCode}:${dateStr}`;
  
  // Store prayer times in a hash
  const prayerData = {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha
  };

  // Store in Redis
  const pipeline = redisClient.pipeline();
  
  // Store prayer details in hash
  pipeline.hset(PRAYER_DETAILS_HASH, countryKey, JSON.stringify(prayerData));
  
  // Add each prayer time to sorted set with score = timestamp
  Object.entries(prayerData).forEach(([prayerName, timeStr]) => {
    const timestamp = getPrayerTimestamp(date, timeStr);
    const member = `${countryKey}:${prayerName}`;
    pipeline.zadd(PRAYER_TIMES_SORTED_SET, timestamp, member);
  });
  
  // Set TTL for 48 hours to handle timezone differences
  pipeline.expire(countryKey, 48 * 60 * 60);
  
  await pipeline.exec();
};

/**
 * Get prayer times for a country and date
 */
const getPrayerTimes = async (countryCode, date = new Date()) => {
  const dateStr = date.toISOString().split('T')[0];
  const countryKey = `${countryCode}:${dateStr}`;
  
  // Try to get from cache
  const cachedData = await redisClient.hget(PRAYER_DETAILS_HASH, countryKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  
  // If not in cache, calculate and cache
  const prayerTimes = await calculatePrayerTimes(countryCode, date);
  await cacheCountryPrayerTimes(countryCode, date, prayerTimes);
  
  return prayerTimes;
};

/**
 * Get upcoming prayer times within a time range
 * @param {number} from - Start timestamp in seconds
 * @param {number} to - End timestamp in seconds
 * @returns {Promise<Array>} Array of upcoming prayer times
 */
const getUpcomingPrayerTimes = async (from, to) => {
  // Get all prayer times in the specified range
  const prayerKeys = await redisClient.zrangebyscore(
    PRAYER_TIMES_SORTED_SET,
    from,
    to,
    'WITHSCORES'
  );
  
  // Process the results
  const results = [];
  for (let i = 0; i < prayerKeys.length; i += 2) {
    const [countryCode, date, prayerName] = prayerKeys[i].split(':');
    const timestamp = parseInt(prayerKeys[i + 1]);
    
    results.push({
      countryCode,
      date,
      prayerName,
      timestamp,
      time: new Date(timestamp * 1000).toISOString()
    });
  }
  
  return results;
};

/**
 * Calculate prayer times for a specific country and date
 * @param {string} countryCode - Country code (e.g., 'SAU', 'JOR')
 * @param {Date} date - Date to calculate prayer times for
 * @returns {Promise<Object>} Prayer times
 */
const calculatePrayerTimes = async (countryCode, date = new Date()) => {
  try {
    const { latitude, longitude } = await getCoordinatesForCountry(countryCode);
    const coordinates = new Coordinates(latitude, longitude);
    
    // Use Muslim World League calculation method with Shafi madhab settings
    const params = CalculationMethod.MuslimWorldLeague();
    
    // Set madhab to Shafi (earlier Asr time)
    params.madhab = 'shafi';
    
    // Better handling for high latitude areas
    params.highLatitudeRule = 'middleofthenight';
    
    // Calculate prayer times
    const prayerTimes = new PrayerTimes(coordinates, date, params);
    
    // Format times in 12-hour format with AM/PM to match timesprayer.com
    return {
      fajr: moment(prayerTimes.fajr).format('h:mm A'),
      sunrise: moment(prayerTimes.sunrise).format('h:mm A'),
      dhuhr: moment(prayerTimes.dhuhr).format('h:mm A'),
      asr: moment(prayerTimes.asr).format('h:mm A'),
      maghrib: moment(prayerTimes.maghrib).format('h:mm A'),
      isha: moment(prayerTimes.isha).format('h:mm A')
    };
  } catch (error) {
    console.error('Error calculating prayer times:', error);
    throw error;
  }
};

/**
 * Get coordinates for a country from the database
 * @param {string} countryCode - Country code (e.g., 'SAU', 'JOR')
 * @returns {Promise<Object>} Object with latitude and longitude
 */
const getCoordinatesForCountry = async (countryCode) => {
  try {
    const country = await Country.findOne({ code: countryCode.toUpperCase() });
    
    if (!country) {
      throw new Error(`Country with code ${countryCode} not found`);
    }
    
    return {
      latitude: country.coordinates.latitude,
      longitude: country.coordinates.longitude,
    };
  } catch (error) {
    console.error('Error getting coordinates for country:', error);
    throw error;
  }
};

/**
 * Cache prayer times for all countries
 * @returns {Promise<Object>} Result of the caching operation
 */
const cacheAllCountriesPrayerTimes = async () => {
  try {
    const countries = await Country.find({});
    const now = new Date();
    
    // Cache prayer times for each country
    const results = await Promise.all(
      countries.map(async (country) => {
        try {
          // This will automatically cache the prayer times
          await getPrayerTimes(country.code, now);
          return { country: country.code, success: true };
        } catch (error) {
          console.error(`Failed to cache prayer times for ${country.code}:`, error);
          return { country: country.code, success: false, error: error.message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    return {
      success: true,
      message: `Successfully cached prayer times for ${successCount} out of ${countries.length} countries`,
      details: results
    };
  } catch (error) {
    console.error('Error in cacheAllCountriesPrayerTimes:', error);
    throw error;
  }
};

/**
 * Clean up passed prayer times from Redis
 */
const cleanupPassedPrayerTimes = async () => {
  try {
    const now = Math.floor(Date.now() / 1000);
    // Remove all passed prayer times from the sorted set
    await redisClient.zremrangebyscore(PRAYER_TIMES_SORTED_SET, 0, now);
  } catch (error) {
    console.error('Error cleaning up passed prayer times:', error);
    throw error;
  }
};

/**
 * Check for prayer times that should trigger notifications now
 * Only checks for exact current time to prevent duplicate notifications
 */
const checkUpcomingPrayerTimes = async () => {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // Clean up passed prayers first
    await cleanupPassedPrayerTimes();
    
    // Get prayer times within a 30-second window (15 seconds before and after)
    const timeWindow = 15; // seconds
    const prayerKeys = await redisClient.zrangebyscore(
      PRAYER_TIMES_SORTED_SET,
      now - timeWindow,
      now + timeWindow,
      'WITHSCORES'
    );
    
    console.log(`Checking for prayer times between ${new Date((now - timeWindow) * 1000).toISOString()} and ${new Date((now + timeWindow) * 1000).toISOString()}`);
    
    // Process the results
    const prayersToNotify = [];
    for (let i = 0; i < prayerKeys.length; i += 2) {
      const prayerKey = prayerKeys[i];
      const timestamp = parseInt(prayerKeys[i + 1]);
      
      // Parse the prayer key format: TST:2025-08-31:fajr
      const [countryCode, date, prayerName] = prayerKey.split(':');
      
      console.log(`Found prayer time: ${prayerKey} at ${new Date(timestamp * 1000).toISOString()}`);
      
      // Create prayer info object
      const prayerTime = new Date(timestamp * 1000);
      const formattedTime = prayerTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'UTC'
      });
      
      const prayerInfo = {
        countryCode,
        date,
        prayerName: prayerName.toUpperCase(),
        timestamp,
        formattedTime,
        time: prayerTime.toISOString(),
        now,
        diff: Math.abs(now - timestamp)
      };
      
      prayersToNotify.push(prayerInfo);
      
      // Remove this prayer time from the sorted set to prevent duplicate notifications
      await redisClient.zrem(PRAYER_TIMES_SORTED_SET, prayerKey);
    }
    
    // Process notifications for the found prayer times
    if (prayersToNotify.length > 0) {
      console.log('🎉 Found prayer times to notify:', JSON.stringify(prayersToNotify, null, 2));
      await processPrayerTimes(prayersToNotify);
    }
    
    return prayersToNotify;
  } catch (error) {
    console.error('Error checking upcoming prayer times:', error);
    throw error;
  }
};

module.exports = {
  getPrayerTimes,
  getUpcomingPrayerTimes,
  cacheCountryPrayerTimes,
  cacheAllCountriesPrayerTimes,
  checkUpcomingPrayerTimes,
  getPrayerTimestamp
};