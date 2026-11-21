const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true, index: true },
    lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["LIVE", "ENDED"],
      default: "LIVE",
      index: true
    },
    qrCode: { type: String }, // PNG for display
    qrToken: { type: String }, // Raw base64 or HMAC token
    qrExpiresAt: { type: Date },
    qr_secret: { type: String, default: null }, // 32-byte hex for rotating HMAC QR token
    manual_pin: { type: String, default: null, uppercase: true, trim: true, index: true }, // 6-char alphanumeric code
    class_size: { type: Number, default: 0 }, // Enrolled students snapshot
    grace_minutes: { type: Number, default: 15 }, // Grace period before check-in is marked Late
    geofence_enabled: { type: Boolean, default: false },
    geofence_lat: { type: Number, default: null },
    geofence_lng: { type: Number, default: null },
    radius_meters: { type: Number, default: 100 }, // Allowed geo radius in meters
    venue: { type: String, default: "Main Lecture Hall" },
    ended: { type: Boolean, default: false, index: true },
    attendees: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        attendedAt: { type: Date, default: Date.now },
        checkInMethod: { type: String, enum: ["QR_SCAN", "MANUAL_PIN", "LECTURER_OVERRIDE"], default: "QR_SCAN" }
      }
    ],
    feedbackEnabled: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Keep status and ended synchronized
sessionSchema.pre("save", function (next) {
  if (this.ended) {
    this.status = "ENDED";
  } else if (this.status === "ENDED") {
    this.ended = true;
  }
  next();
});

sessionSchema.virtual("unit_id").get(function () {
  return this.unit;
});

sessionSchema.virtual("lecturer_id").get(function () {
  return this.lecturer;
});

sessionSchema.virtual("started_at").get(function () {
  return this.startTime;
});

sessionSchema.virtual("ended_at").get(function () {
  return this.endTime;
});

module.exports = mongoose.model("Session", sessionSchema);
