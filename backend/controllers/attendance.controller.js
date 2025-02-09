const jwt = require('jsonwebtoken');
const generateQRToken = require('../utils/session.utils');
const Session = require('../models/AttendanceSession');
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

const QRCode = require("qrcode");

exports.generateQRCode = async (req, res) => {
  try {
    const session = await detectCurrentSession(req, res);
    console.log("Current session data:", session); // Log the session data
    if (!session || !session.qrCode) {
      return res.status(404).json({ message: "QR token generation failed" });
    }

    // ✅ Generate a Base64 QR Code from the token
    console.log("QR Code data:", session.qrCode); // Log the QR code data
    const qrImage = await QRCode.toDataURL(session.qrCode);

    res.json({ qrCode: qrImage }); // ✅ Send Base64 QR Code instead of raw token
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).json({ message: "Failed to generate QR code" });
  }
};


// Function to create a new attendance session
exports.createAttendanceSession = async (req, res) => {
  try {
    const { unitId, lecturerId, startTime, endTime } = req.body;

    // Ensure startTime and endTime are valid dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid startTime or endTime' });
    }

    // Create a new session in the database
    const session = new Session({
      unit: unitId,
      lecturer: lecturerId,
      startTime: start,
      endTime: end,
      qrCode: generateQRToken(), // Generate the QR token
    });

    await session.save();

    // Generate a base64-encoded QR code image
    const qrImage = await QRCode.toDataURL(session.qrCode);

    res.status(201).json({ message: 'Session created successfully', session, qrCode: qrImage });
  } catch (error) {
    res.status(500).json({ message: 'Error creating session', error: error.message });
  }
};

// exports.createAttendanceSession = async (req, res) => {
//   try {
//     const { unitId, lecturerId, startTime, endTime } = req.body;

//     // Create a new session in the database
//     const session = new Session({
//       unit: unitId,
//       lecturer: lecturerId,
//       startTime,
//       endTime,
//       duration,
//       qrCode: generateQRToken(), // Generate the QR token
//     });

//     await session.save();

//     res.status(201).json({ message: 'Session created successfully', session });
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating session', error: error.message });
//   }
// };

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

// markStudentAttendance function
exports.markStudentAttendance = async (req, res) => {
  try {
    const { studentId, unitId, attendanceDate } = req.body;
    const newAttendance = new AttendanceSession({
      student: studentId,
      unit: unitId,
      attendanceDate,
    });
    await newAttendance.save();
    res.status(201).json({ message: 'Attendance marked successfully', data: newAttendance });
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
}
