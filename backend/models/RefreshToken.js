const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true
    // index is defined below with TTL for automatic cleanup
  },
  createdByIp: {
    type: String
  },
  revokedAt: {
    type: Date
  },
  revokedByIp: {
    type: String
  },
  replacedByToken: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual to check if token is expired
refreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= this.expiresAt;
});

// Virtual to check if token is valid
refreshTokenSchema.virtual('isValid').get(function () {
  return this.isActive && !this.isExpired && !this.revokedAt;
});

// Index for automatic cleanup of expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to revoke token
refreshTokenSchema.methods.revoke = function (ipAddress, replacedByToken) {
  this.revokedAt = Date.now();
  this.revokedByIp = ipAddress;
  this.isActive = false;
  if (replacedByToken) {
    this.replacedByToken = replacedByToken;
  }
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
