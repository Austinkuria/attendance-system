const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 }, // e.g., 1-5 stars
  feedbackText: { type: String }, // Optional comments
  pace: { type: Number, min: 0, max: 100 }, // e.g., 0-100 scale for pacing
  interactivity: { type: Number, min: 1, max: 5 }, // e.g., 1-5 rating
  clarity: { type: Boolean }, // Was the session clear? (Yes/No)
  resources: { type: String }, // Suggestions for resources
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);