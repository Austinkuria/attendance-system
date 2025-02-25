const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/submit', authMiddleware, feedbackController.submitFeedback);
router.get('/lecturer', authMiddleware, feedbackController.getFeedbackForLecturer);
router.get('/all', authMiddleware, feedbackController.getAllFeedback); // Admin only
router.get('/summary', authMiddleware, feedbackController.getFeedbackSummary); // Admin or lecturer

module.exports = router;