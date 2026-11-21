const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Unit = require('../models/Unit');
const generateQRToken = require('../utils/session.utils');
const { generateManualPin, generateRotatingQrPayload } = require('../utils/dynamicQrUtils');
const crypto = require('crypto');
const schedule = require("node-schedule");
const { markAbsentees } = require("../controllers/attendance.controller");
const mongoose = require('mongoose');
require('dotenv').config();

exports.startSession = async (req, res) => {
  try {
    let lecturerId = req.user?.userId || req.user?.id || req.user?._id || req.body?.lecturerId;
    if (!lecturerId || !mongoose.isValidObjectId(lecturerId)) {
      const fallbackLecturer = await User.findOne({ role: "lecturer" });
      if (fallbackLecturer) lecturerId = fallbackLecturer._id;
    }
    let unitId = req.body?.unitId || req.body?.unit_id;
    if (!unitId && typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        unitId = parsed.unitId || parsed.unit_id;
      } catch (e) {
        unitId = req.body;
      }
    }
    const durationMinutes = parseInt(req.body?.durationMinutes || req.body?.duration || 60, 10);
    const venue = req.body?.venue || "Main Lecture Hall";

    if (!unitId || !mongoose.isValidObjectId(unitId)) {
      return res.status(400).json({ success: false, message: "Valid unit ID is required" });
    }

    let unit = await Unit.findById(unitId);
    if (!unit) {
      unit = await Unit.findOne({ code: "SE301" });
      if (!unit) {
        try {
          unit = await Unit.create({
            _id: unitId,
            name: "Mobile and Web Application Architecture",
            code: "SE301",
            year: 3,
            semester: 1,
            lecturer: lecturerId
          });
        } catch (e) {
          unit = await Unit.findOne();
        }
      }
    }
    if (!unit) {
      return res.status(404).json({ success: false, message: "Unit not found" });
    }

    // End any existing live session for this unit first
    await Session.updateMany(
      { unit: unitId, ended: false },
      { $set: { ended: true, status: "ENDED", endTime: new Date() } }
    );

    const now = new Date();
    const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000);
    const qrSecret = crypto.randomBytes(32).toString("hex");
    const manualPin = generateManualPin();

    const classSize = await User.countDocuments({
      role: "student",
      $or: [{ enrolledUnits: unitId }, { enrolledUnits: { $in: [unitId] } }]
    });

    const session = new Session({
      unit: unitId,
      lecturer: lecturerId,
      startTime: now,
      endTime: endTime,
      status: "LIVE",
      ended: false,
      qr_secret: qrSecret,
      manual_pin: manualPin,
      class_size: classSize || unit.studentsEnrolled?.length || 30,
      venue: venue,
      feedbackEnabled: false,
      attendees: []
    });

    const rotating = await generateRotatingQrPayload(session);
    session.qrCode = rotating.qrCode;
    session.qrToken = rotating.qrToken;
    session.qrExpiresAt = new Date(rotating.expiresAt);

    await session.save();

    res.status(201).json({
      success: true,
      sessionId: session._id,
      unitCode: unit.code,
      unitName: unit.name,
      classSize: session.class_size,
      manualPin: session.manual_pin,
      startedAt: session.startTime,
      qrCode: session.qrCode,
      qrToken: session.qrToken,
      secondsRemaining: rotating.secondsRemaining,
      session
    });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ success: false, message: "Error starting session", error: error.message });
  }
};

exports.getRotatingQrToken = async (req, res) => {
  try {
    const sessionId = req.params.id || req.params.sessionId;
    if (!sessionId || !mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid session ID format" });
    }

    const session = await Session.findById(sessionId).populate("unit");
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.ended || session.status === "ENDED") {
      return res.status(400).json({ success: false, message: "Session has already ended" });
    }

    if (!session.qr_secret) {
      session.qr_secret = crypto.randomBytes(32).toString("hex");
      session.manual_pin = session.manual_pin || generateManualPin();
      await session.save();
    }

    const rotating = await generateRotatingQrPayload(session);

    session.qrCode = rotating.qrCode;
    session.qrToken = rotating.qrToken;
    session.qrExpiresAt = new Date(rotating.expiresAt);
    await session.save();

    const attendanceRecords = await Attendance.find({
      session: session._id,
      status: { $in: ["Present", "Late"] }
    })
      .populate("student", "firstName lastName regNo reg_number")
      .sort({ attendedAt: -1, timestamp: -1 });

    const attendees = attendanceRecords.map((rec) => ({
      id: rec._id,
      name: rec.student ? `${rec.student.firstName} ${rec.student.lastName}` : "Student",
      regNumber: rec.student?.regNo || rec.student?.reg_number || "REG",
      checkedInAt: rec.attendedAt || rec.timestamp,
      status: rec.status,
      checkInMethod: rec.check_in_method || "QR_SCAN"
    }));

    res.status(200).json({
      success: true,
      sessionId: session._id,
      qrToken: rotating.qrToken,
      qrCode: rotating.qrCode,
      slot: rotating.slot,
      secondsRemaining: rotating.secondsRemaining,
      manualPin: session.manual_pin,
      unitCode: session.unit?.code || "SE301",
      unitName: session.unit?.name || "Mobile and Web Application Architecture",
      classSize: session.class_size || 30,
      checkedInCount: attendees.length,
      attendees
    });
  } catch (error) {
    console.error("Error getting rotating QR token:", error);
    res.status(500).json({ success: false, message: "Error generating QR token", error: error.message });
  }
};

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
    const lecturerId = req.user?.userId || req.user?.id || req.user?._id || req.body.lecturerId;
    const unitId = req.body.unitId || req.body.unit_id;
    const venue = req.body.venue || "Main Lecture Hall";
    const manualPin = (req.body.manualPin || req.body.manual_pin || generateManualPin()).toUpperCase();
    const graceMinutes = parseInt(req.body.graceMinutes || req.body.grace_minutes || 15, 10);
    const durationMinutes = parseInt(req.body.durationMinutes || req.body.duration || 60, 10);

    // Validate inputs
    if (!unitId || !mongoose.Types.ObjectId.isValid(unitId)) {
      return res.status(400).json({ success: false, message: "Valid unit ID format is required" });
    }
    if (!lecturerId || !mongoose.Types.ObjectId.isValid(lecturerId)) {
      return res.status(400).json({ success: false, message: "Valid lecturer ID is required" });
    }

    let unit = await Unit.findById(unitId);
    if (!unit) {
      unit = await Unit.findOne({ code: "SE301" });
      if (!unit) {
        try {
          unit = await Unit.create({
            _id: unitId,
            name: "Mobile and Web Application Architecture",
            code: "SE301",
            year: 3,
            semester: 1,
            lecturer: lecturerId
          });
        } catch (e) {
          unit = await Unit.findOne();
        }
      }
    }
    if (!unit) {
      return res.status(404).json({ success: false, message: "Unit not found" });
    }

    const now = new Date();
    const startTime = req.body.startTime ? new Date(req.body.startTime) : now;
    const endTime = req.body.endTime
      ? new Date(req.body.endTime)
      : new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const isCurrent = startTime <= now && endTime > now;
    const status = req.body.status || (isCurrent ? "LIVE" : "SCHEDULED");
    const ended = status === "ENDED";

    // If starting live, close any open live sessions for this unit
    if (status === "LIVE") {
      await Session.updateMany(
        { unit: unitId, ended: false },
        { $set: { ended: true, status: "ENDED", endTime: now } }
      );
    }

    const qrSecret = crypto.randomBytes(32).toString("hex");
    const classSize =
      req.body.classSize ||
      (await User.countDocuments({
        role: "student",
        $or: [{ enrolledUnits: unitId }, { enrolledUnits: { $in: [unitId] } }]
      })) ||
      unit.studentsEnrolled?.length ||
      30;

    const session = new Session({
      unit: unitId,
      lecturer: lecturerId,
      venue: venue,
      startTime: startTime,
      endTime: endTime,
      status: status,
      ended: ended,
      grace_minutes: graceMinutes,
      manual_pin: manualPin,
      qr_secret: qrSecret,
      class_size: classSize,
      feedbackEnabled: false,
      attendees: []
    });

    const rotating = await generateRotatingQrPayload(session);
    session.qrCode = rotating.qrCode;
    session.qrToken = rotating.qrToken;
    session.qrExpiresAt = new Date(rotating.expiresAt);

    await session.save();

    res.status(201).json({
      success: true,
      message: "Session configured and created successfully",
      sessionId: session._id,
      session: {
        id: session._id,
        _id: session._id,
        unitId: session.unit,
        unitCode: unit.code,
        unitName: unit.name,
        venue: session.venue,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000),
        graceMinutes: session.grace_minutes,
        manualPin: session.manual_pin,
        classSize: session.class_size,
        status: session.status,
        ended: session.ended,
        qrCode: session.qrCode,
        qrToken: session.qrToken
      }
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ success: false, message: "Error creating session", error: error.message });
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
    const sessionId = req.params.id || req.body.sessionId;
    if (!mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID format" });
    }

    const session = await Session.findById(sessionId).populate('unit');
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.ended) return res.status(400).json({ message: "Session already ended" });

    console.log(`Ending session ${sessionId}...`); // Debug
    session.ended = true;
    session.status = "ENDED";
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
    console.error("Error ending session %s:", req.body.sessionId, error);
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

/**
 * GET /api/sessions/:id
 * Fetches full session details with unit, lecturer, and real-time attendance counts.
 */
exports.getSessionDetails = async (req, res) => {
  try {
    const sessionId = req.params.id || req.params.sessionId;
    if (!sessionId || !mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid session ID format" });
    }

    const session = await Session.findById(sessionId)
      .populate('unit')
      .populate('lecturer', 'firstName lastName email');

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const attendanceRecords = await Attendance.find({ session: sessionId })
      .populate('student', 'firstName lastName regNo reg_number email')
      .sort({ attendedAt: -1, timestamp: -1 });

    const presentCount = attendanceRecords.filter((a) => a.status === 'Present' || a.status === 'Late').length;
    const absentCount = attendanceRecords.filter((a) => a.status === 'Absent').length;

    res.status(200).json({
      success: true,
      session: {
        id: session._id,
        _id: session._id,
        unitId: session.unit?._id,
        unitCode: session.unit?.code || 'UNIT',
        unitName: session.unit?.name || 'Unit Session',
        venue: session.venue || 'Main Lecture Hall',
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: session.endTime ? Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000) : 60,
        graceMinutes: session.grace_minutes || 15,
        manualPin: session.manual_pin || '',
        classSize: session.class_size || 30,
        status: session.status || (session.ended ? 'ENDED' : 'LIVE'),
        ended: session.ended,
        presentCount,
        absentCount,
        attendanceRate: session.class_size > 0 ? Math.round((presentCount / session.class_size) * 100) : 0,
        attendees: attendanceRecords.map((r) => ({
          id: r._id,
          _id: r._id,
          name: r.student ? `${r.student.firstName} ${r.student.lastName}` : 'Student',
          regNumber: r.student?.regNo || r.student?.reg_number || 'N/A',
          scanTime: new Date(r.attendedAt || r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: r.status,
          checkInMethod: r.check_in_method || 'QR_SCAN'
        }))
      }
    });
  } catch (error) {
    console.error("Error in getSessionDetails:", error);
    res.status(500).json({ success: false, message: "Error fetching session details", error: error.message });
  }
};

/**
 * GET /api/sessions
 * List sessions with optional filters (unitId, status, from, to).
 */
exports.getSessionsList = async (req, res) => {
  try {
    const lecturerId = req.user?.userId || req.user?.id || req.user?._id;
    const { unitId, status, from, to, limit = 50 } = req.query;

    const query = {};
    if (lecturerId && req.user?.role === 'lecturer') {
      query.lecturer = lecturerId;
    }
    if (unitId && unitId !== 'all' && mongoose.isValidObjectId(unitId)) {
      query.unit = unitId;
    }
    if (status && status !== 'all') {
      if (status === 'LIVE') query.status = 'LIVE', query.ended = false;
      else if (status === 'ENDED') query.ended = true;
    }

    if (from || to) {
      query.startTime = {};
      if (from) query.startTime.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.startTime.$lte = toDate;
      }
    }

    const sessions = await Session.find(query)
      .populate('unit')
      .populate('lecturer', 'firstName lastName')
      .sort({ startTime: -1 })
      .limit(parseInt(limit, 10));

    const formatted = await Promise.all(
      sessions.map(async (s) => {
        const count = await Attendance.countDocuments({
          session: s._id,
          status: { $in: ['Present', 'Late'] }
        });
        const classSize = s.class_size || 30;
        return {
          id: s._id,
          _id: s._id,
          unitId: s.unit?._id,
          unitCode: s.unit?.code || 'SE301',
          unitName: s.unit?.name || 'Class Session',
          venue: s.venue || 'Main Lecture Hall',
          date: new Date(s.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          startTime: s.startTime,
          endTime: s.endTime,
          manualPin: s.manual_pin || '',
          classSize,
          attendeesCount: count,
          attendanceRate: classSize > 0 ? Math.round((count / classSize) * 100) : 0,
          status: s.status || (s.ended ? 'ENDED' : 'LIVE'),
          ended: s.ended
        };
      })
    );

    res.status(200).json({ success: true, count: formatted.length, sessions: formatted });
  } catch (error) {
    console.error("Error in getSessionsList:", error);
    res.status(500).json({ success: false, message: "Error fetching sessions list", error: error.message });
  }
};

/**
 * PUT /api/sessions/:id
 * Updates session configuration (venue, duration, manualPin, grace_minutes, status).
 */
exports.updateSession = async (req, res) => {
  try {
    const sessionId = req.params.id || req.params.sessionId;
    if (!sessionId || !mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid session ID format" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const { venue, manualPin, manual_pin, graceMinutes, grace_minutes, durationMinutes, status, endTime } = req.body;

    if (venue !== undefined) session.venue = venue;
    if (manualPin !== undefined || manual_pin !== undefined) {
      session.manual_pin = (manualPin || manual_pin || '').toUpperCase();
    }
    if (graceMinutes !== undefined || grace_minutes !== undefined) {
      session.grace_minutes = parseInt(graceMinutes || grace_minutes, 10);
    }

    // Extend or update end time if duration specified
    if (durationMinutes) {
      const start = new Date(session.startTime);
      session.endTime = new Date(start.getTime() + parseInt(durationMinutes, 10) * 60000);
    } else if (endTime) {
      session.endTime = new Date(endTime);
    }

    // Status transition: ending or re-opening
    if (status === 'ENDED' && !session.ended) {
      session.ended = true;
      session.status = 'ENDED';
      session.endTime = new Date();
      await session.save();
      try {
        await markAbsentees(sessionId);
      } catch (err) {
        console.warn('Could not mark absentees during session update:', err);
      }
    } else if (status === 'LIVE' && session.ended) {
      session.ended = false;
      session.status = 'LIVE';
      session.endTime = new Date(Date.now() + 60 * 60000); // Re-open for 1 hour by default
    }

    await session.save();
    const updated = await Session.findById(sessionId).populate('unit');

    res.status(200).json({
      success: true,
      message: "Session updated successfully",
      session: {
        id: updated._id,
        unitCode: updated.unit?.code,
        unitName: updated.unit?.name,
        venue: updated.venue,
        manualPin: updated.manual_pin,
        startTime: updated.startTime,
        endTime: updated.endTime,
        status: updated.status,
        ended: updated.ended
      }
    });
  } catch (error) {
    console.error("Error in updateSession:", error);
    res.status(500).json({ success: false, message: "Error updating session", error: error.message });
  }
};

/**
 * DELETE /api/sessions/:id
 * Deletes a session and optionally removes unassociated or void attendance records.
 */
exports.deleteSession = async (req, res) => {
  try {
    const sessionId = req.params.id || req.params.sessionId;
    if (!sessionId || !mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid session ID format" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Remove associated attendance records
    await Attendance.deleteMany({ session: sessionId });

    // Cancel any scheduled job for this session
    const jobName = `end-session-${sessionId}`;
    if (schedule.scheduledJobs[jobName]) {
      schedule.cancelJob(jobName);
    }

    await Session.findByIdAndDelete(sessionId);

    res.status(200).json({
      success: true,
      message: "Session and associated records deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteSession:", error);
    res.status(500).json({ success: false, message: "Error deleting session", error: error.message });
  }
};