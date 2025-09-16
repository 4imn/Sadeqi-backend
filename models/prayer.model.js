const mongoose = require('mongoose');
const { Schema } = mongoose;
const { PRAYER_NAMES } = require('../config/constants');

const prayerTimeSchema = new Schema({
  // Location information
  country: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  // Date for these prayer times (YYYY-MM-DD format)
  date: {
    type: Date,
    required: true,
    index: true
  },
  // Prayer times in 24-hour format (HH:MM)
  times: {
    fajr: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'Invalid time format. Use HH:MM 24h format.'
      }
    },
    dhuhr: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'Invalid time format. Use HH:MM 24h format.'
      }
    },
    asr: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'Invalid time format. Use HH:MM 24h format.'
      }
    },
    maghrib: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'Invalid time format. Use HH:MM 24h format.'
      }
    },
    isha: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'Invalid time format. Use HH:MM 24h format.'
      }
    }
  },
  // Calculation method used (for reference)
  calculationMethod: {
    type: String,
    default: 'MWL', // Muslim World League
    enum: ['MWL', 'ISNA', 'Egypt', 'Makkah', 'Karachi', 'Tehran', 'Jafari']
  },
  // Timezone offset in minutes from UTC
  timezone: {
    type: Number,
    required: true
  },
  // Last updated timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for fast lookups by location and date
prayerTimeSchema.index({ country: 1, date: 1 }, { unique: true });

// Method to get prayer time by name
prayerTimeSchema.methods.getPrayerTime = function(prayerName) {
  if (!PRAYER_NAMES[prayerName]) {
    throw new Error(`Invalid prayer name: ${prayerName}`);
  }
  return this.times[prayerName.toLowerCase()];
};

// Method to get next prayer time
prayerTimeSchema.methods.getNextPrayer = function() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const prayers = [
    { name: 'fajr', time: this.times.fajr },
    { name: 'sunrise', time: this.times.sunrise },
    { name: 'dhuhr', time: this.times.dhuhr },
    { name: 'asr', time: this.times.asr },
    { name: 'maghrib', time: this.times.maghrib },
    { name: 'isha', time: this.times.isha }
  ];
  
  // Convert all times to minutes since midnight for comparison
  const prayerMinutes = prayers.map(prayer => {
    const [hours, minutes] = prayer.time.split(':').map(Number);
    return {
      name: prayer.name,
      minutes: hours * 60 + minutes
    };
  });
  
  // Find the next prayer
  const nextPrayer = prayerMinutes.find(prayer => prayer.minutes > currentTime) || 
                    { ...prayerMinutes[0], minutes: prayerMinutes[0].minutes + 24 * 60 }; // Wrap around to next day
  
  // Calculate minutes until next prayer
  const minutesUntilNext = nextPrayer.minutes - currentTime;
  
  return {
    name: nextPrayer.name,
    time: this.times[nextPrayer.name],
    inMinutes: minutesUntilNext
  };
};

const PrayerTime = mongoose.model('PrayerTime', prayerTimeSchema);

module.exports = PrayerTime;