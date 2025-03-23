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

// New route for unit-specific attendance data
router.get('/unit-rate/:unitId', authenticate, attendanceController.getUnitAttendanceRate);

// Add these export routes with proper controller references
router.get('/export/unit/:unitId', authenticate, attendanceController.exportUnitAttendance);
router.get('/export/session/:sessionId', authenticate, attendanceController.exportSessionAttendance);
router.get('/export-all-sessions', authenticate, attendanceController.exportAllSessionsAttendance);

// Add this line before the error-handling middleware
router.get('/export', authenticate, attendanceController.exportFilteredAttendance);

// Error-handling middleware
router.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    code: "SERVER_ERROR",
    message: "An unexpected error occurred. Please try again later."
  });
});

router.get('/attendance/realtime/:sessionId', authenticate, attendanceController.getRealTimeAttendance);
router.get('/pending-feedback', authenticate, attendanceController.getPendingFeedbackAttendance);
router.get('/feedback/status/:sessionId', authenticate, attendanceController.checkFeedbackStatus);
router.get('/unit/attendance', authenticate, attendanceController.getLecturerUnitAttendance);
router.get('/realtime-lecturer/:sessionId', authenticate, attendanceController.getLecturerRealTimeAttendance);
router.get('/past-lecturer', authenticate, attendanceController.getLecturerPastAttendance);
module.exports = router;
