const Session = require('../models/Session');
const generateQRToken = require('../utils/session.utils');
const schedule = require("node-schedule");
const { markAbsentees } = require("../controllers/attendance.controller");
const mongoose = require('mongoose');

exports.detectCurrentSession = async (req, res) => {
  try {
    const currentTime = new Date();
    const currentSession = await Session.findOne({
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime },
      ended: false
    });

    if (!currentSession) {
      return res.status(404).json({ message: 'No current session found' });
    }

    // Check if session should be ended based on time
    if (currentTime > new Date(currentSession.endTime)) {
      currentSession.ended = true;
      await currentSession.save();
      return res.status(404).json({ message: 'Session has ended' });
    }

    res.json({ ...currentSession.toObject(), qrCode: currentSession.qrCode });
  } catch (error) {
    res.status(500).json({ message: 'Error detecting current session', error: error.message });
  }
};

// exports.detectCurrentSession = async (req, res) => {
//   try {
//     const currentTime = new Date();
//     const currentSession = await Session.findOne({
//       startTime: { $lte: currentTime },
//       endTime: { $gte: currentTime },
//       ended: false
//     });

//     if (!currentSession) {
//       return res.status(404).json({ message: 'No current session found' });
//     }

//     res.json({ ...currentSession.toObject(), qrCode: currentSession.qrCode });
//   } catch (error) {
//     res.status(500).json({ message: 'Error detecting current session', error: error.message });
//   }
// };

exports.createSession = async (req, res) => {
  try {
    const { unitId, lecturerId, startTime, endTime } = req.body;

    if (!unitId || !lecturerId || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid startTime or endTime format" });
    }

    if (start >= end) {
      return res.status(400).json({ message: "startTime must be before endTime" });
    }

    const session = new Session({ unit: unitId, lecturer: lecturerId, startTime: start, endTime: end });
    const { qrToken, qrCode } = await generateQRToken(session);
    session.qrToken = qrToken;
    session.qrCode = qrCode;
    await session.save();

    res.status(201).json({ message: "Session created successfully", session, qrCode: session.qrCode });
  } catch (error) {
    console.error("Error in createSession:", error);
    res.status(500).json({ message: "Error creating session", error: error.message });
  }
};

// exports.createSession = async (req, res) => {
//   try {
//     console.log("Received raw body:", req.body);

//     const { unitId, lecturerId, startTime, endTime } = req.body;

//     if (!unitId || !lecturerId || !startTime || !endTime) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     const start = new Date(startTime);
//     const end = new Date(endTime);

//     if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//       return res.status(400).json({ message: 'Invalid startTime or endTime format' });
//     }

//     if (start >= end) {
//       return res.status(400).json({ message: 'startTime must be before endTime' });
//     }

//     const session = new Session({ unit: unitId, lecturer: lecturerId, startTime: start, endTime: end });
//     await session.save();

//     session.qrCode = await generateQRToken(session);
//     await session.save();

//     res.status(201).json({ message: 'Session created successfully', session, qrCode: session.qrCode });

//   } catch (error) {
//     res.status(500).json({ message: 'Error creating session', error: error.message });
//   }
// };

exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID format" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.ended) {
      return res.status(400).json({ message: "Session already ended" });
    }

    session.ended = true;
    await session.save();

    await markAbsentees(sessionId);

    res.status(200).json({ message: "Session ended successfully", session });
  } catch (error) {
    console.error("Error ending session:", error);
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

exports.regenerateQR = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID format" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.ended) {
      return res.status(400).json({ message: "Cannot regenerate QR for an ended session" });
    }

    session.qrCode = await generateQRToken(session);
    await session.save();

    res.status(200).json({ message: "QR code regenerated successfully", qrCode: session.qrCode });
  } catch (error) {
    console.error("Error regenerating QR code:", error);
    res.status(500).json({ message: "Error regenerating QR code", error: error.message });
  }
};