const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Example: "Bachelor of Science in Software Engineering"
  code: { type: String, required: true, unique: true }, // Example: "BSE"
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
  units: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit" }],
  external_id: { type: String, sparse: true, index: true, default: null, trim: true },
  source_system: { type: String, enum: ["manual", "sis_sync", "lti", "api"], default: "manual", index: true }
}, { timestamps: true });

module.exports = mongoose.models.Course || mongoose.model("Course", courseSchema);
