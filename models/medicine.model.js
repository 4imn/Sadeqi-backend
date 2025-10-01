const mongoose = require('mongoose');
const { Schema } = mongoose;
const { MEDICINE } = require('../config/constants');

const medicineSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  reminderType: {
    type: String,
    required: true,
    enum: Object.values(MEDICINE.REMINDER_TYPES)
  },
  specificTime: {
    time: {
      type: String,
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: props => `${props.value} is not a valid time format. Use HH:MM 24h format.`
      }
    },
    frequency: {
      type: Number,
      enum: Object.values(MEDICINE.REMINDER_FREQUENCY),
      default: MEDICINE.REMINDER_FREQUENCY.ONCE
    },
    offsets: {
      before: { type: Number, default: MEDICINE.DEFAULT_OFFSETS.BEFORE },
      after1: { type: Number, default: MEDICINE.DEFAULT_OFFSETS.AFTER1 },
      after2: { type: Number, default: MEDICINE.DEFAULT_OFFSETS.AFTER2 }
    }
  },
  interval: {
    hours: {
      type: Number,
      enum: MEDICINE.INTERVAL_OPTIONS,
      validate: {
        validator: Number.isInteger,
        message: props => `Hours must be one of: ${MEDICINE.INTERVAL_OPTIONS.join(', ')}`
      }
    },
    startTime: {
      type: String,
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: props => `${props.value} is not a valid time format. Use HH:MM 24h format.`
      },
      default: '00:01'
    },
    endTime: {
      type: String,
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: props => `${props.value} is not a valid time format. Use HH:MM 24h format.`
      },
      default: '23:59'
    }
  },
  enabled: { type: Boolean, default: true },
  nextReminder: { type: Date, index: true },
  lastReminderSent: { type: Date },
  notes: { type: String, trim: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for specificTime reminder times
medicineSchema.virtual('reminderTimes').get(function() {
  if (this.reminderType !== MEDICINE.REMINDER_TYPES.SPECIFIC_TIME || !this.specificTime) {
    return [];
  }

  const times = [this.specificTime.time];

  if (this.specificTime.frequency >= MEDICINE.REMINDER_FREQUENCY.TWICE)
    times.push(this.calculateTime(this.specificTime.time, -this.specificTime.offsets.before));

  if (this.specificTime.frequency >= MEDICINE.REMINDER_FREQUENCY.THRICE)
    times.push(this.calculateTime(this.specificTime.time, this.specificTime.offsets.after1));

  if (this.specificTime.frequency === MEDICINE.REMINDER_FREQUENCY.FOUR_TIMES)
    times.push(this.calculateTime(this.specificTime.time, this.specificTime.offsets.after2));

  return times.sort();
});

// Helper method to calculate time with offset
medicineSchema.methods.calculateTime = function(baseTime, offsetMinutes) {
  const [hours, minutes] = baseTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes + offsetMinutes, 0, 0);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// Method for interval-based reminders
medicineSchema.methods.calculateNextIntervalReminder = function() {
  if (this.reminderType !== MEDICINE.REMINDER_TYPES.EVERY_X_HOURS || !this.interval) return null;

  const now = new Date();
  const [startHour, startMinute] = this.interval.startTime.split(':').map(Number);
  const [endHour] = this.interval.endTime.split(':').map(Number);

  let nextTime = new Date(now);
  nextTime.setHours(startHour, startMinute, 0, 0);

  if (now.getHours() >= endHour) nextTime.setDate(nextTime.getDate() + 1);

  if (now.getHours() < startHour || (now.getHours() === startHour && now.getMinutes() < startMinute))
    return nextTime;

  const hoursSinceStart = now.getHours() - startHour + (now.getMinutes() - startMinute) / 60;
  const intervalsPassed = Math.ceil(hoursSinceStart / this.interval.hours);
  const nextInterval = intervalsPassed * this.interval.hours;

  nextTime.setHours(startHour + nextInterval, startMinute, 0, 0);

  if (nextTime.getHours() >= endHour) {
    nextTime.setDate(nextTime.getDate() + 1);
    nextTime.setHours(startHour, startMinute, 0, 0);
  }

  return nextTime;
};

// Pre-save middleware to update nextReminder for all types
medicineSchema.pre('save', function(next) {
  // Every X hours
  if (this.reminderType === MEDICINE.REMINDER_TYPES.EVERY_X_HOURS && this.isModified('interval')) {
    this.nextReminder = this.calculateNextIntervalReminder();
  }

  // Specific time
  if (this.reminderType === MEDICINE.REMINDER_TYPES.SPECIFIC_TIME && this.isModified('specificTime')) {
    const reminderTimes = this.reminderTimes;
    if (reminderTimes.length > 0) {
      const [hours, minutes] = reminderTimes[0].split(':').map(Number);
      const next = new Date();
      next.setUTCHours(hours, minutes, 0, 0); 
      this.nextReminder = next;
    }
  }

  next();
});

// Indexes
medicineSchema.index({ user: 1, enabled: 1 });
medicineSchema.index({ nextReminder: 1, enabled: 1 });

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;
