/**
 * Honeypot Auto-Ban Security Middleware
 * Enforces Section 7.2 of the Security Contract:
 * Traps malicious crawlers, exploit scanners, and unauthorized probes
 * on deceptive routes and imposes an automatic 2-hour IP strike ban.
 */

const BAN_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
const bannedIPs = new Map(); // IP -> expiration timestamp

// Deceptive trap routes targeting automated scanners
const HONEYPOT_TRAP_ROUTES = [
  '/.env',
  '/.git',
  '/wp-admin',
  '/wp-login.php',
  '/xmlrpc.php',
  '/phpmyadmin',
  '/_ignition/health-check',
  '/actuator/health',
  '/admin/config.php',
  '/shell.php',
  '/eval-stdin.php',
  '/config.json',
  '/backup.sql',
  '/db.sql'
];

/**
 * Honeypot ban check & trap middleware
 */
function honeypotBanMiddleware(req, res, next) {
  // Extract client IP (respecting trust proxy)
  const clientIp = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim();

  // 1. Check if IP is currently under a 2-hour strike ban
  if (clientIp && bannedIPs.has(clientIp)) {
    const banExpires = bannedIPs.get(clientIp);
    if (Date.now() < banExpires) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: IP temporarily restricted due to suspicious activity'
      });
    } else {
      // Ban expired, remove entry
      bannedIPs.delete(clientIp);
    }
  }

  // 2. Check if request targets a deceptive honeypot trap route
  const currentPath = (req.path || '').toLowerCase();
  const isTrap = HONEYPOT_TRAP_ROUTES.some(trap => currentPath === trap || currentPath.startsWith(trap + '/'));

  if (isTrap) {
    if (clientIp) {
      const banExpiresAt = Date.now() + BAN_DURATION_MS;
      bannedIPs.set(clientIp, banExpiresAt);
      console.warn(`[HONEYPOT TRIGGERED] Malicious probe '${req.path}' from IP: ${clientIp}. Imposed 2-hour strike ban until ${new Date(banExpiresAt).toISOString()}`);
    }
    return res.status(403).json({
      success: false,
      message: 'Forbidden'
    });
  }

  // 3. Check for form submission honeypot field
  if (req.body && typeof req.body === 'object' && req.body.hp_auth_trap) {
    if (clientIp) {
      bannedIPs.set(clientIp, Date.now() + BAN_DURATION_MS);
      console.warn(`[HONEYPOT FORM TRIGGERED] Bot populated honeypot trap field from IP: ${clientIp}. 2-hour ban enforced.`);
    }
    // Return generic success to avoid tipping off automated script
    return res.status(200).json({
      success: true,
      message: 'Request received'
    });
  }

  next();
}

/**
 * Helper to inspect active bans (for administrative diagnostics)
 */
function getActiveBans() {
  const now = Date.now();
  const active = [];
  for (const [ip, expires] of bannedIPs.entries()) {
    if (expires > now) {
      active.push({ ip, expires: new Date(expires).toISOString() });
    } else {
      bannedIPs.delete(ip);
    }
  }
  return active;
}

module.exports = {
  honeypotBanMiddleware,
  getActiveBans
};
