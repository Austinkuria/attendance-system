const express = require('express');
const router = express.Router();
const { login, signup, sendResetLink, resetPassword } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const { getCsrfToken } = require('../middleware/csrfProtection');
const { loginLimiter, signupLimiter, sendResetLinkLimiter, resetPasswordLimiter } = require('../middleware/rateLimiter');

// ===== PUBLIC ROUTES =====

// Get CSRF token for authenticated requests
router.get('/csrf-token', getCsrfToken);

// Authentication routes with rate limiting
router.post('/login', loginLimiter, login);
router.post('/signup', signupLimiter, signup);
router.post('/reset-password', sendResetLinkLimiter, sendResetLink);
router.put('/reset-password/:token', resetPasswordLimiter, resetPassword);

// ===== PROTECTED ROUTES =====

// Validate session (requires authentication)
router.get('/validate-session', authMiddleware, authController.validateSession);

// Refresh access token using refresh token
router.post('/refresh', authController.refreshToken);

// Logout (revoke refresh token)
router.post('/logout', authController.logout);

// Logout from all devices (requires authentication)
router.post('/logout-all', authMiddleware, authController.logoutAll);

module.exports = router;
