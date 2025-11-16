const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

// Index for faster queries
departmentSchema.index({ name: 1 });

module.exports = mongoose.model("Department", departmentSchema);
