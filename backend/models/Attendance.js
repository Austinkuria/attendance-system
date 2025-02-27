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
    enum: ["Present", "Absent"], 
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
  feedbackSubmitted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

AttendanceSchema.index({ session: 1, status: 1 });
AttendanceSchema.index({ session: 1, deviceId: 1 }); // Composite index for device checks
AttendanceSchema.index({ session: 1, compositeFingerprint: 1 }); // Composite index for fingerprint checks

module.exports = mongoose.model("Attendance", AttendanceSchema);