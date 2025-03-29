const SystemFeedback = require('../models/SystemFeedback');
const User = require('../models/User');

// Submit system feedback
exports.submitFeedback = async (req, res) => {
  try {
    console.log('submitFeedback called with body:', req.body);
    const { title, category, description, severity, screenshot } = req.body;

    // Validate required fields
    if (!title || !category || !description || !severity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, category, description, and severity are required'
      });
    }

    // Get user ID from the authenticated request
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or user ID missing'
      });
    }

    // Get user's role from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create new feedback
    const feedback = new SystemFeedback({
      userId,
      userRole: user.role,
      title,
      category,
      description,
      severity,
      screenshot,
      status: 'New' // Default status
    });

    await feedback.save();
    console.log('Feedback saved:', feedback);

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Error submitting system feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

// Get all feedback (for admins)
exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await SystemFeedback.find()
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return res.status(200).json(feedback);
  } catch (error) {
    console.error('Error fetching system feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Get feedback for a specific user
exports.getUserFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const feedback = await SystemFeedback.find({ userId })
      .sort({ createdAt: -1 });

    return res.status(200).json(feedback);
  } catch (error) {
    console.error('Error fetching user system feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user feedback',
      error: error.message
    });
  }
};

// Update feedback status (for admins) - ensure this name matches what's used in routes
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status field is required'
      });
    }

    const feedback = await SystemFeedback.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback
    });
  } catch (error) {
    logger.error('Error updating feedback status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update feedback status',
      error: error.message
    });
  }
};

// Delete feedback (admin only)
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await SystemFeedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message
    });
  }
};
