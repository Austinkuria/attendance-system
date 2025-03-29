const express = require('express');
const router = express.Router();
const { login, signup, sendResetLink, resetPassword } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const { apiLimiter, loginLimiter, signupLimiter, sendResetLinkLimiter, resetPasswordLimiter } = require('../middleware/rateLimiter');

// Apply rate limiters to auth routes
router.post('/login', loginLimiter, login);
router.post('/signup', signupLimiter, signup);
router.post('/reset-password', sendResetLinkLimiter, sendResetLink);
router.put('/reset-password/:token', resetPasswordLimiter, resetPassword);

// Add validate session route - make sure it's a GET request
router.get('/validate-session', authMiddleware, authController.validateSession);

// Add refresh token route
router.post('/refresh', apiLimiter, authController.refreshToken);

// Add logout route
router.post('/logout', authController.logout);

module.exports = router;
