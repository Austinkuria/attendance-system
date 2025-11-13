const crypto = require('crypto');

/**
 * Modern CSRF Protection Middleware
 * Uses double-submit cookie pattern with encrypted tokens
 */

// Generate a secure CSRF token
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Middleware to generate and set CSRF token
const setCsrfToken = (req, res, next) => {
  // Generate a new CSRF token
  const csrfToken = generateCsrfToken();
  
  // Set CSRF token in a cookie
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false, // Must be readable by JavaScript for client to send in headers
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 4 * 60 * 60 * 1000 // 4 hours
  });
  
  // Also set in request for immediate use
  req.csrfToken = csrfToken;
  
  next();
};

// Middleware to verify CSRF token
const verifyCsrfToken = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Get token from cookie
  const cookieToken = req.cookies['XSRF-TOKEN'];
  
  // Get token from header (sent by client)
  const headerToken = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];
  
  // Verify both tokens exist and match
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }
  
  next();
};

// Endpoint to get CSRF token
const getCsrfToken = (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken || req.cookies['XSRF-TOKEN']
  });
};

module.exports = {
  generateCsrfToken,
  setCsrfToken,
  verifyCsrfToken,
  getCsrfToken
};
