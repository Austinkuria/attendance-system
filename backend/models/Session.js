const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  qrToken: { type: String, unique: true },
  deviceFingerprints: [String] // Tracks student devices for fraud detection
}, { timestamps: true });
