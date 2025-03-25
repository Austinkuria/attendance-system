const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  qrCode: { type: String }, // PNG for display
  qrToken: { type: String }, // Raw base64 JSON for validation
  qrExpiresAt: { type: Date }, // Add this field to track QR expiration
  ended: { type: Boolean, default: false },
  attendees: [{ // New field to track students who marked attendance
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    attendedAt: { type: Date, default: Date.now }
  }],
  feedbackEnabled: { type: Boolean, default: false } // Flag for feedback availability
}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);