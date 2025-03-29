const express = require('express');
const router = express.Router();
const systemFeedbackController = require('../controllers/systemFeedback.controller');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Submit system feedback - authenticated users only
router.post('/',authenticate, systemFeedbackController.submitFeedback);

// Get all feedback - admin only
router.get('/all', authenticate, authorize('admin'), systemFeedbackController.getAllFeedback);

// Get user's feedback
router.get('/user', authenticate, systemFeedbackController.getUserFeedback);

// Update feedback status - admin only
router.put('/:id/status', authenticate, authorize('admin'), systemFeedbackController.updateFeedbackStatus);

// Delete feedback - admin only
router.delete('/:id', authenticate, authorize('admin'), systemFeedbackController.deleteFeedback);

module.exports = router;
