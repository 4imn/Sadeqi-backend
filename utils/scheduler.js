const { scheduleJob } = require('node-schedule');
const { cacheAllCountriesPrayerTimes, checkUpcomingPrayerTimes } = require('../services/prayer.service');
const logger = require('./logger');
const redisClient = require('../config/redis');

/**
 * Safely close Redis connection
 */
const safeQuitRedis = async () => {
  if (redisClient && typeof redisClient.quit === 'function') {
    try {
      await redisClient.quit();
      logger.info('Redis client disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
    }
  }
};

/**
 * Initialize all scheduled jobs
 */
const initScheduler = () => {
  // Handle process termination
  const shutdown = async () => {
    logger.info('Shutting down scheduler...');
    await safeQuitRedis();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Schedule prayer times caching to run daily at 00:01 AM
  scheduleJob('0 1 0 * * *', async () => {
    try {
      logger.info('Running daily prayer times cache job...');
      await cacheAllCountriesPrayerTimes();
      logger.info('Prayer times cache job completed');
    } catch (error) {
      logger.error('Error in prayer times cache job:', error);
      await safeQuitRedis();
    }
  });

  // Check for upcoming prayer times every 30 seconds
  scheduleJob('*/30 * * * * *', async () => {
    try {
      await checkUpcomingPrayerTimes();
    } catch (error) {
      logger.error('Error in prayer time check job:', error);
      await safeQuitRedis();
    }
  });

  // Run immediately on server start for the first time
  (async () => {
    try {
      logger.info('Running initial prayer times cache...');
      await cacheAllCountriesPrayerTimes();
      logger.info('Initial prayer times cache completed');
    } catch (error) {
      logger.error('Error in initial prayer times cache:', error);
      await safeQuitRedis();
    }
  })();
};

module.exports = {
  initScheduler
};