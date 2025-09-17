/**
 * HTTP Status Codes
 */
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Medicine Constants
const MEDICINE = {
  REMINDER_TYPES: {
    SPECIFIC_TIME: 'specific_time',
    EVERY_X_HOURS: 'every_x_hours',
  },
  REMINDER_FREQUENCY: {
    ONCE: 1,
    TWICE: 2,
    THRICE: 3,
    FOUR_TIMES: 4
  },
  INTERVAL_OPTIONS: [4, 6, 8, 12], // Valid interval options in hours
  DEFAULT_OFFSETS: {
    BEFORE: 15, // 15 minutes before
    AFTER1: 15, // 15 minutes after
    AFTER2: 30  // 30 minutes after
  }
};

/**
 * Error Messages
 */
const ERRORS = {
  // General errors
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  VALIDATION_ERROR: 'Validation Error',
  UNAUTHORIZED: 'Not authorized to access this route',
  NOT_FOUND: 'Resource not found',
  
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid credentials',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  
  // User errors
  USER_EXISTS: 'User already exists',
  USER_NOT_FOUND: 'User not found',
  
  // Prayer errors
  PRAYER_NOT_FOUND: 'Prayer time not found',
  INVALID_PRAYER_TIME: 'Invalid prayer time format',
  
  // Medicine errors
  MEDICINE_NOT_FOUND: 'Medicine reminder not found',
  INVALID_DOSAGE: 'Invalid dosage format',
  INVALID_TIME_FORMAT: 'Invalid time format (use HH:MM)',
  INVALID_DAYS_ARRAY: 'Days must be an array of 7 booleans',
  INVALID_INTERVAL: `Invalid interval. Must be one of: ${MEDICINE.INTERVAL_OPTIONS.join(', ')}`,
  
  // Location errors
  INVALID_COORDINATES: 'Invalid coordinates',
  LOCATION_REQUIRED: 'Location is required',

  SETTINGS: {
    FETCH_FAILED: 'Failed to fetch settings',
    UPDATE_FAILED: 'Failed to update settings',
    RESET_FAILED: 'Failed to reset settings',
    UPDATE_PRAYER_REMINDER_FAILED: 'Failed to update prayer reminder',
  },
  MEDICINE: {
    NOT_FOUND: "Medicine not found",
    FETCH_FAILED: "Failed to fetch medicines"
  },
};

/**
 * Validation Messages
 */
const VALIDATION = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please include a valid email',
  PASSWORD: 'Password must be at least 6 characters',
  PHONE: 'Please include a valid phone number',
  TIME: 'Time must be in HH:MM format',
  DATE: 'Date must be in YYYY-MM-DD format',
};

/**
 * Prayer Times Configuration
 */
const PRAYER_TIMES = {
  METHODS: {
    MWL: 'Muslim World League',
    ISNA: 'Islamic Society of North America',
    EGYPT: 'Egyptian General Authority of Survey',
    MAKKAH: 'Umm Al-Qura University, Makkah',
    KARACHI: 'University of Islamic Sciences, Karachi',
    TEHRAN: 'Institute of Geophysics, University of Tehran',
    JAFARI: 'Shia Ithna-Ashari, Leva Institute, Qum',
  },
  DEFAULT_METHOD: 'MWL',
  DEFAULT_ASR_METHOD: 'Standard',
  HIGHLAT: 'NightMiddle',
  ADJUSTMENTS: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
};

/**
 * Notification Settings
 */
const NOTIFICATIONS = {
  TYPES: {
    PRAYER: 'prayer',
    MEDICINE: 'medicine',
    GENERAL: 'general',
  },
  PRAYER_REMINDER_MINUTES: 15, // minutes before prayer
  MEDICINE_REMINDER_MINUTES: 30, // minutes before medicine time
};

/**
 * Settings Constants
 */
const SETTINGS = {
  // Time Systems
  TIME_SYSTEM: {
    H12: '12h',
    H24: '24h',
    DEFAULT: '24h',
    ALL: ['12h', '24h']
  },
  
  // Alarm Tones
  ALARM_TONES: {
    DEFAULT: 'default',
    ADHAN: 'adhan',
    BELL: 'bell',
    TONE: 'tone',
    ALL: ['default', 'adhan', 'bell', 'tone'],
    DEFAULT_VALUE: 'adhan'
  },
  
  // Font Sizes
  FONT_SIZES: {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large',
    ALL: ['small', 'medium', 'large'],
    DEFAULT: 'medium'
  },
  
  // Prayer Names
  PRAYER_NAMES: {
    FAJR: 'fajr',
    DHUHR: 'dhuhr',
    ASR: 'asr',
    MAGHRIB: 'maghrib',
    ISHA: 'isha',
    ALL: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
  },
  
  // Default Values
  DEFAULTS: {
    REMINDER_AFTER_PRAYER_OPTIONS: [15, 30, 45], // minutes
    REMINDER_AFTER_PRAYER: 15, // default value in minutes
    SUPPORTED_LANGUAGES: ['en', 'ar'],
    LANGUAGE: 'ar',
    COUNTRY: 'SAU',
    NOTIFICATIONS_ENABLED: true
  },
  
  // Validation
  VALIDATION: {
    MIN_REMINDER_MINUTES: 0,
    MAX_REMINDER_MINUTES: 120,
    SUPPORTED_LANGUAGES: ['en', 'ar']
  }
};

module.exports = {
  STATUS_CODES,
  ERRORS,
  VALIDATION,
  PRAYER_TIMES,
  NOTIFICATIONS,
  SETTINGS,
  MEDICINE,
};