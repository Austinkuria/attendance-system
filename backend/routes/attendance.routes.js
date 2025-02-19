const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/mark', authMiddleware, attendanceController.markAttendance);
router.post('/handle-session-end', authMiddleware, attendanceController.handleSessionEnd);
router.get('/student/:studentId', authMiddleware, attendanceController.getStudentAttendance);

module.exports = router;
