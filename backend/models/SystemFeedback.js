const mongoose = require('mongoose');

const systemFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true // Add index for better query performance
    },
    userRole: {
      type: String,
      enum: ['student', 'lecturer', 'admin'],
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
    }
  },
  {
    timestamps: true,
    // Add toJSON transform to make the response cleaner
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

const SystemFeedback = mongoose.model('SystemFeedback', systemFeedbackSchema);

module.exports = SystemFeedback;
