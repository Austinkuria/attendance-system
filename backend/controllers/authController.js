const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { 
    generateAccessToken, 
    generateRefreshToken, 
    refreshAccessToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    setAuthCookies,
    clearAuthCookies 
} = require('../utils/authUtils');
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
                    role: user.role,
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
     * Refresh the authentication token using refresh token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    refreshToken: async (req, res) => {
        try {
            // Get refresh token from cookie
            const refreshTokenString = req.cookies?.refreshToken;

            if (!refreshTokenString) {
                return res.status(401).json({
                    success: false,
                    message: "No refresh token provided"
                });
            }

            // Get client IP
            const ipAddress = req.ip || req.connection.remoteAddress;

            // Refresh the access token
            const { accessToken, refreshToken: newRefreshToken, user } = 
                await refreshAccessToken(refreshTokenString, ipAddress);

            // Set new cookies
            setAuthCookies(res, accessToken, newRefreshToken);

            return res.status(200).json({
                success: true,
                message: "Token refreshed successfully",
                user: {
                    id: user._id,
                    role: user.role,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName
                }
            });
        } catch (error) {
            console.error('Token refresh error:', error);

            // Clear invalid cookies
            clearAuthCookies(res);

            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token. Please log in again.",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    /**
     * Log out a user (revoke refresh tokens and clear cookies)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    logout: async (req, res) => {
        try {
            const refreshTokenString = req.cookies?.refreshToken;
            const ipAddress = req.ip || req.connection.remoteAddress;

            // Revoke refresh token if it exists
            if (refreshTokenString) {
                try {
                    await revokeRefreshToken(refreshTokenString, ipAddress);
                } catch (error) {
                    // Token might already be invalid, continue with logout
                    console.error('Error revoking refresh token:', error.message);
                }
            }

            // Clear authentication cookies
            clearAuthCookies(res);

            return res.status(200).json({
                success: true,
                message: "Successfully logged out"
            });
        } catch (error) {
            console.error('Logout error:', error);
            
            // Still clear cookies even if there's an error
            clearAuthCookies(res);

            return res.status(500).json({
                success: false,
                message: "Error during logout",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    /**
     * Log out from all devices (revoke all refresh tokens)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    logoutAll: async (req, res) => {
        try {
            const { userId } = req.user;
            const ipAddress = req.ip || req.connection.remoteAddress;

            // Revoke all refresh tokens for this user
            await revokeAllUserTokens(userId, ipAddress);

            // Clear cookies on current device
            clearAuthCookies(res);

            return res.status(200).json({
                success: true,
                message: "Successfully logged out from all devices"
            });
        } catch (error) {
            console.error('Logout all error:', error);

            return res.status(500).json({
                success: false,
                message: "Error during logout",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = authController;
