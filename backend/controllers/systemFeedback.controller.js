const SystemFeedback = require('../models/SystemFeedback');
const logger = require('../utils/logger');

exports.submitSystemFeedback = async (req, res) => {
    try {
        const { category, title, description, severity, screenshot } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        if (!category || !title || !description || !severity) {
            return res.status(400).json({
                success: false,
                message: 'Category, title, description, and severity are required fields'
            });
        }

        const systemFeedback = new SystemFeedback({
            userId,
            userRole,
            category,
            title,
            description,
            severity,
            screenshot: screenshot || null
        });

        await systemFeedback.save();

        logger.info(`System feedback submitted by user ${userId} with category ${category}`);

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback: systemFeedback
        });
    } catch (error) {
        logger.error(`Error submitting system feedback: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error submitting feedback',
            error: error.message
        });
    }
};

exports.getSystemFeedback = async (req, res) => {
    try {
        // Only admins can view all feedback
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Only administrators can view all system feedback'
            });
        }

        const feedback = await SystemFeedback.find()
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.status(200).json(feedback);
    } catch (error) {
        logger.error(`Error retrieving system feedback: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error retrieving feedback',
            error: error.message
        });
    }
};

exports.getUserSystemFeedback = async (req, res) => {
    try {
        const userId = req.user.userId;

        const feedback = await SystemFeedback.find({ userId })
            .sort({ createdAt: -1 });

        res.status(200).json(feedback);
    } catch (error) {
        logger.error(`Error retrieving user system feedback: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error retrieving your feedback',
            error: error.message
        });
    }
};

exports.updateFeedbackStatus = async (req, res) => {
    try {
        // Only admins can update feedback status
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Only administrators can update feedback status'
            });
        }

        const { feedbackId } = req.params;
        const { status } = req.body;

        const validStatuses = ['New', 'Under Review', 'In Progress', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const feedback = await SystemFeedback.findByIdAndUpdate(
            feedbackId,
            { status, updatedAt: new Date() },
            { new: true }
        );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Feedback status updated successfully',
            feedback
        });
    } catch (error) {
        logger.error(`Error updating feedback status: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error updating feedback status',
            error: error.message
        });
    }
};
