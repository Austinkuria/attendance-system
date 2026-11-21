const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Example: "Mobile Application Development"
  code: { type: String, unique: true, required: true }, // Example: "SE401"
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", index: true }, // Department scope
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" }, // Primary degree course
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }], // Cross-listed degree courses
  year: { type: Number, required: true }, // Year of study (1-4)
  semester: { type: Number, required: true }, // Semester (1 or 2)
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Primary lecturer
  coLecturers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Teaching assistants / co-lecturers
  studentsEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Students taking this unit
  external_id: { type: String, sparse: true, index: true, default: null, trim: true },
  source_system: { type: String, enum: ["manual", "sis_sync", "lti", "api"], default: "manual", index: true }
}, { timestamps: true });

module.exports = mongoose.model("Unit", unitSchema);
