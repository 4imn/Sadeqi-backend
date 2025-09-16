const { toHijri, toGregorian } = require('hijri-converter');
const { ERRORS } = require('../config/constants');

// Calendar types
const CALENDAR_TYPES = {
  GREGORIAN: 'gregorian',
  HIJRI: 'hijri'
};

// Time formats
const TIME_FORMATS = {
  H24: 'H24',  // 24-hour format (14:30)
  H12: 'H12'   // 12-hour format (2:30 PM)
};

/**
 * Get current date in specified calendar and format
 * @param {string} [calendar='gregorian'] - Calendar type ('gregorian' or 'hijri')
 * @param {string} [format='YYYY-MM-DD'] - Date format
 * @returns {string} Formatted date string
 */
const getCurrentDate = (calendar = CALENDAR_TYPES.GREGORIAN, format = 'YYYY-MM-DD') => {
  const now = new Date();
  
  if (calendar === CALENDAR_TYPES.HIJRI) {
    const hijriDate = toHijri(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );
    
    return formatDate(hijriDate, format, CALENDAR_TYPES.HIJRI);
  }
  
  // Default to Gregorian
  return formatDate({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate()
  }, format, CALENDAR_TYPES.GREGORIAN);
};

/**
 * Get current time in specified format
 * @param {string} [format='H24'] - Time format ('H24' or 'H12')
 * @returns {string} Formatted time string
 */
const getCurrentTime = (format = TIME_FORMATS.H24) => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  if (format === TIME_FORMATS.H12) {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }
  
  // Default to 24-hour format
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Format date according to specified format and calendar
 * @param {Object} date - Date object with {year, month, day}
 * @param {string} format - Format string (e.g., 'YYYY-MM-DD', 'DD/MM/YYYY')
 * @param {string} [calendar='gregorian'] - Calendar type
 * @returns {string} Formatted date string
 */
const formatDate = (date, format, calendar = CALENDAR_TYPES.GREGORIAN) => {
  const { year, month, day } = date;
  const isHijri = calendar === CALENDAR_TYPES.HIJRI;
  
  // Convert to Gregorian if needed for formatting
  const formatDate = isHijri ? toGregorian(year, month, day) : date;
  
  const pad = n => String(n).padStart(2, '0');
  
  return format
    .replace(/YYYY/g, formatDate.year)
    .replace(/MM/g, pad(formatDate.month))
    .replace(/DD/g, pad(formatDate.day))
    .replace(/M/g, formatDate.month)
    .replace(/D/g, formatDate.day);
};

/**
 * Convert between Gregorian and Hijri dates
 * @param {Object} date - Date object with {year, month, day}
 * @param {string} from - Source calendar ('gregorian' or 'hijri')
 * @param {string} to - Target calendar ('gregorian' or 'hijri')
 * @returns {Object} Converted date object
 */
const convertCalendar = (date, from, to) => {
  const { year, month, day } = date;
  
  if (from === to) return { year, month, day };
  
  if (from === CALENDAR_TYPES.GREGORIAN && to === CALENDAR_TYPES.HIJRI) {
    return toHijri(year, month, day);
  }
  
  if (from === CALENDAR_TYPES.HIJRI && to === CALENDAR_TYPES.GREGORIAN) {
    return toGregorian(year, month, day);
  }
  
  throw new Error('Invalid calendar conversion');
};

/**
 * Get day of week in specified calendar
 * @param {Object} date - Date object with {year, month, day}
 * @param {string} [calendar='gregorian'] - Calendar type
 * @returns {number} Day of week (0-6, where 0 is Sunday for Gregorian, 0 is Saturday for Hijri)
 */
const getDayOfWeek = (date, calendar = CALENDAR_TYPES.GREGORIAN) => {
  const { year, month, day } = date;
  let jsDate;
  
  if (calendar === CALENDAR_TYPES.HIJRI) {
    const gregDate = toGregorian(year, month, day);
    jsDate = new Date(gregDate.year, gregDate.month - 1, gregDate.day);
  } else {
    jsDate = new Date(year, month - 1, day);
  }
  
  return jsDate.getDay(); // 0 (Sunday) to 6 (Saturday)
};

/**
 * Get month names
 * @param {string} [calendar='gregorian'] - Calendar type
 * @param {string} [locale='en'] - Locale code
 * @returns {string[]} Array of month names
 */
const getMonthNames = (calendar = CALENDAR_TYPES.GREGORIAN, locale = 'en') => {
  if (calendar === CALENDAR_TYPES.HIJRI) {
    const hijriMonths = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
      'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah'
    ];
    
    if (locale.startsWith('ar')) {
      return [
        'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
        'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
        'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
      ];
    }
    
    return hijriMonths;
  }
  
  // Gregorian months
  const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1);
    return formatter.format(date);
  });
};

/**
 * Parse time string (HH:MM) to minutes since midnight
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {number} Minutes since midnight
 * @throws {Error} If time format is invalid
 */
const timeToMinutes = (timeStr) => {
  if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
    throw new Error(ERRORS.INVALID_TIME_FORMAT);
  }
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Format minutes since midnight to HH:MM
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Formatted time string
 */
const minutesToTime = (minutes) => {
  const hrs = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Add minutes to a time string
 * @param {string} timeStr - Base time in HH:MM format
 * @param {number} minutesToAdd - Minutes to add
 * @returns {string} New time in HH:MM format
 */
const addMinutesToTime = (timeStr, minutesToAdd) => {
  const totalMinutes = timeToMinutes(timeStr) + minutesToAdd;
  return minutesToTime(totalMinutes);
};

/**
 * Compare two times (HH:MM)
 * @param {string} time1 - First time
 * @param {string} time2 - Second time
 * @returns {number} 1 if time1 > time2, -1 if time1 < time2, 0 if equal
 */
const compareTimes = (time1, time2) => {
  const minutes1 = timeToMinutes(time1);
  const minutes2 = timeToMinutes(time2);
  
  if (minutes1 > minutes2) return 1;
  if (minutes1 < minutes2) return -1;
  return 0;
};

/**
 * Get minutes until a specific time
 * @param {string} targetTime - Target time in HH:MM format
 * @param {Date} [now] - Optional current date object
 * @returns {number} Minutes until target time (can be negative if target time has passed)
 */
const getMinutesUntil = (targetTime, now = new Date()) => {
  const currentTime = getCurrentTime(now);
  const currentMinutes = timeToMinutes(currentTime);
  const targetMinutes = timeToMinutes(targetTime);
  
  return targetMinutes - currentMinutes;
};

/**
 * Format date to localized string
 * @param {Date} date - Date object
 * @param {string} locale - Locale string (e.g., 'en-US', 'ar-SA')
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
const formatLocalizedDate = (date, locale = 'en-US', options = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}) => {
  return new Intl.DateTimeFormat(locale, options).format(date);
};

module.exports = {
  CALENDAR_TYPES,
  TIME_FORMATS,
  getCurrentDate,
  getCurrentTime,
  formatDate,
  convertCalendar,
  getDayOfWeek,
  getMonthNames,
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
  compareTimes,
  getMinutesUntil,
  formatLocalizedDate
};
