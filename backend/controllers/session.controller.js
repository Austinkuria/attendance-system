const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const generateQRToken = require('../utils/session.utils');
const schedule = require("node-schedule");
const { markAbsentees } = require("../controllers/attendance.controller");
const mongoose = require('mongoose');
require('dotenv').config();

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

    if (unitId && mongoose.isValidObjectId(unitId)) {
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

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(unitId) || !mongoose.Types.ObjectId.isValid(lecturerId)) {
      return res.status(400).json({ message: "Invalid unit or lecturer ID format" });
    }

    const session = new Session({
      unit: unitId,
      lecturer: lecturerId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      ended: false,
      feedbackEnabled: false
    });

    const { qrToken, qrCode } = await generateQRToken(session);
    session.qrCode = qrCode;
    session.qrToken = qrToken;

    await session.save();

    res.status(201).json({
      session: {
        _id: session._id,
        unit: session.unit,
        startTime: session.startTime,
        endTime: session.endTime,
        ended: session.ended,
        qrCode: session.qrCode,
        qrToken: session.qrToken
      },
      message: "Session created successfully"
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: "Error creating session", error: error.message });
  }
};

exports.regenerateQR = async (req, res) => {
  try {
    const { sessionId, autoRotate } = req.body;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID format" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.ended) {
      return res.status(400).json({ message: "Cannot regenerate QR for an ended session" });
    }

    // Increase expiration time to 3 minutes
    const expiresIn = autoRotate ? 175 : 180; // 175 seconds for auto (buffer for rotation), 180 seconds for manual

    const { qrToken, qrCode } = await generateQRToken(session, expiresIn);
    session.qrToken = qrToken;
    session.qrCode = qrCode;
    session.qrExpiresAt = new Date(Date.now() + (expiresIn * 1000));
    await session.save();

    res.status(200).json({
      message: "QR code regenerated successfully",
      qrCode: session.qrCode,
      expiresAt: session.qrExpiresAt
    });
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
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.ended) return res.status(400).json({ message: "Session already ended" });

    console.log(`Ending session ${sessionId}...`); // Debug
    session.ended = true;
    session.feedbackEnabled = true;
    session.endTime = new Date();
    await session.save();

    const updatedSession = await Session.findById(sessionId);
    if (!updatedSession.ended) {
      console.error(`Failed to mark session ${sessionId} as ended`);
      return res.status(500).json({ message: "Failed to update session status" });
    }

    // Cancel any scheduled jobs for this session
    const jobName = `end-session-${sessionId}`;
    if (schedule.scheduledJobs[jobName]) {
      schedule.cancelJob(jobName);
      console.log(`Cancelled scheduled job for session: ${sessionId}`);
    }

    // Ensure markAbsentees is called and awaited
    console.log(`Calling markAbsentees for session ${sessionId}...`); // Debug
    try {
      await markAbsentees(sessionId);
      console.log(`Successfully marked absentees for session ${sessionId}`);
    } catch (absentError) {
      console.error(`Error marking absentees: ${absentError}`);
      // Continue with session end even if marking absentees fails
    }

    res.status(200).json({
      message: "Session ended and absentees marked successfully",
      session: updatedSession
    });
  } catch (error) {
    console.error(`Error ending session ${req.body.sessionId}:`, error);
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
    }).sort({ endTime: -1 }).populate('unit lecturer');

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
      return res.status(404).json({
        message: 'No active session found for this unit',
        active: false
      });
    }

    // Double check if the session has ended based on time
    if (currentTime > new Date(currentSession.endTime)) {
      currentSession.ended = true;
      await currentSession.save();
      return res.status(404).json({
        message: 'Session has ended',
        active: false,
        ended: true
      });
    }

    // Ensure the status flags are properly set and consistent
    const sessionData = {
      _id: currentSession._id,
      unit: currentSession.unit,
      startTime: currentSession.startTime,
      endTime: currentSession.endTime,
      ended: false,  // Explicitly set to false since we've verified it's active
      active: true   // Add explicit active flag for clarity
    };

    // Don't include sensitive data like qrToken when authentication is not provided
    if (!req.user) {
      return res.json(sessionData); // Return minimal session data
    }

    // If authenticated, include the qrCode
    return res.json({
      ...sessionData,
      qrCode: currentSession.qrCode
    });
  } catch (error) {
    console.error("Error fetching active session:", error);
    res.status(500).json({
      message: 'Error fetching active session',
      error: error.message,
      active: false
    });
  }
};

exports.checkSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID format' });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        active: false,
        message: 'Session not found'
      });
    }

    // Check if session has been manually ended or time has elapsed
    const isActive = !session.ended && new Date() <= new Date(session.endTime);

    // Check if feedback is enabled
    const feedbackEnabled = session.feedbackEnabled || session.ended;

    res.json({
      active: isActive,
      ended: session.ended,
      feedbackEnabled: feedbackEnabled,
      endTime: session.endTime
    });
  } catch (error) {
    console.error("Error checking session status:", error);
    res.status(500).json({ message: 'Error checking session status', error: error.message });
  }
};

// Add validateSession function to handle session validation without authentication
exports.validateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || !mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({
        message: 'Invalid or missing session ID',
        valid: false
      });
    }

    // Find the session without requiring authentication
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: 'Session not found',
        valid: false
      });
    }

    const currentTime = new Date();

    // Check if session has ended or expired
    if (session.ended || currentTime > new Date(session.endTime)) {
      // If session has ended but the ended flag isn't set, update it
      if (!session.ended) {
        session.ended = true;
        await session.save();
      }

      return res.status(200).json({
        message: 'Session has ended',
        valid: false,
        ended: true,
        active: false
      });
    }

    // Check if session has started yet
    if (currentTime < new Date(session.startTime)) {
      return res.status(200).json({
        message: 'Session has not started yet',
        valid: false,
        ended: false,
        active: false
      });
    }

    // If we got here, session is valid and active
    return res.status(200).json({
      message: 'Session is active and valid',
      valid: true,
      ended: false,
      active: true,
      unitId: session.unit,
      startTime: session.startTime,
      endTime: session.endTime
    });
  } catch (error) {
    console.error("Error validating session:", error);
    return res.status(500).json({
      message: 'Error validating session',
      error: error.message,
      valid: false,
      active: false
    });
  }
};