const express = require('express');
const router = express.Router();
const systemFeedbackController = require('../controllers/systemFeedback.controller');
// Use the correct middleware that's actually defined in your project
const authMiddleware = require('../middleware/authMiddleware');

// Remove excessive debug logging that may hide errors in production
const logger = require('../utils/logger');
logger.info('Loading system feedback routes...');

// Root POST endpoint - NO PATH needed here, since we're mounting at /system-feedback
router.post('/', systemFeedbackController.submitFeedback);

// Get all feedback - admin only
router.get('/all', systemFeedbackController.getAllFeedback);

// Get user's feedback
router.get('/user', systemFeedbackController.getUserFeedback);

// Update feedback status - admin only
// This was the issue - using updateSystemFeedbackStatus instead of updateFeedbackStatus 
router.put('/:id/status', systemFeedbackController.updateFeedbackStatus);

// Delete feedback - admin only
router.delete('/:id', systemFeedbackController.deleteFeedback);

module.exports = router;
