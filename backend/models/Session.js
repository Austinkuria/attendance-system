const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    ended: {
      type: Boolean,
      default: false,
    },
    qrCode: {
      type: String,
    },
    qrToken: {
      type: String,
    },
    qrExpiresAt: {
      type: Date,
    },
    attendees: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    feedbackEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Add an index to improve session lookup performance
sessionSchema.index({ lecturer: 1, unit: 1, startTime: 1 });
sessionSchema.index({ unit: 1, ended: 1 });

module.exports = mongoose.model('Session', sessionSchema);