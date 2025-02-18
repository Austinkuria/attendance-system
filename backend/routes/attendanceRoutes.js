const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

// Mark attendance via QR code
router.post('/mark', authMiddleware, attendanceController.markAttendance);

module.exports = router;
