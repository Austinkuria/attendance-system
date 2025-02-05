const router = require('express').Router();
const { generateQRCode } = require('../controllers/attendance.controller');
const {createAttendanceSession} = require('../controllers/attendance.controller');
const authenticate = require('../middleware/authMiddleware');
const {markAttendance} = require('../controllers/attendance.controller');
// Handle POST request for generating QR code
router.post('/generateQR', generateQRCode);
router.post("/create", authenticate, createAttendanceSession)
router.post("/attendance/mark", markAttendance); // Mark attendance
module.exports = router;
