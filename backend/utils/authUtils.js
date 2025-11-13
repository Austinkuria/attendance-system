const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

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
 * Generate access token (short-lived)
 */
const generateAccessToken = (user) => {
  const payload = {
    userId: user._id || user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '4h', // 4 hours
    issuer: 'attendance-system',
    audience: 'attendance-app'
  });
};

/**
 * Generate refresh token (long-lived)
 */
const generateRefreshToken = async (user, ipAddress) => {
  // Generate random token
  const token = crypto.randomBytes(64).toString('hex');
  
  // Create refresh token document
  const refreshToken = new RefreshToken({
    token,
    user: user._id || user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    createdByIp: ipAddress
  });

  await refreshToken.save();
  
  return token;
};

/**
 * Verify and refresh access token using refresh token
 */
const refreshAccessToken = async (refreshTokenString, ipAddress) => {
  const refreshToken = await RefreshToken.findOne({ 
    token: refreshTokenString 
  }).populate('user');

  if (!refreshToken || !refreshToken.isValid) {
    throw new Error('Invalid refresh token');
  }

  // Revoke old refresh token
  refreshToken.revoke(ipAddress);
  await refreshToken.save();

  // Generate new tokens
  const newAccessToken = generateAccessToken(refreshToken.user);
  const newRefreshToken = await generateRefreshToken(refreshToken.user, ipAddress);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: refreshToken.user
  };
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
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  // Set access token cookie (4 hours)
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 4 * 60 * 60 * 1000 // 4 hours
  });

  // Set refresh token cookie (7 days)
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
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
  generateAccessToken,
  generateRefreshToken,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  setAuthCookies,
  clearAuthCookies
};