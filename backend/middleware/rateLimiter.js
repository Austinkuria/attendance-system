const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  headers: true
});

// Strict rate limiter for sensitive endpoints
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Allow 100 requests per 15 minutes
  message: 'Too many requests to this endpoint, please try again later',
  headers: true
});

// Rate limiter for authenticated users
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // Limit each user to 500 requests per hour
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  },
  message: 'Too many requests from this account, please try again in an hour',
  headers: true
});

// Rate limiter for login attempts - prevent brute force attacks
// This also improves performance by preventing excessive login requests
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 10 login requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  message: {
    status: 429,
    message: "Too many login attempts. Please try again after 15 minutes."
  }
});

// signupLimiter: rate limiter for signup attempts
// This prevents bots from spamming signup requests
// It also prevents excessive resource usage from attackers
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 5 signup requests per window
  standardHeaders: true,
  message: {
    status: 429,
    message: "Too many signup attempts. Please try again after an hour."
  }
});

// resetPasswordLimiter: rate limiter for password reset requests
// This prevents attackers from spamming password reset emails
// It also prevents excessive resource usage from attackers
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 5 password reset requests per window
  standardHeaders: true,
  message: {
    status: 429,
    message: "Too many password reset requests. Please try again after an hour."
  }
});

// sendResetLinkLimiter: rate limiter for sending password reset emails
// This prevents attackers from spamming password reset emails
// It also prevents excessive resource usage from attackers
const sendResetLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 5 password reset requests per window
  standardHeaders: true,
  message: {
    status: 429,
    message: "Too many password reset requests. Please try again after an hour."
  }
});

// Rate limiter for attendance marking
const attendanceMarkLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 5 requests per minute
  standardHeaders: true,
  message: {
    status: 429,
    message: "Too many attendance marking attempts. Please try again in a minute."
  }
});

// Rate limiter: maximum of 100 requests per 15 minutes
const systemFeedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Rate limiter: maximum of 100 requests per 15 minutes
const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

module.exports = {
  apiLimiter,
  sensitiveLimiter,
  authLimiter,
  loginLimiter,
  signupLimiter,
  resetPasswordLimiter,
  sendResetLinkLimiter,
  attendanceMarkLimiter,
  systemFeedbackLimiter,
  feedbackLimiter
};
