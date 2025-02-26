const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true }, // Added unit
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }, // Added course
  rating: { type: Number, required: true, min: 1, max: 5 },
  feedbackText: { type: String },
  pace: { type: Number, min: 0, max: 100 },
  interactivity: { type: Number, min: 1, max: 5 },
  clarity: { type: Boolean },
  resources: { type: String },
  anonymous: { type: Boolean, default: false }, // Added anonymous option
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);