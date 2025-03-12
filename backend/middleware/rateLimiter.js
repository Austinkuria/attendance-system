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
  max: 10, // Limit each IP to 10 login requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  message: {
    status: 429,
    message: "Too many login attempts. Please try again after 15 minutes."
  }
});

// Rate limiter for attendance marking
const attendanceMarkLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  standardHeaders: true,
  message: {
    status: 429,
    message: "Too many attendance marking attempts. Please try again in a minute."
  }
});

module.exports = {
  apiLimiter,
  sensitiveLimiter,
  authLimiter,
  loginLimiter,
  attendanceMarkLimiter
};
