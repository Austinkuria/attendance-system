const Session = require('../models/Session');
const generateQRToken = require('../utils/session.utils');
const schedule = require("node-schedule");
const { markAbsentees } = require("../controllers/attendance.controller");
const mongoose = require('mongoose');
const { sendNotification } = require('../services/firebaseService');

exports.detectCurrentSession = async (req, res) => {
  try {
    const lecturerId = req.user?.userId; 
    const unitId = req.params.selectedUnit;
    console.log("Detecting session with:", { lecturerId, unitId });

    if (!lecturerId) {
      return res.status(400).json({ message: 'Lecturer ID is required' });
    }

    const currentTime = new Date();
    const query = {
      lecturer: lecturerId,
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime },
      ended: false
    };

    if (unitId && mongoose.isValidObjectId(unitId)) { // Validate unitId
      query.unit = unitId;
    } else if (unitId === 'undefined' || !unitId) {
      return res.status(400).json({ message: 'Invalid or missing unit ID' });
    }

    const currentSession = await Session.findOne(query);
    if (!currentSession) {
      return res.status(404).json({ message: 'No current session found for this lecturer/unit' });
    }

    if (currentTime > new Date(currentSession.endTime)) {
      currentSession.ended = true;
      await currentSession.save();
      return res.status(404).json({ message: 'Session has ended' });
    }

    res.json({ ...currentSession.toObject(), qrCode: currentSession.qrCode });
  } catch (error) {
    console.error("Error detecting current session:", error);
    res.status(500).json({ message: 'Error detecting current session', error: error.message });
  }
};

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

    const { qrToken, qrCode } = await generateQRToken(session);
    session.qrToken = qrToken;
    session.qrCode = qrCode;
    await session.save();

    res.status(200).json({ message: "QR code regenerated successfully", qrCode: session.qrCode });
  } catch (error) {
    console.error("Error regenerating QR code:", error);
    res.status(500).json({ message: "Error regenerating QR code", error: error.message });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID format" });
    }

    const session = await Session.findById(sessionId).populate('unit');
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.ended) {
      return res.status(400).json({ message: "Session already ended" });
    }

    session.ended = true;
    session.feedbackEnabled = true;
    await session.save();

    await markAbsentees(sessionId);

    const attendees = session.attendees.map(a => a.student.toString());
    if (attendees.length > 0) {
      await sendNotification(attendees, {
        title: "Session Ended",
        message: `The session for ${session.unit.name} has ended. Please provide your feedback.`,
        data: { sessionId: session._id.toString(), action: "openFeedback" }
      });
    }

    res.status(200).json({ message: "Session ended successfully", session });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ message: "Error ending session", error: error.message });
  }
};

// exports.endSession = async (req, res) => {
//   try {
//     const { sessionId } = req.body;

//     if (!mongoose.isValidObjectId(sessionId)) {
//       return res.status(400).json({ message: "Invalid session ID format" });
//     }

//     const session = await Session.findById(sessionId);
//     if (!session) {
//       return res.status(404).json({ message: "Session not found" });
//     }

//     if (session.ended) {
//       return res.status(400).json({ message: "Session already ended" });
//     }

//     session.ended = true;
//     await session.save();

//     await markAbsentees(sessionId);

//     res.status(200).json({ message: "Session ended successfully", session });
//   } catch (error) {
//     console.error("Error ending session:", error);
//     res.status(500).json({ message: "Error ending session", error: error.message });
//   }
// };

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

exports.getActiveSessionForUnit = async (req, res) => {
  try {
    const unitId = req.params.unitId;
    console.log("Fetching active session for unit:", unitId);

    if (!unitId || !mongoose.isValidObjectId(unitId)) {
      return res.status(400).json({ message: 'Invalid or missing unit ID' });
    }

    const currentTime = new Date();
    const query = {
      unit: unitId,
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime },
      ended: false
    };

    const currentSession = await Session.findOne(query);
    if (!currentSession) {
      return res.status(404).json({ message: 'No active session found for this unit' });
    }

    if (currentTime > new Date(currentSession.endTime)) {
      currentSession.ended = true;
      await currentSession.save();
      return res.status(404).json({ message: 'Session has ended' });
    }

    res.json({ ...currentSession.toObject(), qrCode: currentSession.qrCode });
  } catch (error) {
    console.error("Error fetching active session:", error);
    res.status(500).json({ message: 'Error fetching active session', error: error.message });
  }
};