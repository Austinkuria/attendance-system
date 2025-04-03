const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const authMiddleware = require('../middleware/authMiddleware');
const {feedbackLimiter} = require('../middleware/rateLimiter');

router.post('/submit', authMiddleware,feedbackLimiter, feedbackController.submitFeedback);
router.get('/lecturer', authMiddleware, feedbackController.getFeedbackForLecturer);
router.get('/all', authMiddleware, feedbackController.getAllFeedback); // Admin only
router.get('/summary', authMiddleware, feedbackController.getFeedbackSummary); // Admin or lecturer

module.exports = router;