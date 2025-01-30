const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  qrCode: String,
  startTime: Date,
  endTime: Date,
  attendance: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: Date,
    status: { type: String, enum: ["present", "late"] }
  }]
}, { timestamps: true });

module.exports = mongoose.model("AttendanceSession", attendanceSchema);
