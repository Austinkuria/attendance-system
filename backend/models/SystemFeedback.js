const mongoose = require('mongoose');

const SystemFeedbackSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
        type: String,
        required: true,
        enum: ['Bug', 'Feature Request', 'UI Improvement', 'Performance Issue', 'Other']
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: Number, min: 1, max: 5, required: true },
    screenshot: { type: String }, // Base64 encoded image or URL
    userRole: { type: String },
    status: {
        type: String,
        enum: ['New', 'Under Review', 'In Progress', 'Resolved', 'Closed'],
        default: 'New'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemFeedback', SystemFeedbackSchema);
