const Session = require('../models/Session');
const { generateQRToken } = require('../utils/session.utils');

exports.detectCurrentSession = async (req, res) => {
  try {
    const now = new Date();
    const session = await Session.findOne({
      lecturer: req.user.id,
      startTime: { $lte: now },  // Session started
      endTime: { $gte: now }     // Session not expired
    }).populate('unit course');
    
    if (!session) return res.status(404).json({ message: "No active session" });

    // Generate QR token for students to scan
    const qrToken = await generateQRToken(session);
    
    res.json({ ...session.toObject(), qrToken });
  } catch (error) {
    res.status(500).json({ message: "Session detection failed" });
  }
};

exports.createAttendanceSession = async (req, res) => {
  try {
    const { unitId, startTime, endTime } = req.body;
    const lecturerId = req.user.id; // Get the lecturer's ID from the authenticated user

    // Create a new session in the database
    const session = new Session({
      unit: unitId,
      lecturer: lecturerId,
      startTime,
      endTime,
      qrToken: generateQRToken(), // Generate the QR token
    });

    await session.save();

    res.status(201).json({ message: "Session created successfully", session });
  } catch (error) {
    res.status(500).json({ message: "Error creating session", error: error.message });
  }
};