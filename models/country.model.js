const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 3
  },
  name: {
    en: {
      type: String,
      required: true,
      trim: true
    },
    ar: {
      type: String,
      required: true,
      trim: true
    }
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster querying
countrySchema.index({ code: 1 });
countrySchema.index({ 'name.en': 1 });
countrySchema.index({ 'name.ar': 1 });

const Country = mongoose.model('Country', countrySchema);

module.exports = Country;
