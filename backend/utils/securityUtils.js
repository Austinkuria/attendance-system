const { URL } = require('url');
const net = require('net');
const path = require('path');
const fs = require('fs');

/**
 * Escapes special regex characters in user input to prevent ReDoS / RegExp Injection
 * @param {string} string
 * @returns {string} Escaped string safe for new RegExp
 */
const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Validates that an IP address is not within private, loopback, or cloud metadata ranges
 * @param {string} ip
 * @returns {boolean} True if private/loopback/link-local
 */
const isPrivateIp = (ip) => {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 127) return true; // Loopback
    if (parts[0] === 10) return true; // Private
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // Private
    if (parts[0] === 192 && parts[1] === 168) return true; // Private
    if (parts[0] === 169 && parts[1] === 254) return true; // Link-local / Cloud metadata
    if (parts[0] === 0) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
      return true;
    }
    return false;
  }
  return false;
};

/**
 * Validates destination URLs against Server-Side Request Forgery (SSRF)
 * Rejects non-HTTP(S) protocols and loopback / private IP ranges
 * @param {string} urlString
 * @returns {boolean} True if URL is safe to call
 */
const isSafeWebhookUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }
    if (net.isIP(hostname) && isPrivateIp(hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Safely extracts buffer from multer upload file without uncontrolled path traversal
 * @param {Object} file Express multer file
 * @returns {Buffer|null}
 */
const getSafeFileBuffer = (file) => {
  if (!file) return null;
  if (file.buffer && Buffer.isBuffer(file.buffer)) {
    return file.buffer;
  }
  if (file.path && typeof file.path === 'string') {
    const baseName = path.basename(file.path);
    const allowedDir = path.resolve(process.cwd(), 'uploads');
    const safePath = path.resolve(allowedDir, baseName);
    if (safePath.startsWith(allowedDir) && fs.existsSync(safePath)) {
      return fs.readFileSync(safePath);
    }
  }
  return null;
};

/**
 * Safely unlinks a temporary file ensuring path does not escape uploads directory
 * @param {string} filePath
 */
const safeUnlink = (filePath) => {
  if (!filePath || typeof filePath !== 'string') return;
  try {
    const baseName = path.basename(filePath);
    const allowedDir = path.resolve(process.cwd(), 'uploads');
    const safePath = path.resolve(allowedDir, baseName);
    if (safePath.startsWith(allowedDir) && fs.existsSync(safePath)) {
      fs.unlinkSync(safePath);
    }
  } catch (err) {
    // Non-fatal cleanup
  }
};

/**
 * Sanitizes a filename for use in HTTP Content-Disposition headers.
 * Strips path traversal, quotes, control characters, and characters that break HTTP header attributes.
 * @param {string} filename
 * @returns {string} Safe ASCII filename
 */
const sanitizeHeaderFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return 'download';
  const base = path.basename(filename);
  const noQuotes = base.replace(/"/g, '').replace(/'/g, '').replace(/\\/g, '');
  const sanitized = noQuotes.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_');
  return sanitized.replace(/"/g, '') || 'download';
};

module.exports = {
  escapeRegex,
  isSafeWebhookUrl,
  getSafeFileBuffer,
  safeUnlink,
  sanitizeHeaderFilename
};
