const Device = require('../models/device.model');
const { STATUS_CODES } = require('../config/constants');

const auth = async (req, res, next) => {
  try {
    const deviceId = req.headers['x-device-id'];
    const deviceToken = req.headers['x-device-token'];
    
    if (!deviceId || !deviceToken) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Device ID and device token are required'
      });
    }
    
    const device = await Device.findOne({ 
      deviceId,
      fcmToken: deviceToken,
      isActive: true 
    });
    
    if (!device) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Attach device to request
    req.device = device;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = auth;