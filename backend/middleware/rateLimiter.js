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
  max: 20, // Limit each IP to 20 requests per windowMs
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

module.exports = {
  apiLimiter,
  sensitiveLimiter,
  authLimiter
};
