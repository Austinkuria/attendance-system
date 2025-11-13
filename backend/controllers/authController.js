const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { validationResult } = require('express-validator');
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
     * LOGIN - Universal login for all roles
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    login: async (req, res) => {
        const { email, password } = req.body;

        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        try {
            // Find user and populate necessary fields
            const user = await User.findOne({ email, isActive: true })
                .populate('department', 'name code')
                .populate('course', 'name code')
                .select('+password');

            if (!user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid email or password' 
                });
            }

            // Check if account is locked
            if (user.isLocked) {
                const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
                return res.status(423).json({
                    success: false,
                    message: `Account is locked. Please try again in ${lockTime} minutes.`,
                    lockUntil: user.lockUntil
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (!isPasswordValid) {
                await user.incLoginAttempts();
                
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid email or password',
                    attemptsRemaining: Math.max(5 - (user.loginAttempts + 1), 0)
                });
            }

            // Check if password must be changed
            if (user.mustChangePassword) {
                // Generate temporary token for password change (15 min expiry)
                const tempToken = jwt.sign(
                    { userId: user._id, email: user.email, role: user.role, temporary: true },
                    process.env.JWT_SECRET,
                    { expiresIn: '15m' }
                );
                
                return res.json({
                    success: true,
                    requiresPasswordChange: true,
                    message: 'You must change your password before continuing',
                    tempToken,
                    user: {
                        id: user._id,
                        email: user.email,
                        role: user.role
                    }
                });
            }

            // Role-specific validations for students
            if (user.role === 'student') {
                if (!user.course || !user.department) {
                    return res.status(403).json({
                        success: false,
                        message: 'Your account is incomplete. Please contact administration.',
                        accountStatus: 'incomplete'
                    });
                }
            }

            // Reset login attempts on successful login
            await user.resetLoginAttempts();

            // Get client IP
            const ipAddress = req.ip || req.connection.remoteAddress;

            // Generate tokens
            const accessToken = generateAccessToken(user);
            const refreshToken = await generateRefreshToken(user, ipAddress);

            // Set httpOnly cookies
            setAuthCookies(res, accessToken, refreshToken);

            // Return success with user data
            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    isSuperAdmin: user.isSuperAdmin || false,
                    department: user.department,
                    course: user.course,
                    regNo: user.regNo,
                    year: user.year,
                    semester: user.semester,
                    lastLogin: user.lastLogin
                },
                accessToken // Also send in response body for compatibility
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                success: false,
                message: 'An error occurred during login',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    /**
     * CHANGE PASSWORD - Force or voluntary
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    changePassword: async (req, res) => {
        const { currentPassword, newPassword } = req.body;

        try {
            const user = await User.findById(req.user.userId).select('+password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // If not forcing password change, verify current password
            if (!user.mustChangePassword) {
                if (!currentPassword) {
                    return res.status(400).json({
                        success: false,
                        message: 'Current password is required'
                    });
                }

                const isValid = await bcrypt.compare(currentPassword, user.password);
                
                if (!isValid) {
                    return res.status(401).json({
                        success: false,
                        message: 'Current password is incorrect'
                    });
                }
            }

            // Validate new password strength
            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long'
                });
            }

            // Check if new password is same as current
            if (currentPassword && currentPassword === newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be different from current password'
                });
            }

            // Hash and save new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            user.mustChangePassword = false;
            user.passwordChangedAt = new Date();
            await user.save();

            // Get client IP
            const ipAddress = req.ip || req.connection.remoteAddress;

            // Generate new tokens
            const accessToken = generateAccessToken(user);
            const refreshToken = await generateRefreshToken(user, ipAddress);
            setAuthCookies(res, accessToken, refreshToken);

            res.json({
                success: true,
                message: 'Password changed successfully',
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    mustChangePassword: false
                }
            });

        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change password',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

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
