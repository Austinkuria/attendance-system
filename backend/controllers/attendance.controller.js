const jwt = require('jsonwebtoken');
const generateQRToken = require('../utils/session.utils');
const Session = require('../models/Session');
const Attendance = require('../models/AttendanceSession');
const QRCode = require("qrcode");

exports.submitAttendance = async (req, res) => {
  try {
    const deviceHash = req.deviceFingerprint;
    const decoded = jwt.verify(req.body.token, process.env.JWT_SECRET);

    const session = await Session.findById(decoded.sessionId);

    if (!this.validateSessionTime(session)) {
      return res.status(400).json({ error: "Session expired" });
    }

    const isEnrolled = await Enrollment.exists({
      student: req.user.id,
      unit: session.unit,
      course: session.course
    });

    if (!isEnrolled) {
      return res.status(403).json({ error: "Not enrolled" });
    }

    const deviceHistory = await Session.aggregate([
      { $match: { 'deviceFingerprints': deviceHash } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);

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
    if (!session || !session.qrCode) {
      return res.status(404).json({ message: "QR token generation failed" });
    }

    const qrImage = await QRCode.toDataURL(session.qrCode);
    res.json({ qrCode: qrImage });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate QR code" });
  }
};

exports.createAttendanceSession = async (req, res) => {
  try {
    const { unitId, lecturerId, startTime, endTime } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid startTime or endTime' });
    }

    const session = new Session({
      unit: unitId,
      lecturer: lecturerId,
      startTime: start,
      endTime: end,
      qrCode: generateQRToken()
    });

    await session.save();

    const qrImage = await QRCode.toDataURL(session.qrCode);
    res.status(201).json({ message: 'Session created successfully', session, qrCode: qrImage });
  } catch (error) {
    res.status(500).json({ message: 'Error creating session', error: error.message });
  }
};

exports.markStudentAttendance = async (req, res) => {
  try {
    const { sessionId, qrCode } = req.body;
    const studentId = req.user.id;

    if (!sessionId || !qrCode || !studentId) {
      return res.status(400).json({ 
        message: 'Session ID, QR code, and student ID are required' 
      });
    }

    // Validate session exists and is active
    const session = await Session.findById(sessionId);
    if (!session || session.ended) {
      return res.status(404).json({ message: 'Invalid or expired session' });
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      session: sessionId,
      student: studentId
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked' });
    }

    // Create new attendance record
    const newAttendance = new Attendance({
      session: sessionId,
      student: studentId,
      status: 'present'
    });

    await newAttendance.save();

    res.status(200).json({
      message: 'Attendance marked successfully',
      attendance: newAttendance
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error marking attendance: ' + error.message,
      error: error.stack
    });
  }
};
