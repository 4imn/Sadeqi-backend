const Medicine = require('../models/medicine.model');
const { ERRORS, MEDICINE } = require('../config/constants');
const User = require('../models/user.model');

/**
 * Create a new medicine reminder
 * @param {string} userId - User ID
 * @param {Object} medicineData - Medicine data
 * @returns {Promise<Object>} Created medicine reminder
 */
const createMedicineReminder = async (userId, medicineData) => {
  try {
    // Validate required fields based on reminder type
    if (medicineData.reminderType === MEDICINE.REMINDER_TYPES.SPECIFIC_TIME) {
      if (!medicineData.specificTime?.time) {
        throw new Error(ERRORS.VALIDATION.REQUIRED_FIELD + ': specificTime.time');
      }
    } else if (medicineData.reminderType === MEDICINE.REMINDER_TYPES.EVERY_X_HOURS) {
      if (!medicineData.interval?.hours || !medicineData.interval?.startTime || !medicineData.interval?.endTime) {
        throw new Error(ERRORS.VALIDATION.REQUIRED_FIELD + ': interval.hours, interval.startTime, and interval.endTime');
      }
    } else {
      throw new Error(ERRORS.VALIDATION.INVALID_REMINDER_TYPE);
    }

    const medicine = new Medicine({
      user: userId,
      ...medicineData
    });

    // Calculate next reminder time if it's an interval-based reminder
    if (medicine.reminderType === MEDICINE.REMINDER_TYPES.EVERY_X_HOURS) {
      medicine.nextReminder = medicine.calculateNextIntervalReminder();
    }

    return await medicine.save();
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new Error(ERRORS.VALIDATION.INVALID_INPUT);
    }
    throw error;
  }
};

/**
 * Get all medicine reminders for a user
 * @param {string} userId - User ID
 * @param {boolean} [activeOnly=true] - Whether to return only active reminders
 * @returns {Promise<Array>} List of medicine reminders
 */
const getUserMedicineReminders = async (userId, activeOnly = true) => {
  try {
    const query = { user: userId };
    if (activeOnly) {
      query.enabled = true;
    }
    
    return await Medicine.find(query).sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(ERRORS.MEDICINE.FETCH_FAILED);
  }
};

/**
 * Get a single medicine reminder by ID
 * @param {string} userId - User ID
 * @param {string} medicineId - Medicine reminder ID
 * @returns {Promise<Object>} Medicine reminder
 */
const getMedicineReminderById = async (userId, medicineId) => {
  try {
    const medicine = await Medicine.findOne({ _id: medicineId, user: userId });
    if (!medicine) {
      throw new Error(ERRORS.MEDICINE.NOT_FOUND);
    }
    return medicine;
  } catch (error) {
    if (error.name === 'CastError') {
      throw new Error(ERRORS.MEDICINE.NOT_FOUND);
    }
    throw error;
  }
};

/**
 * Update a medicine reminder
 * @param {string} userId - User ID
 * @param {string} medicineId - Medicine reminder ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated medicine reminder
 */
const updateMedicineReminder = async (userId, medicineId, updates) => {
  try {
    const allowedUpdates = {
      name: (val) => typeof val === 'string' && val.trim().length > 0,
      enabled: (val) => typeof val === 'boolean',
      notes: (val) => typeof val === 'string',
      reminderType: (val) => Object.values(MEDICINE.REMINDER_TYPES).includes(val),
      specificTime: (val) => {
        if (!val) return false;
        if (val.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val.time)) return false;
        if (val.frequency && !Object.values(MEDICINE.REMINDER_FREQUENCY).includes(val.frequency)) return false;
        return true;
      },
      interval: (val) => {
        if (!val) return false;
        if (val.hours && !MEDICINE.INTERVAL_OPTIONS.includes(val.hours)) return false;
        return true;
      }
    };

    const updatesToApply = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (key in allowedUpdates && allowedUpdates[key](value)) {
        updatesToApply[key] = value;
      }
    }

    if (Object.keys(updatesToApply).length === 0) {
      throw new Error(ERRORS.VALIDATION.NO_VALID_UPDATES);
    }

    const medicine = await Medicine.findOneAndUpdate(
      { _id: medicineId, user: userId },
      { $set: updatesToApply },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      throw new Error(ERRORS.MEDICINE.NOT_FOUND);
    }

    // Recalculate next reminder time if interval was updated
    if (updatesToApply.interval && medicine.reminderType === MEDICINE.REMINDER_TYPES.EVERY_X_HOURS) {
      medicine.nextReminder = medicine.calculateNextIntervalReminder();
      await medicine.save();
    }

    return medicine;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new Error(ERRORS.VALIDATION.INVALID_INPUT);
    }
    throw error;
  }
};

/**
 * Delete a medicine reminder
 * @param {string} userId - User ID
 * @param {string} medicineId - Medicine reminder ID
 * @returns {Promise<boolean>} Success status
 */
const deleteMedicineReminder = async (userId, medicineId) => {
  try {
    const result = await Medicine.deleteOne({ _id: medicineId, user: userId });
    if (result.deletedCount === 0) {
      throw new Error(ERRORS.MEDICINE.NOT_FOUND);
    }
    return true;
  } catch (error) {
    if (error.name === 'CastError') {
      throw new Error(ERRORS.MEDICINE.NOT_FOUND);
    }
    throw error;
  }
};

/**
 * Get all reminders that are due
 * @param {Date} currentTime - Current time
 * @returns {Promise<Array>} List of due reminders
 */
const getDueReminders = async (currentTime = new Date()) => {
  try {
    // نحسب الوقت الحالي بالدقائق فقط (نتجاهل الثواني والملي ثانية)
    const startOfMinute = new Date(currentTime);
    startOfMinute.setSeconds(0, 0);

    const endOfMinute = new Date(startOfMinute);
    endOfMinute.setSeconds(59, 999);

    return await Medicine.find({
      enabled: true,
      nextReminder: { $gte: startOfMinute, $lte: endOfMinute } // فقط الأدوية ضمن الدقيقة الحالية
    }).populate('user', 'deviceId token');
  } catch (error) {
    console.error('MongoDB query failed:', error);
    throw new Error(ERRORS.MEDICINE.FETCH_FAILED);
  }
};


/**
 * Update the last reminder sent time
 * @param {string} medicineId - Medicine reminder ID
 * @param {Date} [sentTime=new Date()] - When the reminder was sent
 * @returns {Promise<void>}
 */
const updateLastReminderSent = async (medicineId, sentTime = new Date()) => {
  try {
    await Medicine.findByIdAndUpdate(medicineId, {
      lastReminderSent: sentTime
    });
  } catch (error) {
    console.error('Error updating last reminder time:', error);
  }
};

module.exports = {
  createMedicineReminder,
  getUserMedicineReminders,
  getMedicineReminderById,
  updateMedicineReminder,
  deleteMedicineReminder,
  getDueReminders,
  updateLastReminderSent
};