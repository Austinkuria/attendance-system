const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  overall_rating: { type: Number, min: 1, max: 5, default: 5 },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  is_clear: { type: Boolean, default: true },
  clarity: { type: Boolean, default: true },
  pace: {
    type: String,
    enum: ['TOO_SLOW', 'JUST_RIGHT', 'TOO_FAST', 'too_slow', 'just_right', 'too_fast', '0', '50', '100', null],
    default: 'JUST_RIGHT'
  },
  interactivity: { type: Number, min: 1, max: 5, default: 3 },
  resources_helpful: { type: String, default: '' },
  resources: { type: String, default: '' },
  comments: { type: String, default: '' },
  feedbackText: { type: String, default: '' },
  is_anonymous: { type: Boolean, default: true },
  anonymous: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Synchronize legacy and new field names before validation/save
FeedbackSchema.pre('save', function (next) {
  if (this.overall_rating && !this.rating) this.rating = this.overall_rating;
  if (this.rating && !this.overall_rating) this.overall_rating = this.rating;
  
  if (this.is_clear !== undefined && this.clarity === undefined) this.clarity = this.is_clear;
  if (this.clarity !== undefined && this.is_clear === undefined) this.is_clear = this.clarity;

  if (this.comments && !this.feedbackText) this.feedbackText = this.comments;
  if (this.feedbackText && !this.comments) this.comments = this.feedbackText;

  if (this.is_anonymous !== undefined && this.anonymous === undefined) this.anonymous = this.is_anonymous;
  if (this.anonymous !== undefined && this.is_anonymous === undefined) this.is_anonymous = this.anonymous;

  if (this.resources_helpful && !this.resources) this.resources = this.resources_helpful;
  if (this.resources && !this.resources_helpful) this.resources_helpful = this.resources;

  next();
});

FeedbackSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
