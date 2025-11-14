const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

// Ensure environment variables are loaded
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set!');
  throw new Error('JWT_SECRET is required');
}

// Token expiry constants from environment or defaults
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * Extract token from Authorization header
 */
const getTokenFromHeaders = (req) => {
  const authHeader = req.header("Authorization");
  return authHeader?.split(" ")[1]; // Extract the token from "Bearer <token>"
};

/**
 * Extract token from cookies
 */
const getTokenFromCookies = (req) => {
  return req.cookies?.accessToken;
};

/**
 * Get authentication token from request (cookies first, then headers)
 */
const getAuthToken = (req) => {
  return getTokenFromCookies(req) || getTokenFromHeaders(req);
};

/**
 * Get refresh token from request (cookies first, then body)
 */
const getRefreshToken = (req) => {
  return req.cookies?.refreshToken || req.body?.refreshToken;
};

/**
 * Generate access token (short-lived)
 */
const generateAccessToken = (user) => {
  const payload = {
    userId: user._id || user.id,
    email: user.email,
    role: user.role,
    type: 'access'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'attendance-system',
    audience: 'attendance-app'
  });
};

/**
 * Generate refresh token (long-lived) - Using JWT instead of random bytes
 */
const generateRefreshToken = async (user, ipAddress) => {
  try {
    // Generate JWT refresh token
    const jwtToken = jwt.sign(
      {
        userId: user._id || user.id,
        type: 'refresh',
        jti: crypto.randomBytes(16).toString('hex') // JWT ID for uniqueness
      },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRY,
        issuer: 'attendance-system',
        audience: 'attendance-app'
      }
    );

    // Decode to get expiry time
    const decoded = jwt.decode(jwtToken);

    if (!decoded || !decoded.exp) {
      throw new Error('Failed to decode refresh token');
    }

    // Create refresh token document for tracking
    const refreshToken = new RefreshToken({
      token: jwtToken,
      user: user._id || user.id,
      expiresAt: new Date(decoded.exp * 1000),
      createdByIp: ipAddress
    });

    await refreshToken.save();

    return jwtToken;
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw error;
  }
};

/**
 * Verify and refresh access token using refresh token
 */
const refreshAccessToken = async (refreshTokenString, ipAddress) => {
  try {
    // Verify the JWT refresh token
    const decoded = jwt.verify(
      refreshTokenString,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    );

    // Check if it's a refresh token type
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Find the refresh token in database
    const refreshToken = await RefreshToken.findOne({
      token: refreshTokenString,
      isActive: true
    }).populate('user');

    if (!refreshToken) {
      throw new Error('Refresh token not found or revoked');
    }

    // Check if token is expired or invalid
    if (!refreshToken.isValid) {
      throw new Error('Refresh token is expired or invalid');
    }

    // Check if user still exists and is active
    if (!refreshToken.user || refreshToken.user.isActive === false) {
      throw new Error('User not found or inactive');
    }

    // Revoke old refresh token (token rotation)
    refreshToken.revoke(ipAddress, 'rotated');
    await refreshToken.save();

    // Generate new tokens
    const newAccessToken = generateAccessToken(refreshToken.user);
    const newRefreshToken = await generateRefreshToken(refreshToken.user, ipAddress);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: refreshToken.user
    };
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Revoke refresh token
 */
const revokeRefreshToken = async (refreshTokenString, ipAddress) => {
  const refreshToken = await RefreshToken.findOne({ token: refreshTokenString });

  if (!refreshToken || !refreshToken.isActive) {
    throw new Error('Invalid refresh token');
  }

  refreshToken.revoke(ipAddress);
  await refreshToken.save();
};

/**
 * Revoke all refresh tokens for a user
 */
const revokeAllUserTokens = async (userId, ipAddress) => {
  const tokens = await RefreshToken.find({
    user: userId,
    isActive: true
  });

  for (const token of tokens) {
    token.revoke(ipAddress);
    await token.save();
  }
};

/**
 * Set authentication cookies
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  if (!accessToken || !refreshToken) {
    console.error('Cannot set auth cookies: tokens are missing');
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site in production
    path: '/'
  };

  try {
    // Decode tokens to get expiry
    const accessDecoded = jwt.decode(accessToken);
    const refreshDecoded = jwt.decode(refreshToken);

    if (!accessDecoded || !refreshDecoded) {
      console.error('Failed to decode tokens');
      return;
    }

    // Set access token cookie
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: (accessDecoded.exp - accessDecoded.iat) * 1000 // Convert to milliseconds
    });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: (refreshDecoded.exp - refreshDecoded.iat) * 1000 // Convert to milliseconds
    });
  } catch (error) {
    console.error('Error setting auth cookies:', error);
  }
};

/**
 * Clear authentication cookies
 */
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('XSRF-TOKEN');
};

module.exports = {
  getTokenFromHeaders,
  getTokenFromCookies,
  getAuthToken,
  getRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  setAuthCookies,
  clearAuthCookies
};