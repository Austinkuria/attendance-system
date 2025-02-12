const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  qrToken: { type: String, unique: true },
  date: {
    type: Date,
    default: Date.now
  },
  feedback: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Feedback"
  }],
  deviceFingerprints: [String] // Tracks student devices for fraud detection
}, { timestamps: true });
