const AttendanceSession = require('../models/session.model');
const jwt = require('jsonwebtoken');
const generateQRToken = require('../utils/generateQRToken');
const Session = require('../models/Session');
exports.submitAttendance = async (req, res) => {
  try {
    const deviceHash = req.deviceFingerprint; // Captured by middleware
    const decoded = jwt.verify(req.body.token, process.env.JWT_SECRET);
    
    // Retrieve session
    const session = await Session.findById(decoded.sessionId);
    
    // Check if session is still valid
    if (!this.validateSessionTime(session)) {
      return res.status(400).json({ error: "Session expired" });
    }

    // Verify if the student is enrolled in the unit & course
    const isEnrolled = await Enrollment.exists({
      student: req.user.id,
      unit: session.unit,
      course: session.course
    });

    if (!isEnrolled) {
      return res.status(403).json({ error: "Not enrolled" });
    }

    // Check if the device has already been used
    const deviceHistory = await Session.aggregate([
      { $match: { 'deviceFingerprints': deviceHash } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);

    // Save the device fingerprint
    await Session.findByIdAndUpdate(session._id, {
      $addToSet: { deviceFingerprints: deviceHash }
    });

    res.json({
      success: true,
      deviceUsage: deviceHistory[0]?.count || 0
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateQRCode = async (req, res) => {
  try {
    const session = await detectCurrentSession(req, res);
    if (!session || !session.qrToken) {
      return res.status(404).json({ message: "QR token generation failed" });
    }
    res.json({ qrToken: session.qrToken });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate QR code" });
  }
};
// Function to create a new attendance session
exports.createAttendanceSession = async (req, res) => {
  try {
    const { unitId, lecturerId, startTime, endTime } = req.body;

    // Create a new session in the database
    const session = new Session({
      unit: unitId,
      lecturer: lecturerId,
      startTime,
      endTime,
      qrToken: generateQRToken(), // Generate the QR token
    });

    await session.save();

    res.status(201).json({ message: 'Session created successfully', session });
  } catch (error) {
    res.status(500).json({ message: 'Error creating session', error: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { studentId, unitId, attendanceDate } = req.body;
    const newAttendance = new AttendanceSession({
      student: studentId,
      unit: unitId,
      attendanceDate,
    });
    await newAttendance.save();
    res.status(201).json({ message: 'Attendance marked successfully', data: newAttendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};