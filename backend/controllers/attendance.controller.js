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
    const { unitId, qrCode } = req.body;
    const studentId = req.user.id;

    if (!unitId || !qrCode) {
      return res.status(400).json({ message: 'Unit ID and QR code are required' });
    }

    let qrData;
    try {
      const base64Data = qrCode.replace(/^data:image\/\w+;base64,/, '');
      const decodedData = Buffer.from(base64Data, 'base64').toString();
      qrData = JSON.parse(decodedData);

      if (!qrData || !qrData.s || !qrData.u || !qrData.t) {
        throw new Error('Invalid QR code data structure');
      }

      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime - qrData.t > 300) {
        throw new Error('QR code has expired');
      }

    } catch (error) {
      return res.status(400).json({ message: 'Invalid QR code: ' + error.message });
    }

    const session = await Session.findOne({
      _id: qrData.s,
      unit: qrData.u,
      ended: false
    });

    if (!session) {
      return res.status(404).json({ message: 'Invalid or expired QR code. Session not found' });
    }

    const existingAttendance = await Attendance.findOne({
      session: session._id,
      student: studentId
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked' });
    }

    const newAttendance = new Attendance({
      session: session._id,
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
