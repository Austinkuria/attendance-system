const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { submitLectureFeedback } = require('../controllers/studentDashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const { feedbackLimiter } = require('../middleware/rateLimiter');

// Supports both student lecture feedback and detailed feedback controller
router.post('/', authMiddleware, feedbackLimiter, (req, res, next) => {
  // If request contains sessionId & overallRating / comments, route to studentDashboardController
  if (req.body.overallRating !== undefined || req.body.isClear !== undefined) {
    return submitLectureFeedback(req, res, next);
  }
  return feedbackController.submitFeedback(req, res, next);
});
router.post('/submit', authMiddleware, feedbackLimiter, feedbackController.submitFeedback);
router.get('/lecturer', authMiddleware, feedbackController.getFeedbackForLecturer);
router.get('/all', authMiddleware, feedbackController.getAllFeedback); // Admin only
router.get('/summary', authMiddleware, feedbackController.getFeedbackSummary); // Admin or lecturer

module.exports = router;
