const mongoose = require('mongoose');
const { SETTINGS } = require('../config/constants');
const { PRAYER_NAMES, TIME_SYSTEM, ALARM_TONES, FONT_SIZES, DEFAULTS, VALIDATION } = SETTINGS;

const prayerReminderSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Prayer Reminders
  prayerReminders: {
    [PRAYER_NAMES.FAJR]: prayerReminderSchema,
    [PRAYER_NAMES.DHUHR]: prayerReminderSchema,
    [PRAYER_NAMES.ASR]: prayerReminderSchema,
    [PRAYER_NAMES.MAGHRIB]: prayerReminderSchema,
    [PRAYER_NAMES.ISHA]: prayerReminderSchema
  },
  // Time Settings
  timeSystem: {
    type: String,
    enum: TIME_SYSTEM.ALL,
    default: TIME_SYSTEM.DEFAULT
  },
  // Reminder Settings
  reminderAfterPrayer: {
    type: Number,
    enum: DEFAULTS.REMINDER_AFTER_PRAYER_OPTIONS,
    default: DEFAULTS.REMINDER_AFTER_PRAYER
  },
  // Notification Settings
  alarmTone: {
    type: String,
    enum: ALARM_TONES.ALL,
    default: ALARM_TONES.DEFAULT_VALUE
  },
  // Display Settings
  fontSize: {
    type: String,
    enum: FONT_SIZES.ALL,
    default: FONT_SIZES.DEFAULT
  },
  // Localization
  language: {
    type: String,
    enum: VALIDATION.SUPPORTED_LANGUAGES,
    default: DEFAULTS.LANGUAGE,
    trim: true
  },
  country: {
    type: String,
    default: DEFAULTS.COUNTRY,
    trim: true
  },
  // Notification Toggle
  notificationsEnabled: {
    type: Boolean,
    default: DEFAULTS.NOTIFICATIONS_ENABLED
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster querying
settingsSchema.index({ user: 1 });

// Create model
const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;