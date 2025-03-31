const router = require('express').Router();
const {
  detectCurrentSession,
  createSession,
  endSession,
  getLastSession,
  getActiveSessionForUnit,
  regenerateQR,
  checkSessionStatus, // Add this import
  validateSession // Add this import
} = require('../controllers/session.controller');
const authenticate = require('../middleware/authMiddleware');
const { authLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');

// Routes for session management
router.get('/current', authenticate, detectCurrentSession); // Get any current active session
router.get('/current/:selectedUnit', authLimiter, authenticate, detectCurrentSession); // Get current active session for a specific unit
router.post('/create', authenticate, sensitiveLimiter, createSession); // Create a new session
router.post('/end', authenticate, endSession); // End an existing session
router.get('/last/:unitId', authenticate, getLastSession); // Get the most recent ended session for a unit
router.post('/regenerate-qr', regenerateQR);
router.get('/active/:unitId', getActiveSessionForUnit); // No authentication middleware
router.get('/status/:sessionId', authenticate, checkSessionStatus); // New route to check session status
router.get('/validate-session/:sessionId', validateSession); // Add validate session route without authentication
module.exports = router;