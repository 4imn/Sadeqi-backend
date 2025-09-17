const Redis = require('ioredis');
const logger = require('../utils/logger');
require('dotenv').config();
const redisConfig = {
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 1000, 10000);
    logger.warn(`Redis connection lost. Reconnecting in ${delay}ms...`);
    return delay;
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
  }
};

const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

redis.on('end', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Reconnecting to Redis...');
});

// Graceful shutdown
process.on('SIGINT', () => {
  redis.quit();
  process.exit(0);
});

module.exports = redis;