const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Example: "Mobile Application Development"
  code: { type: String, unique: true, required: true }, // Example: "SE401"
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  year: { type: Number, required: true }, // Year of study (1-4)
  semester: { type: Number, required: true }, // Semester (1 or 2)
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Assigned lecturer
  studentsEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] // Students taking this unit
}, { timestamps: true });

module.exports = mongoose.model("Unit", unitSchema);
