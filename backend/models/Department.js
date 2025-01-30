const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }]
}, { timestamps: true });

module.exports = mongoose.model("Department", departmentSchema);
