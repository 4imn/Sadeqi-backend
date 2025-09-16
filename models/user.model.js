const mongoose = require('mongoose');
const { Schema } = mongoose;
const crypto = require('crypto');

const userSchema = new Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Generate token
userSchema.statics.generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Find or create user by device ID
userSchema.statics.findOrCreate = async function(deviceId) {
  let user = await this.findOne({ deviceId });
  
  if (!user) {
    user = await this.create({
      deviceId,
      token: this.generateToken()
    });
  }
  
  return user;
};

// Verify token
userSchema.statics.verifyToken = async function(deviceId, token) {
  const user = await this.findOne({ deviceId, token });
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;