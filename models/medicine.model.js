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
  // For specific time reminders
  specificTime: {
    time: {
      type: String, // Stored as 'HH:MM' 24h format
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
    // Offsets in minutes for multiple reminders
    offsets: {
      before: {
        type: Number,
        default: MEDICINE.DEFAULT_OFFSETS.BEFORE
      },
      after1: {
        type: Number,
        default: MEDICINE.DEFAULT_OFFSETS.AFTER1
      },
      after2: {
        type: Number,
        default: MEDICINE.DEFAULT_OFFSETS.AFTER2
      }
    }
  },
  // For interval-based reminders
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
      type: String, // 'HH:MM' format
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: props => `${props.value} is not a valid time format. Use HH:MM 24h format.`
      },
      default: '00:01'
    },
    endTime: {
      type: String, // 'HH:MM' format
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: props => `${props.value} is not a valid time format. Use HH:MM 24h format.`
      },
      default: '23:59'
    }
  },
  enabled: {
    type: Boolean,
    default: true
  },
  // For tracking when the next reminder should be sent
  nextReminder: {
    type: Date,
    index: true
  },
  // For tracking when the last reminder was sent
  lastReminderSent: {
    type: Date
  },
  // Additional metadata
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting all reminder times (for specific time reminders)
medicineSchema.virtual('reminderTimes').get(function() {
  if (this.reminderType !== MEDICINE.REMINDER_TYPES.SPECIFIC_TIME || !this.specificTime) {
    return [];
  }

  const times = [this.specificTime.time];
  
  if (this.specificTime.frequency >= MEDICINE.REMINDER_FREQUENCY.TWICE) {
    times.push(this.calculateTime(this.specificTime.time, -this.specificTime.offsets.before));
  }
  
  if (this.specificTime.frequency >= MEDICINE.REMINDER_FREQUENCY.THRICE) {
    times.push(this.calculateTime(this.specificTime.time, this.specificTime.offsets.after1));
  }
  
  if (this.specificTime.frequency === MEDICINE.REMINDER_FREQUENCY.FOUR_TIMES) {
    times.push(this.calculateTime(this.specificTime.time, this.specificTime.offsets.after2));
  }
  
  return times.sort();
});

// Helper method to calculate time with offset
medicineSchema.methods.calculateTime = function(baseTime, offsetMinutes) {
  const [hours, minutes] = baseTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes + offsetMinutes, 0, 0);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// Method to calculate next reminder time for interval-based reminders
medicineSchema.methods.calculateNextIntervalReminder = function() {
  if (this.reminderType !== MEDICINE.REMINDER_TYPES.EVERY_X_HOURS || !this.interval) {
    return null;
  }

  const now = new Date();
  const [startHour, startMinute] = this.interval.startTime.split(':').map(Number);
  const [endHour] = this.interval.endTime.split(':').map(Number);
  
  let nextTime = new Date(now);
  nextTime.setHours(startHour, startMinute, 0, 0);
  
  // If we're past the end time for today, start from tomorrow
  if (now.getHours() >= endHour) {
    nextTime.setDate(nextTime.getDate() + 1);
  }
  
  // If we're before the start time, use today's start time
  if (now.getHours() < startHour || 
      (now.getHours() === startHour && now.getMinutes() < startMinute)) {
    return nextTime;
  }
  
  // Calculate next interval
  const hoursSinceStart = now.getHours() - startHour + (now.getMinutes() - startMinute) / 60;
  const intervalsPassed = Math.ceil(hoursSinceStart / this.interval.hours);
  const nextInterval = intervalsPassed * this.interval.hours;
  
  nextTime.setHours(startHour + nextInterval, startMinute, 0, 0);
  
  // If next interval is after end time, move to next day
  if (nextTime.getHours() >= endHour) {
    nextTime.setDate(nextTime.getDate() + 1);
    nextTime.setHours(startHour, startMinute, 0, 0);
  }
  
  return nextTime;
};

// Pre-save middleware to update nextReminder
medicineSchema.pre('save', function(next) {
  if (this.reminderType === MEDICINE.REMINDER_TYPES.EVERY_X_HOURS && this.isModified('interval')) {
    this.nextReminder = this.calculateNextIntervalReminder();
  }
  next();
});

// Add indexes for better query performance
medicineSchema.index({ user: 1, enabled: 1 });
medicineSchema.index({ nextReminder: 1, enabled: 1 });

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;