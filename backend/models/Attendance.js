const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["Present", "Absent"], default: "Present" }
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
