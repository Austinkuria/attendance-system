const mongoose = require('mongoose');

// Create ObjectId type helper for consistent ID handling
const ObjectId = mongoose.Schema.Types.ObjectId;

const systemFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      ref: 'User',
      // Make userId optional for anonymous feedback
      required: function () {
        return !this.anonymous; // Only required if not anonymous
      },
      index: true // Add index for better query performance
    },
    userRole: {
      type: String,
      enum: ['student', 'lecturer', 'admin', 'anonymous'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    category: {
      type: String,
      required: true,
      enum: ['Bug', 'Feature Request', 'UI Improvement', 'Performance Issue', 'Other'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    severity: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    status: {
      type: String,
      enum: ['New', 'Under Review', 'In Progress', 'Resolved', 'Closed'],
      default: 'New'
    },
    screenshot: {
      type: String // URL or Base64 encoded image
    },
    // Add field to indicate anonymous feedback
    anonymous: {
      type: Boolean,
      default: false
    },
    // Optional device info for anonymous submissions
    deviceInfo: {
      type: Object,
      default: null
    }
  },
  {
    timestamps: true,
    // Improve the toJSON transform to better handle ObjectIds
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        // Make sure userId is always a string when present
        if (ret.userId && typeof ret.userId === 'object' && ret.userId._id) {
          ret.userId = ret.userId._id.toString();
        } else if (ret.userId) {
          ret.userId = ret.userId.toString();
        }
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Add a pre-find middleware to help with ObjectId conversions
systemFeedbackSchema.pre('find', function () {
  // If there's a userId filter that's a string, try to convert it to ObjectId
  if (this._conditions.userId && typeof this._conditions.userId === 'string') {
    try {
      this._conditions.userId = new mongoose.Types.ObjectId(this._conditions.userId);
    } catch (error) {
      // If conversion fails, leave it as is
      console.error('Failed to convert userId to ObjectId:', error);
    }
  }
});

const SystemFeedback = mongoose.model('SystemFeedback', systemFeedbackSchema);

module.exports = SystemFeedback;
