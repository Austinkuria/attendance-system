const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ["student", "lecturer", "admin"], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  regNo: { type: String, unique: true, sparse: true }, // Only for students
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }, // For admins
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" }, // For students
  enrolledUnits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit" }], // Students
  assignedUnits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit" }], // Lecturers
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
