require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Device = require('../models/device.model');

const seedDevice = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    await Device.deleteMany({ deviceId: 'TEST_DEVICE_001' });

    const device = new Device({
      deviceId: 'TEST_DEVICE_001',
      fcmToken: 'FAKE_FCM_TOKEN_123456',
      platform: 'android',
      timezone: 'Asia/Amman',
      language: 'ar',
      country: 'JOR',
      isActive: true
    });

    await device.save();
    console.log('✅ Device added successfully:', device);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding device:', error);
    process.exit(1);
  }
};

seedDevice();
