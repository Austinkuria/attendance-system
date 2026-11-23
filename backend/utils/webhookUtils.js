const crypto = require('crypto');
const axios = require('axios');
const logger = require('./logger');
const { isSafeWebhookUrl } = require('./securityUtils');

/**
 * Signs a webhook payload using HMAC-SHA256
 * @param {Object|string} payload
 * @param {string} secret
 * @returns {string} Hex-encoded HMAC signature prefixed with sha256=
 */
const signPayload = (payload, secret) => {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return `sha256=${hmac.digest('hex')}`;
};

/**
 * Verifies a webhook signature using timing-safe comparison
 * @param {Object|string} payload
 * @param {string} signature
 * @param {string} secret
 * @returns {boolean}
 */
const verifyWebhookSignature = (payload, signature, secret) => {
  if (!signature || !secret) return false;
  try {
    const expected = signPayload(payload, secret);
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (err) {
    logger.error('Webhook signature verification error:', err);
    return false;
  }
};

/**
 * Dispatches an outbound webhook event with signed HMAC header
 * @param {string} event e.g., 'session.closed' | 'attendance.threshold_breached'
 * @param {Object} data event payload
 * @param {string} destinationUrl webhook endpoint
 * @param {string} secret shared secret for signing
 */
const dispatchWebhook = async (event, data, destinationUrl, secret) => {
  if (!destinationUrl) return null;

  if (!isSafeWebhookUrl(destinationUrl)) {
    logger.warn(`Webhook dispatch blocked to unsafe destination URL: ${destinationUrl}`);
    return { success: false, error: 'Destination URL rejected by security policy' };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const payload = {
    id: `evt_${crypto.randomBytes(8).toString('hex')}`,
    event,
    timestamp,
    data
  };

  const payloadString = JSON.stringify(payload);
  const signature = signPayload(payloadString, secret || process.env.WEBHOOK_SECRET || 'qrollcall-webhook-secret');

  try {
    const response = await axios.post(destinationUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-QRollCall-Event': event,
        'X-QRollCall-Timestamp': timestamp.toString(),
        'X-QRollCall-Signature': signature,
        'User-Agent': 'QRollCall-Webhook-Dispatcher/1.0'
      },
      timeout: 8000
    });

    logger.info(`Webhook event [${event}] dispatched to ${destinationUrl}. HTTP ${response.status}`);
    return { success: true, status: response.status };
  } catch (err) {
    logger.error(`Failed to dispatch webhook [${event}] to ${destinationUrl}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  signPayload,
  verifyWebhookSignature,
  dispatchWebhook
};
