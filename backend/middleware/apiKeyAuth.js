const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Scoped API Key Authentication Middleware for SIS, LMS, and External ERP Integrations.
 * Validates header 'X-API-Key' using constant-time string comparison.
 */
const requireApiKey = (req, res, next) => {
  const providedKey = req.headers['x-api-key'] || req.headers['x-integration-key'];

  // Configured integration key in environment, with secure fallback in non-production
  const configuredKey = process.env.INTEGRATION_API_KEY;

  if (!providedKey) {
    return res.status(401).json({
      success: false,
      code: 'API_KEY_REQUIRED',
      message: 'Integration API key required in header: X-API-Key'
    });
  }

  if (!configuredKey) {
    logger.warn('INTEGRATION_API_KEY not configured in environment.');
    // In dev / test, allow a designated local key if none configured
    if (process.env.NODE_ENV !== 'production' && providedKey === 'qrollcall-local-integration-key') {
      req.integrationClient = { name: 'local_dev_sis', scopes: ['roster:sync', 'attendance:read', 'webhooks:manage'] };
      return next();
    }
    return res.status(500).json({
      success: false,
      message: 'Integration API is not properly configured on this server.'
    });
  }

  // Timing-safe comparison to prevent timing attacks
  const keyBuffer = Buffer.from(providedKey);
  const targetBuffer = Buffer.from(configuredKey);

  if (keyBuffer.length !== targetBuffer.length || !crypto.timingSafeEqual(keyBuffer, targetBuffer)) {
    return res.status(403).json({
      success: false,
      code: 'INVALID_API_KEY',
      message: 'Invalid or revoked integration API key'
    });
  }

  req.integrationClient = {
    name: 'authorized_sis_partner',
    scopes: ['roster:sync', 'attendance:read', 'webhooks:manage'],
    authenticatedAt: new Date()
  };

  next();
};

module.exports = {
  requireApiKey
};
