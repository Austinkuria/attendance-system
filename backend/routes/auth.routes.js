const express = require('express');
const router = express.Router();
const { login, signup, sendResetLink, resetPassword } = require('../controllers/userController');
const { loginLimiter } = require('../middleware/rateLimiter');

// Apply rate limiter to login route
router.post('/login', loginLimiter, login);
router.post('/signup', signup);
router.post('/send-reset-link', loginLimiter, sendResetLink);
router.post('/reset-password', loginLimiter, resetPassword);

module.exports = router;
