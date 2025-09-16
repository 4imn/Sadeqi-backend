const medicineService = require('../services/medicine.service');
const { ERRORS } = require('../config/constants');

/**
 * Create a new medicine reminder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createMedicineReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const medicineData = req.body;
    
    const medicine = await medicineService.createMedicineReminder(userId, medicineData);
    
    res.status(201).json({
      success: true,
      data: medicine
    });
  } catch (error) {
    if (error.message.startsWith(ERRORS.VALIDATION.REQUIRED_FIELD)) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create medicine reminder'
    });
  }
};

/**
 * Get all medicine reminders for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMedicineReminders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { active } = req.query;
    const activeOnly = active !== 'false';
    
    const reminders = await medicineService.getUserMedicineReminders(userId, activeOnly);
    
    res.json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medicine reminders'
    });
  }
};

/**
 * Get a single medicine reminder by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMedicineReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    
    const reminder = await medicineService.getMedicineReminderById(userId, id);
    
    res.json({
      success: true,
      data: reminder
    });
  } catch (error) {
    if (error.message === ERRORS.MEDICINE.NOT_FOUND) {
      return res.status(404).json({
        success: false,
        message: 'Medicine reminder not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medicine reminder'
    });
  }
};

/**
 * Update a medicine reminder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateMedicineReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updates = req.body;
    
    const updatedReminder = await medicineService.updateMedicineReminder(userId, id, updates);
    
    res.json({
      success: true,
      data: updatedReminder
    });
  } catch (error) {
    if (error.message === ERRORS.MEDICINE.NOT_FOUND) {
      return res.status(404).json({
        success: false,
        message: 'Medicine reminder not found'
      });
    }
    if (error.message === ERRORS.VALIDATION.NO_VALID_UPDATES || 
        error.message === ERRORS.VALIDATION.INVALID_INPUT) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(400).json({
      success: false,
      message: 'Failed to update medicine reminder'
    });
  }
};

/**
 * Delete a medicine reminder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteMedicineReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    
    await medicineService.deleteMedicineReminder(userId, id);
    
    res.json({
      success: true,
      message: 'Medicine reminder deleted successfully'
    });
  } catch (error) {
    if (error.message === ERRORS.MEDICINE.NOT_FOUND) {
      return res.status(404).json({
        success: false,
        message: 'Medicine reminder not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete medicine reminder'
    });
  }
};

/**
 * Toggle medicine reminder status (enabled/disabled)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const toggleMedicineReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Enabled status must be a boolean'
      });
    }
    
    const updatedReminder = await medicineService.updateMedicineReminder(userId, id, { enabled });
    
    res.json({
      success: true,
      data: updatedReminder
    });
  } catch (error) {
    if (error.message === ERRORS.MEDICINE.NOT_FOUND) {
      return res.status(404).json({
        success: false,
        message: 'Medicine reminder not found'
      });
    }
    res.status(400).json({
      success: false,
      message: 'Failed to update medicine reminder status'
    });
  }
};

module.exports = {
  createMedicineReminder,
  getMedicineReminders,
  getMedicineReminder,
  updateMedicineReminder,
  deleteMedicineReminder,
  toggleMedicineReminder
};