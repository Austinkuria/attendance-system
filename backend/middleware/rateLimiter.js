const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased for better UX
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/';
  }
});

// Strict rate limiter for sensitive endpoints (admin operations, bulk actions)
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Stricter limit for sensitive operations
  message: {
    success: false,
    message: 'Too many requests to this endpoint, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.userId || req.ip;
  }
});

// Rate limiter for authenticated users
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Increased for normal usage
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  },
  message: {
    success: false,
    message: 'Too many requests from this account, please try again in an hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for login attempts - prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Strict limit for security
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes."
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts from this IP. Please try again after 15 minutes.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Signup rate limiter - prevent bot registrations
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Very strict for signups
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many signup attempts. Please try again after an hour."
  }
});

// Password reset rate limiter
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset requests. Please try again after an hour."
  }
});

// Email sending rate limiter
const sendResetLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 emails per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by email if provided, otherwise IP
    return req.body?.email || req.ip;
  },
  message: {
    success: false,
    message: "Too many password reset requests. Please try again after an hour."
  }
});

// Email verification resend limiter - prevent abuse
const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Only 3 resend attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by email if provided, otherwise IP
    return req.body?.email || req.ip;
  },
  message: {
    success: false,
    message: "Too many verification email requests. Please wait before requesting another email."
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many verification email requests. Please wait 15 minutes before trying again.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiter for attendance marking - prevent QR code abuse
const attendanceMarkLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  },
  message: {
    success: false,
    message: "Too many attendance marking attempts. Please try again in a minute."
  }
});

// Rate limiter for feedback submissions
const systemFeedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 feedback submissions per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  },
  message: {
    success: false,
    message: "Too many feedback submissions. Please try again later."
  }
});

// Rate limiter for unit feedback
const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 feedback submissions per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  },
  message: {
    success: false,
    message: "Too many feedback submissions. Please try again later."
  }
});

module.exports = {
  apiLimiter,
  sensitiveLimiter,
  authLimiter,
  loginLimiter,
  signupLimiter,
  resetPasswordLimiter,
  sendResetLinkLimiter,
  resendVerificationLimiter,
  attendanceMarkLimiter,
  systemFeedbackLimiter,
  feedbackLimiter
};
