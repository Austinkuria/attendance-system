const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
    index: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ["Present", "Absent", "Rejected"], // Added "Rejected" status
    default: "Present",
    required: true
  },
  deviceId: {
    type: String,
    required: true,
    index: true // Add index for faster lookups
  },
  compositeFingerprint: {
    type: String,
    required: true,
    index: true // Ensure unique lookups
  },
  qrToken: {
    type: String,
    required: true
  },
  attendedAt: {
    type: Date
  },
  ipAddress: {
    type: String,
    index: true // Add index for IP-based lookups
  },
  feedbackSubmitted: {
    type: Boolean,
    default: false
  },
  // Fields for tracking attendance conflicts
  conflictType: {
    type: String,
    enum: ["exact", "similar", "ip", "timing", null],
    default: null
  },
  conflictingStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  browserInfo: {
    type: String,
    default: null
  }
}, { timestamps: true });

AttendanceSchema.index({ session: 1, status: 1 });
AttendanceSchema.index({ session: 1, deviceId: 1 }); // Composite index for device checks
AttendanceSchema.index({ session: 1, compositeFingerprint: 1 }); // Composite index for fingerprint checks
AttendanceSchema.index({ session: 1, ipAddress: 1 }); // New index for IP-based detection
AttendanceSchema.index({ ipAddress: 1, createdAt: -1 }); // For timing-based detection

module.exports = mongoose.model("Attendance", AttendanceSchema);