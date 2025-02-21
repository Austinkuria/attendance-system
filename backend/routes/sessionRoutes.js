const router = require('express').Router();
const { 
  detectCurrentSession, 
  createSession, 
  endSession, 
  getLastSession,
  regenerateQR
} = require('../controllers/session.controller');
const authenticate = require('../middleware/authMiddleware');

// Routes for session management
router.get('/current', authenticate, detectCurrentSession); // Get any current active session
router.get('/current/:selectedUnit', authenticate, detectCurrentSession); // Get current active session for a specific unit
router.post('/create', authenticate, createSession); // Create a new session
router.delete('/end', authenticate, endSession); // End an existing session
router.get('/last/:unitId', authenticate, getLastSession); // Get the most recent ended session for a unit
router.post('/regenerate-qr', regenerateQR);
module.exports = router;