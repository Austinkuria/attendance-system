const Attendance = require('../models/Attendance');
const Session = require('../models/AttendanceSession');

exports.markAttendance = async (req, res) => {
  try {
    const { unitId, qrCode } = req.body;
    const studentId = req.user.id; // Assuming user ID is available in req.user

    // Validate input
    if (!unitId || !qrCode) {
      return res.status(400).json({ message: 'Unit ID and QR code are required' });
    }

    // Find the session associated with the QR code
    const session = await Session.findOne({ 
      qrCode,
      unit: unitId,
      ended: false,
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() }
    });

    if (!session) {
      return res.status(404).json({ message: 'Invalid or expired QR code' });
    }

    // Check if attendance is already marked
    const existingAttendance = await Attendance.findOne({
      session: session._id,
      student: studentId
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked' });
    }

    // Create new attendance record
    const newAttendance = new Attendance({
      session: session._id,
      student: studentId,
      unit: unitId,
      status: 'present',
      timestamp: new Date()
    });

    await newAttendance.save();

    res.status(200).json({ 
      message: 'Attendance marked successfully',
      attendance: newAttendance
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error marking attendance', 
      error: error.message 
    });
  }
};
