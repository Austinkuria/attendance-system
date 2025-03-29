const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

/**
 * Controller for authentication-related operations
 */
const authController = {
    /**
     * Validate user session
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    validateSession: async (req, res) => {
        try {
            // User object is already set in req by authMiddleware
            const { userId, role } = req.user;

            // Get user details from the unified User model
            const user = await User.findById(userId)
                .select('firstName lastName email regNo role year semester department course')
                .populate('department', 'name')
                .populate('course', 'name code');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Return validated session info
            return res.status(200).json({
                success: true,
                message: "Session is valid",
                user: {
                    id: userId,
                    role: user.role, // Make sure to return user.role, not just role
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    regNo: user.regNo,
                    year: user.year,
                    semester: user.semester,
                    department: user.department,
                    course: user.course
                }
            });
        } catch (error) {
            console.error('Session validation error:', error);
            return res.status(500).json({
                success: false,
                message: "Error validating session",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    /**
     * Refresh the authentication token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    refreshToken: async (req, res) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: "Refresh token is required"
                });
            }

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

            // Check if user exists
            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Generate new access token
            const accessToken = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
            );

            // Generate new refresh token
            const newRefreshToken = jwt.sign(
                { userId: user._id },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
            );

            return res.status(200).json({
                success: true,
                token: accessToken,
                refreshToken: newRefreshToken
            });
        } catch (error) {
            console.error('Token refresh error:', error);

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Refresh token expired. Please log in again."
                });
            }

            return res.status(500).json({
                success: false,
                message: "Error refreshing token",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    /**
     * Log out a user (invalidate tokens)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    logout: async (req, res) => {
        // In a token-based auth system, actual logout happens on client-side
        // by removing the token. Server can implement a token blacklist here
        // if needed for increased security.
        return res.status(200).json({
            success: true,
            message: "Successfully logged out"
        });
    }
};

module.exports = authController;
