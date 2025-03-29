const express = require('express');
const router = express.Router();
const systemFeedbackController = require('../controllers/systemFeedback.controller');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

router.post('/submit', systemFeedbackController.submitSystemFeedback);
router.get('/user', systemFeedbackController.getUserSystemFeedback);
router.get('/all', systemFeedbackController.getSystemFeedback);
router.put('/:feedbackId/status', systemFeedbackController.updateFeedbackStatus);

module.exports = router;
