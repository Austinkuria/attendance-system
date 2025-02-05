const router = require('express').Router();
const { generateQRCode, createAttendanceSession, markAttendance } = require('../controllers/attendance.controller');
const authenticate = require('../middleware/authMiddleware');

// Handle POST request for generating QR code
router.post('/generateQR', generateQRCode);
router.post('/create', authenticate, createAttendanceSession);
router.post('/attendance/mark', markAttendance); // Mark attendance

module.exports = router;