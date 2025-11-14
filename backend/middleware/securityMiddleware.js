/**
 * Additional Security Middleware
 * Provides extra layers of security beyond helmet and rate limiting
 */

const crypto = require('crypto');

/**
 * Generate nonce for Content Security Policy
 * Use this in views/templates for inline scripts
 */
const generateNonce = (req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
};

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous HTML/script tags
 */
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                // Remove script tags and event handlers
                req.body[key] = req.body[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
                    .replace(/javascript:/gi, '');
            }
        });
    }
    next();
};

/**
 * Validate request origin to prevent CSRF attacks
 * Works alongside CSRF tokens
 */
const validateOrigin = (allowedOrigins) => {
    return (req, res, next) => {
        const origin = req.get('origin') || req.get('referer');

        // Skip for same-origin requests
        if (!origin) {
            return next();
        }

        // Check if origin is allowed
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                return origin.includes(allowed);
            }
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return false;
        });

        if (isAllowed) {
            return next();
        }

        // Log suspicious request
        console.warn(`Blocked request from unauthorized origin: ${origin}`);

        return res.status(403).json({
            success: false,
            message: 'Request from unauthorized origin'
        });
    };
};

/**
 * Prevent parameter pollution attacks
 * Ensures array parameters are properly formatted
 */
const preventParameterPollution = (req, res, next) => {
    // List of parameters that should always be arrays
    const arrayParams = ['roles', 'permissions', 'ids'];

    // List of parameters that should never be arrays
    const singleParams = ['email', 'password', 'username', 'token'];

    if (req.query) {
        // Ensure array params are arrays
        arrayParams.forEach(param => {
            if (req.query[param] && !Array.isArray(req.query[param])) {
                req.query[param] = [req.query[param]];
            }
        });

        // Ensure single params are strings
        singleParams.forEach(param => {
            if (Array.isArray(req.query[param])) {
                req.query[param] = req.query[param][0];
            }
        });
    }

    next();
};

/**
 * Detect and block SQL injection attempts
 * Basic protection - use parameterized queries as primary defense
 */
const detectSQLInjection = (req, res, next) => {
    const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)|(-{2})|\/\*|\*\//gi;

    const checkValue = (value) => {
        if (typeof value === 'string' && sqlPattern.test(value)) {
            return true;
        }
        return false;
    };

    // Check query parameters
    if (req.query) {
        for (const key in req.query) {
            if (checkValue(req.query[key])) {
                console.warn(`Potential SQL injection attempt detected in query: ${key}`);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid request parameters'
                });
            }
        }
    }

    // Check body parameters (excluding passwords which might contain special chars)
    if (req.body) {
        for (const key in req.body) {
            if (key !== 'password' && checkValue(req.body[key])) {
                console.warn(`Potential SQL injection attempt detected in body: ${key}`);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid request data'
                });
            }
        }
    }

    next();
};

/**
 * Add security headers for additional protection
 */
const additionalSecurityHeaders = (req, res, next) => {
    // Prevent browsers from performing MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable browser's XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Control DNS prefetching
    res.setHeader('X-DNS-Prefetch-Control', 'off');

    // Disable client-side caching for sensitive routes
    if (req.path.includes('/api/auth') || req.path.includes('/api/admin')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }

    next();
};

/**
 * Monitor and log suspicious activity
 */
const activityMonitor = (req, res, next) => {
    const suspiciousPatterns = [
        // Common attack patterns
        /\.\.\//g,  // Path traversal
        /%00/g,     // Null byte injection
        /\.\./g,    // Directory traversal
        /<\?php/gi, // PHP injection
        /eval\(/gi, // Code execution
        /exec\(/gi, // Command execution
    ];

    const requestData = JSON.stringify({
        query: req.query,
        body: req.body,
        params: req.params
    });

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(requestData)) {
            console.warn('Suspicious activity detected:', {
                ip: req.ip,
                path: req.path,
                method: req.method,
                userAgent: req.get('user-agent'),
                timestamp: new Date().toISOString()
            });
            break;
        }
    }

    next();
};

/**
 * Enforce HTTPS in production
 */
const enforceHTTPS = (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure) {
        // Redirect to HTTPS
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
};

/**
 * Limit payload size for specific routes
 */
const payloadSizeLimit = (maxSize) => {
    return (req, res, next) => {
        const contentLength = parseInt(req.get('content-length') || '0');

        if (contentLength > maxSize) {
            return res.status(413).json({
                success: false,
                message: `Payload too large. Maximum size is ${maxSize / (1024 * 1024)}MB`
            });
        }

        next();
    };
};

/**
 * Validate JWT token format (basic validation)
 */
const validateTokenFormat = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        // Basic JWT format validation (header.payload.signature)
        const parts = token.split('.');
        if (parts.length !== 3) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format'
            });
        }
    }

    next();
};

/**
 * Track failed authentication attempts
 * Can be used with rate limiting for additional security
 */
const failedLoginTracker = {};

const trackFailedLogin = (identifier) => {
    if (!failedLoginTracker[identifier]) {
        failedLoginTracker[identifier] = {
            count: 0,
            firstAttempt: Date.now(),
            lastAttempt: Date.now()
        };
    }

    failedLoginTracker[identifier].count++;
    failedLoginTracker[identifier].lastAttempt = Date.now();

    // Clear old entries after 1 hour
    if (Date.now() - failedLoginTracker[identifier].firstAttempt > 3600000) {
        delete failedLoginTracker[identifier];
    }

    return failedLoginTracker[identifier];
};

const resetFailedLogin = (identifier) => {
    delete failedLoginTracker[identifier];
};

const getFailedLoginCount = (identifier) => {
    return failedLoginTracker[identifier]?.count || 0;
};

module.exports = {
    generateNonce,
    sanitizeInput,
    validateOrigin,
    preventParameterPollution,
    detectSQLInjection,
    additionalSecurityHeaders,
    activityMonitor,
    enforceHTTPS,
    payloadSizeLimit,
    validateTokenFormat,
    trackFailedLogin,
    resetFailedLogin,
    getFailedLoginCount
};
