const mongoose = require('mongoose');
const crypto = require('crypto');

const deviceSchema = new mongoose.Schema({
  // Unique device identifier
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Firebase Cloud Messaging token
  fcmToken: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  // Device information
  platform: {
    type: String,
    enum: ['android', 'ios', 'web'],
    required: true
  },
  
  // Timezone
  timezone: {
    type: String,
    default: 'UTC',
    trim: true
  },
  
  // Language
  language: {
    type: String,
    default: 'en',
    trim: true
  },
  
  // Country (ISO 3166-1 alpha-3)
  country: {
    type: String,
    default: 'SAU',
    trim: true,
    uppercase: true
  },
  
  // Device status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Find or create device
deviceSchema.statics.findOrCreate = async function(deviceId, fcmToken, platform) {
  let device = await this.findOne({ deviceId });
  
  if (!device) {
    device = await this.create({
      deviceId,
      fcmToken,
      platform,
    });
  } else {
    device.fcmToken = fcmToken;
    device.platform = platform;
    await device.save();
  }
  
  return device;
};

// Find active devices by country code
deviceSchema.statics.findActiveByCountry = async function (countryCode) {
  return this.find({
    country: countryCode.toUpperCase(), // To be compatible with the uppercase of the model
    isActive: true
  });
};



// Index for faster queries
deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ fcmToken: 1 });

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
