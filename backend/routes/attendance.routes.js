const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middleware/authMiddleware');

router.post('/mark', authenticate, attendanceController.markAttendance);
router.post('/handle-session-end', authenticate, attendanceController.handleSessionEnd);
router.get('/student/:studentId', authenticate, attendanceController.getStudentAttendance);

module.exports = router;
