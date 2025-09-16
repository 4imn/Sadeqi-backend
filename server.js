require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const colors = require('colors');
const { notFound, errorHandler } = require('./middlewares/error');
const connectDB = require('./config/db');
const { initScheduler } = require('./utils/scheduler');
const auth = require('./middlewares/auth');
const swaggerSetup = require('./swagger');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Initialize scheduler
initScheduler();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Import routes
const deviceRoutes = require('./routes/device.routes');
const settingsRoutes = require('./routes/settings.route');
const prayerRoutes = require('./routes/prayer.routes');
const medicineRoutes = require('./routes/medicine.routes');

// API Routes
app.use('/api/device', deviceRoutes);
app.use('/api/settings', auth, settingsRoutes);
app.use('/api/prayer', prayerRoutes);
app.use('/api/medicine', auth, medicineRoutes);

swaggerSetup(app);
// Basic route for health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sadeeqi API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`.red.bold);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Set port and start server
const PORT = process.env.PORT || 5000;
const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold)
);

module.exports = server;