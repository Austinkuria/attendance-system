const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  validFrom: Date,
  validTo: Date
}, { timestamps: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);