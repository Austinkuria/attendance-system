const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        "SESSION_STARTED",
        "FEEDBACK_REMINDER",
        "LOW_ATTENDANCE",
        "SYSTEM",
        "SESSION_ENDED",
        "ANNOUNCEMENT"
      ],
      default: "SYSTEM",
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

notificationSchema.virtual("user_id").get(function () {
  return this.user;
});

module.exports = mongoose.model("Notification", notificationSchema);
