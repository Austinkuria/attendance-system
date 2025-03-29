const express = require('express');
const router = express.Router();
const systemFeedbackController = require('../controllers/systemFeedback.controller');
const { protect, authorize } = require('../middleware/auth');

// Submit system feedback - authenticated users only
router.post('/', protect, systemFeedbackController.submitFeedback);

// Get all feedback - admin only
router.get('/all', protect, authorize('admin'), systemFeedbackController.getAllFeedback);

// Get user's feedback
router.get('/user', protect, systemFeedbackController.getUserFeedback);

// Update feedback status - admin only
router.put('/:id/status', protect, authorize('admin'), systemFeedbackController.updateFeedbackStatus);

// Delete feedback - admin only
router.delete('/:id', protect, authorize('admin'), systemFeedbackController.deleteFeedback);

module.exports = router;
