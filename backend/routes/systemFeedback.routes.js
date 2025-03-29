const express = require('express');
const router = express.Router();
const systemFeedbackController = require('../controllers/systemFeedback.controller');
// Use the correct middleware that's actually defined in your project
const authMiddleware = require('../middleware/authMiddleware');

// Debug message to confirm this file is being loaded
console.log('Loading system feedback routes...');

// Root POST endpoint - NO PATH needed here, since we're mounting at /system-feedback
router.post('/', systemFeedbackController.submitFeedback);
console.log('POST / route registered for system feedback');

// Get all feedback - admin only
router.get('/all', systemFeedbackController.getAllFeedback);

// Get user's feedback
router.get('/user', systemFeedbackController.getUserFeedback);

// Update feedback status - admin only 
router.put('/:id/status', systemFeedbackController.updateSystemFeedbackStatus);

// Delete feedback - admin only
router.delete('/:id', systemFeedbackController.deleteFeedback);

module.exports = router;
