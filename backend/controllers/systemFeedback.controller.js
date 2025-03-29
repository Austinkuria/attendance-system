const SystemFeedback = require('../models/SystemFeedback');
const User = require('../models/User');

// Submit system feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { title, category, description, severity, screenshot } = req.body;
    const userId = req.user.id;

    // Get user's role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userRole = user.role;

    // Create new feedback
    const feedback = new SystemFeedback({
      userId,
      userRole,
      title,
      category,
      description,
      severity,
      screenshot
    });

    await feedback.save();

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

// Update feedback status (for admins)
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

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
    console.error('Error updating feedback status:', error);
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
