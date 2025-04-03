const express = require('express');
const router = express.Router();
const systemFeedbackController = require('../controllers/systemFeedback.controller');
const authenticate = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');

logger.info('Loading system feedback routes...');

// Rate limiter: maximum of 100 requests per 15 minutes
const feedbackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

// Root POST endpoint - authentication first, then controller
router.post('/', authenticate, feedbackLimiter, systemFeedbackController.submitFeedback);

// Anonymous feedback endpoint - no authentication required
router.post('/anonymous', systemFeedbackController.submitAnonymousFeedback);

// Get all feedback - admin only
router.get('/all', authenticate, systemFeedbackController.getAllFeedback);

// Get user's feedback - fix this route
router.get('/user', authenticate, systemFeedbackController.getUserFeedback);

// Update feedback status - admin only
router.put('/:id/status', authenticate, systemFeedbackController.updateFeedbackStatus);

// Delete feedback - admin only
router.delete('/:id', authenticate, systemFeedbackController.deleteFeedback);

module.exports = router;
