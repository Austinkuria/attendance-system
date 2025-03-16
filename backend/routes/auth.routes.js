const express = require('express');
const router = express.Router();
const { login, signup, sendResetLink, resetPassword } = require('../controllers/userController');
const { loginLimiter,  signupLimiter,sendResetLinkLimiter,resetPasswordLimiter } = require('../middleware/rateLimiter');

// Apply rate limiter to login route
router.post('/login', loginLimiter, login);
router.post('/signup', signup, signupLimiter);
router.post('/send-reset-link', sendResetLinkLimiter, sendResetLink);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

module.exports = router;
