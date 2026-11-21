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
    enum: ["Present", "Late", "Excused", "Absent", "Rejected", "PRESENT", "LATE", "EXCUSED", "ABSENT", "REJECTED"],
    default: "Present",
    required: true
  },
  check_in_method: {
    type: String,
    enum: ["QR_SCAN", "MANUAL_PIN", "LECTURER_OVERRIDE"],
    default: "QR_SCAN",
    index: true
  },
  device_fingerprint: {
    type: String,
    default: null
  },
  is_flagged: {
    type: Boolean,
    default: false,
    index: true
  },
  flag_reason: {
    type: String,
    default: null
  },
  deviceId: {
    type: String,
    default: "web-client",
    index: true
  },
  compositeFingerprint: {
    type: String,
    default: "standard-fingerprint",
    index: true
  },
  qrToken: {
    type: String,
    default: ""
  },
  attendedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    index: true
  },
  feedbackSubmitted: {
    type: Boolean,
    default: false
  },
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
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

AttendanceSchema.virtual("session_id").get(function () {
  return this.session;
});

AttendanceSchema.virtual("student_id").get(function () {
  return this.student;
});

AttendanceSchema.virtual("checked_in_at").get(function () {
  return this.attendedAt || this.timestamp || this.createdAt;
});

AttendanceSchema.index({ session: 1, student: 1 }, { unique: true });
AttendanceSchema.index({ session: 1, status: 1 });
AttendanceSchema.index({ session: 1, deviceId: 1 });
AttendanceSchema.index({ session: 1, compositeFingerprint: 1 });
AttendanceSchema.index({ session: 1, ipAddress: 1 });
AttendanceSchema.index({ ipAddress: 1, createdAt: -1 });

module.exports = mongoose.model("Attendance", AttendanceSchema);
