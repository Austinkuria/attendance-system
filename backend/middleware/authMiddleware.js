const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getAuthToken } = require('../utils/authUtils');
require('dotenv').config();

/**
 * Authentication middleware
 * Checks for JWT in cookies (primary) or Authorization header (fallback)
 * Automatically refreshes token if it's about to expire
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from cookies or headers
    const token = getAuthToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided"
      });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists and is active
      const user = await User.findById(decoded.userId).select('_id role email isActive');
      
      if (!user || user.isActive === false) {
        return res.status(401).json({
          success: false,
          message: "User account is inactive or deleted"
        });
      }

      // Add user info to request object
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };

      // Check if token is about to expire (within 30 minutes)
      const tokenAge = Date.now() / 1000 - decoded.iat;
      const TOKEN_LIFETIME = 4 * 60 * 60; // 4 hours in seconds
      
      if (tokenAge > TOKEN_LIFETIME * 0.875) {
        // Token is 87.5% through its lifetime, suggest refresh
        res.setHeader('X-Token-Refresh-Suggested', 'true');
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: "Token expired. Please refresh your session or login again.",
          code: 'TOKEN_EXPIRED'
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
          code: 'INVALID_TOKEN'
        });
      }

      return res.status(401).json({
        success: false,
        message: "Authentication failed"
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: "Authentication error"
    });
  }
};

/**
 * Optional authentication middleware
 * Does not fail if no token provided, but validates if one exists
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = getAuthToken(req);

    if (!token) {
      // No token provided, continue without authentication
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      // Invalid token, but don't fail - just continue without auth
      console.warn('Optional auth - invalid token:', error.message);
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = authenticate;
module.exports.optionalAuthenticate = optionalAuthenticate;