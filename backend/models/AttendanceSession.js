const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["present", "late"], default: "present" }
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
