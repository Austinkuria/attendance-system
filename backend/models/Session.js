const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  qrCode: { type: String }, // Changed from required: true
  ended: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);
