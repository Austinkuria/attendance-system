const Session = require('../models/Session');
const generateQRToken = require('../utils/session.utils');
const schedule = require("node-schedule");
const { markAbsentees } = require("../controllers/attendance.controller");

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
    res.json({ ...currentSession.toObject(), qrCode });

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

// Schedule absentee marking after session ends
exports.endSession = async (req, res) => {
  try {
    const { sessionId, endTime } = req.body;

    // Set a job to mark absentees when session ends
    schedule.scheduleJob(new Date(endTime), async () => {
      await markAbsentees(sessionId);
    });

    res.status(200).json({ message: "Session ended. Absentees will be marked automatically." });
  } catch (error) {
    res.status(500).json({ message: "Error ending session", error: error.message });
  }
};

exports.getLastSession = async (req, res) => {
  try {
    const { unitId } = req.params;
    if (!unitId) {
      return res.status(400).json({ message: 'Unit ID is required' });
    }

    const lastSession = await Session.findOne({
      unit: unitId,
      ended: true
    }).sort({ endTime: -1 }).populate('unit lecturer'); // Most recent ended session

    if (!lastSession) {
      return res.status(404).json({ message: 'No ended sessions found for this unit' });
    }

    res.json(lastSession);
  } catch (error) {
    console.error("Error fetching last session:", error);
    res.status(500).json({ message: 'Error fetching last session', error: error.message });
  }
};