const express = require("express");
const { generateQR, scanQR, getAttendanceHistory } = require("../controllers/attendanceController");
const router = express.Router();

router.post("/generate-qr", generateQR); // Lecturer generates QR
router.post("/scan", scanQR); // Student scans QR
router.get("/history", getAttendanceHistory); // Get attendance records

module.exports = router;
