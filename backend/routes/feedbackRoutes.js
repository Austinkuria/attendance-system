const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authenticate, feedbackController.submitFeedback);
router.get('/:sessionId', authenticate, feedbackController.getSessionFeedback);

module.exports = router;
