const Device = require('../models/device.model');
const { STATUS_CODES } = require('../config/constants');

/**
 * @desc    Register/Login a device
 * @route   POST /api/device/register
 * @access  Public
 */
const registerDevice = async (req, res, next) => {
  try {
    const { 
      deviceId, 
      fcmToken, 
      platform,
      timezone = 'UTC',
      language = 'en',
      country = 'SAU'
    } = req.body;

    if (!deviceId || !fcmToken || !platform) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Device ID, FCM token, and platform are required'
      });
    }

    const device = await Device.findOrCreate(deviceId, fcmToken, platform);

    // Update additional fields
    device.timezone = timezone;
    device.language = language;
    device.country = country;
    device.isActive = true;
    await device.save();

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: {
        deviceId: device.deviceId,
        platform: device.platform,
        isActive: device.isActive,
        timezone: device.timezone,
        language: device.language,
        country: device.country,
        registeredAt: device.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify device token
 * @route   POST /api/device/verify
 * @access  Public
 */
const verifyDevice = async (req, res, next) => {
  try {
    const { deviceId, fcmToken } = req.body;

    if (!deviceId || !fcmToken) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Device ID and FCM token are required'
      });
    }

    const device = await Device.findOne({ deviceId, fcmToken, isActive: true });

    if (!device) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: {
        deviceId: device.deviceId,
        isActive: device.isActive,
        platform: device.platform,
        timezone: device.timezone,
        language: device.language,
        country: device.country
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current device info
 * @route   GET /api/devices/me
 * @access  Private
 */
const getDeviceInfo = async (req, res, next) => {
  try {
    const device = await Device.findById(req.device._id);

    if (!device) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: {
        deviceId: device.deviceId,
        platform: device.platform,
        isActive: device.isActive,
        timezone: device.timezone,
        language: device.language,
        country: device.country,
        lastActive: device.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update device settings (language, country, timezone)
 * @route   PUT /api/devices/me/settings
 * @access  Private
 */
const updateDeviceSettings = async (req, res, next) => {
  try {
    const { language, country, timezone } = req.body;
    
    if (!language && !country && !timezone) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'At least one field (language, country, timezone) is required'
      });
    }

    const updateFields = {};
    if (language) updateFields.language = language;
    if (country) updateFields.country = country.toUpperCase();
    if (timezone) updateFields.timezone = timezone;

    const device = await Device.findByIdAndUpdate(
      req.device._id,
      updateFields,
      { new: true }
    );

    if (!device) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: {
        deviceId: device.deviceId,
        language: device.language,
        country: device.country,
        timezone: device.timezone,
        updatedAt: device.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update device token
 * @route   PUT /api/devices/token
 * @access  Private
 */
const updateDeviceToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Token is required'
      });
    }

    const device = await Device.findByIdAndUpdate(
      req.device._id,
      { token },
      { new: true }
    );

    if (!device) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: {
        deviceId: device.deviceId,
        token: device.token,
        updatedAt: device.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update device status
 * @route   PUT /api/devices/me/status
 * @access  Private
 */
const updateDeviceStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'isActive must be a boolean'
      });
    }

    const device = await Device.findByIdAndUpdate(
      req.device._id,
      { isActive },
      { new: true }
    );

    if (!device) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: {
        deviceId: device.deviceId,
        isActive: device.isActive,
        updatedAt: device.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDevice,
  verifyDevice,
  getDeviceInfo,
  updateDeviceToken,
  updateDeviceStatus,
  updateDeviceSettings
};
