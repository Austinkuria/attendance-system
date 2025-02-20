const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middleware/authMiddleware');

router.post('/mark', authenticate, attendanceController.markAttendance);
router.post('/handle-session-end', authenticate, attendanceController.handleSessionEnd);
router.get('/student/:studentId', authenticate, attendanceController.getStudentAttendance);
router.get('/session/:sessionId', authenticate, attendanceController.getSessionAttendance);
router.put('/:attendanceId', authenticate, attendanceController.updateAttendanceStatus);
// router.get('/trends/:unitId', authenticate, attendanceController.getAttendanceTrends);
// In attendance.routes.js
router.get('/trends/:unitId', authenticate, (req, res) => {
    console.log('Trends route hit with unitId:', req.params.unitId);
    attendanceController.getAttendanceTrends(req, res);
  });
module.exports = router;
