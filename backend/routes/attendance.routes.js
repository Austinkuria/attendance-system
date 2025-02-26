const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middleware/authMiddleware');
const { attendanceMarkLimiter } = require('../middleware/rateLimiter');

router.post('/mark', authenticate, attendanceMarkLimiter, attendanceController.markAttendance);
router.post('/handle-session-end', authenticate, attendanceController.handleSessionEnd);
router.get('/student/:studentId', authenticate, attendanceController.getStudentAttendance);
router.get('/session/:sessionId', authenticate, attendanceController.getSessionAttendance);
router.put('/:attendanceId', authenticate, attendanceController.updateAttendanceStatus);
router.get('/student/:studentId/filter', attendanceController.getStudentAttendanceByFilter);
router.get('/trends/:unitId', authenticate, (req, res) => {
    console.log('Trends route hit with unitId:', req.params.unitId);
    attendanceController.getAttendanceTrends(req, res);
  });
  router.get('/course-rate/:courseId', authenticate, attendanceController.getCourseAttendanceRate);

  // Error-handling middleware
router.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    code: "SERVER_ERROR",
    message: "An unexpected error occurred. Please try again later."
  });
});
module.exports = router;
