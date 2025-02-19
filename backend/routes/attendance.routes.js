const router = require('express').Router();
const { generateQRCode, createSession, markStudentAttendance } = require('../controllers/attendance.controller');

const authenticate = require('../middleware/authMiddleware');

router.get('/generateQR', generateQRCode); // Change to GET request
router.post('/create', authenticate, createSession);
router.post('/mark', authenticate, markStudentAttendance);


module.exports = router;
