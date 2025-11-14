const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { sendResetLink, resetPassword } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const { getCsrfToken } = require('../middleware/csrfProtection');
const {
  loginLimiter,
  sendResetLinkLimiter,
  resetPasswordLimiter,
  resendVerificationLimiter
} = require('../middleware/rateLimiter');

// ===== PUBLIC ROUTES =====

// Get CSRF token for authenticated requests
router.get('/csrf-token', getCsrfToken);

// Login route with validation and rate limiting
router.post('/login',
  loginLimiter,
  [
    check('email').isEmail().withMessage('Valid email is required'),
    check('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

// Password reset routes
router.post('/reset-password', sendResetLinkLimiter, sendResetLink);
router.put('/reset-password/:token', resetPasswordLimiter, resetPassword);

// Email verification routes
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification',
  resendVerificationLimiter,
  [
    check('email').isEmail().withMessage('Valid email is required')
  ],
  authController.resendVerification
);

// ===== PROTECTED ROUTES =====

// Validate session (requires authentication)
router.get('/validate-session', authMiddleware, authController.validateSession);

// Change password (requires authentication)
router.post('/change-password',
  authMiddleware,
  [
    check('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character')
  ],
  authController.changePassword
);

// Refresh access token using refresh token
router.post('/refresh', authController.refreshToken);

// Logout (revoke refresh token)
router.post('/logout', authController.logout);

// Logout from all devices (requires authentication)
router.post('/logout-all', authMiddleware, authController.logoutAll);

module.exports = router;
