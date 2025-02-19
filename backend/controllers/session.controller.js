const Session = require('../models/AttendanceSession');
const generateQRToken = require('../utils/session.utils');

exports.detectCurrentSession = async (req, res) => {
  try {
    const currentTime = new Date();
    const currentSession = await Session.findOne({
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime }
    });
    if (!currentSession) {
      return res.status(404).json({ message: 'No current session found' });
    }

    // Generate QR code for the current session
    const qrCode = await generateQRToken(currentSession);
    const sessionWithQR = {
      ...currentSession.toObject(),
      qrCode
    };

    res.json(sessionWithQR);

  } catch (error) {
    res.status(500).json({ message: 'Error detecting current session', error: error.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    console.log("Received raw body:", req.body);

    const { unitId, lecturerId, startTime, endTime } = req.body;

    if (!unitId || !lecturerId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid startTime or endTime format' });
    }

    if (start >= end) {
      return res.status(400).json({ message: 'startTime must be before endTime' });
    }

    const session = new Session({ unit: unitId, lecturer: lecturerId, startTime: start, endTime: end });
    await session.save();

    session.qrCode = await generateQRToken(session);
    await session.save();

    res.status(201).json({ message: 'Session created successfully', session, qrCode: session.qrCode });

  } catch (error) {
    res.status(500).json({ message: 'Error creating session', error: error.message });
  }
};


// New function to end a session
exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Find the session by ID
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Mark the session as ended
    session.ended = true; // Assuming there's an 'ended' field in the model
    await session.save();

    res.status(200).json({ message: 'Session ended successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error ending session', error: error.message });
  }
};
