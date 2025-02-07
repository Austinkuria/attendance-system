const router = require('express').Router();
const { generateQRCode, createAttendanceSession, markAttendance } = require('../controllers/attendance.controller');
const authenticate = require('../middleware/authMiddleware');

router.get('/generateQR', generateQRCode); // Change to GET request
router.post('/create', authenticate, createAttendanceSession);
router.post('/attendance/mark', markAttendance); // Mark attendance

module.exports = router;