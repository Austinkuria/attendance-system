const router = require('express').Router();
const { generateQRCode, createAttendanceSession, markStudentAttendance } = require('../controllers/attendance.controller');

const authenticate = require('../middleware/authMiddleware');

router.get('/generateQR', generateQRCode); // Change to GET request
router.post('/create', authenticate, createAttendanceSession);
router.post('/mark', authenticate, markStudentAttendance);


module.exports = router;
