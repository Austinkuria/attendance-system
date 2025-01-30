const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Example: "Bachelor of Science in Software Engineering"
  code: { type: String, required: true, unique: true }, // Example: "BSE"
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
  units: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit" }]
}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);
