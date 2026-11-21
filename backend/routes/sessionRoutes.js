const router = require('express').Router();
const {
  detectCurrentSession,
  createSession,
  startSession,
  getRotatingQrToken,
  endSession,
  getLastSession,
  getActiveSessionForUnit,
  regenerateQR,
  checkSessionStatus,
  validateSession,
  getSessionDetails,
  getSessionsList,
  updateSession,
  deleteSession
} = require('../controllers/session.controller');
const authenticate = require('../middleware/authMiddleware');
const { authLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');

// Dynamic 30-Second QR Token Security & Check-In Endpoints
router.post('/start', authenticate, sensitiveLimiter, startSession);
router.get('/:id/qr-token', authenticate, getRotatingQrToken);
router.post('/:id/end', authenticate, endSession);

// Full CRUD operations on Sessions
router.get('/', authenticate, getSessionsList);
router.get('/:id', authenticate, getSessionDetails);
router.put('/:id', authenticate, updateSession);
router.delete('/:id', authenticate, deleteSession);

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