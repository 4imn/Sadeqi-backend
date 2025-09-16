const http = require('http');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_URI;
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  retryStrategy: () => null, // Disable retry for health check
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 5000,
});

const server = http.createServer(async (req, res) => {
  try {
    // Check MongoDB connection
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });

    // Check Redis connection
    await redis.ping();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } catch (error) {
    logger.error('Health check failed:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', error: error.message }));
  }
});

server.listen(PORT, '0.0.0.0');
