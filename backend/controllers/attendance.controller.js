const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require("../models/User");
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const Unit = require("../models/Unit");
const excel = require('exceljs');
const { parse } = require('json2csv');
const logger = require('../utils/logger');
const crypto = require('crypto');

exports.markAttendance = async (req, res) => {
  try {
    // Log incoming request for debugging
    console.log("Attendance request received:", {
      sessionId: req.body.sessionId,
      studentId: req.body.studentId,
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceIdLength: req.body.deviceId ? req.body.deviceId.length : 0,
      compositeFingerprintLength: req.body.compositeFingerprint ? req.body.compositeFingerprint.length : 0,
      qrTokenPresent: !!req.body.qrToken,
      browserInfo: !!req.body.browserInfo
    });

    const { sessionId, studentId, deviceId, qrToken, compositeFingerprint, browserInfo } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    // Basic validation with more detailed errors
    if (!qrToken) {
      return res.status(400).json({
        success: false,
        code: "INVALID_QR_CODE",
        message: "QR code data is missing"
      });
    }

    // Validate required parameters
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SESSION_ID",
        message: "Session ID is required"
      });
    }

    if (!studentId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_STUDENT_ID",
        message: "Student ID is required"
      });
    }

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_DEVICE_ID",
        message: "Device ID is required"
      });
    }

    // Decode and validate the QR token with better error handling
    let decodedToken;
    try {
      // First try to decode base64
      let jsonData;
      try {
        jsonData = Buffer.from(qrToken, 'base64').toString();
      } catch (base64Error) {
        console.error("QR Base64 decode error:", base64Error);
        return res.status(400).json({
          success: false,
          code: "QR_FORMAT_ERROR",
          message: "QR code format is invalid (base64 decode failed)"
        });
      }

      try {
        // Then try to parse JSON
        decodedToken = JSON.parse(jsonData);
        console.log("Decoded QR token:", {
          sessionId: decodedToken.s,
          timestamp: decodedToken.t,
          expiresAt: decodedToken.e,
          nonce: decodedToken.n?.slice(0, 8) // Log partial nonce for debugging
        });

      } catch (jsonError) {
        console.error("JSON parse error:", jsonError, "Raw data:", jsonData);
        return res.status(400).json({
          success: false,
          code: "INVALID_QR_FORMAT",
          message: "Invalid QR code format (JSON parse failed)"
        });
      }

      // Verify basic structure
      if (!decodedToken.s || !decodedToken.t || !decodedToken.e || !decodedToken.n) {
        console.error("Missing QR data fields:", decodedToken);
        return res.status(400).json({
          success: false,
          code: "INCOMPLETE_QR_DATA",
          message: "QR code data is incomplete"
        });
      }

      // Verify hash if present, but don't reject if missing (for backward compatibility)
      if (decodedToken.h) {
        const expectedHash = crypto.createHash('sha256')
          .update(`${decodedToken.s}${decodedToken.t}${decodedToken.n}`)
          .digest('hex')
          .slice(0, 32);

        if (expectedHash !== decodedToken.h) {
          console.error("Hash mismatch:", {
            expected: expectedHash,
            received: decodedToken.h
          });
          return res.status(400).json({
            success: false,
            code: "INVALID_QR_HASH",
            message: "The QR code appears to be invalid. Please ask your lecturer to generate a new code."
          });
        }
      }

      // Check expiration with some leniency (add 30 seconds buffer)
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (decodedToken.e && decodedToken.e + 30 < currentTimestamp) {
        return res.status(400).json({
          success: false,
          code: "QR_CODE_EXPIRED",
          message: "QR code has expired. Please scan the current QR code."
        });
      }

    } catch (error) {
      console.error("QR decode error:", error);
      return res.status(400).json({
        success: false,
        code: "QR_DECODE_ERROR",
        message: "Could not read QR code. Please try scanning again."
      });
    }

    // Verify session matching with more detailed errors
    if (decodedToken.s !== sessionId) {
      console.error("Session mismatch:", {
        qrSession: decodedToken.s,
        requestSession: sessionId
      });
      return res.status(400).json({
        success: false,
        code: "SESSION_MISMATCH",
        message: "QR code does not match the current session"
      });
    }

    // Validate MongoDB ObjectIds with clear error messages
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      console.error("Invalid student ID format:", studentId);
      return res.status(400).json({
        success: false,
        code: "INVALID_STUDENT_ID_FORMAT",
        message: "Invalid student ID format provided."
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      console.error("Invalid session ID format:", sessionId);
      return res.status(400).json({
        success: false,
        code: "INVALID_SESSION_ID_FORMAT",
        message: "Invalid session ID format provided."
      });
    }

    if (!deviceId || !compositeFingerprint || !qrToken) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
        message: "Device ID, composite fingerprint, and QR token are required."
      });
    }

    // Authentication validation with better error handling
    let token, decoded;
    try {
      token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          code: "NO_TOKEN_PROVIDED",
          message: "No authentication token provided."
        });
      }

      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        console.error("JWT verification error:", jwtError);
        return res.status(401).json({
          success: false,
          code: "INVALID_TOKEN",
          message: "Invalid or expired authentication token."
        });
      }

      if (decoded.userId !== studentId) {
        return res.status(403).json({
          success: false,
          code: "TOKEN_MISMATCH",
          message: "Unauthorized: Token does not match student ID."
        });
      }
    } catch (authError) {
      console.error("Authentication error:", authError);
      return res.status(401).json({
        success: false,
        code: "AUTH_ERROR",
        message: "Authentication error occurred."
      });
    }

    // Find session with better error handling
    let session;
    try {
      session = await Session.findById(sessionId);

      if (!session) {
        console.error("Session not found:", sessionId);
        return res.status(404).json({
          success: false,
          code: "SESSION_NOT_FOUND",
          message: "Session not found."
        });
      }
    } catch (dbError) {
      console.error("Database error when finding session:", dbError);
      return res.status(500).json({
        success: false,
        code: "DB_ERROR",
        message: "Database error occurred when retrieving session."
      });
    }

    // Check if session is manually ended OR time has elapsed
    const now = new Date();
    if (session.ended || now < session.startTime || now > session.endTime) {
      return res.status(400).json({
        success: false,
        code: "SESSION_INACTIVE",
        message: "Session is not active or has ended."
      });
    }

    if (!session.qrToken || session.qrToken !== qrToken) {
      console.error("QR token mismatch:", {
        expected: session.qrToken ? session.qrToken.substring(0, 20) + '...' : 'null',
        received: qrToken ? qrToken.substring(0, 20) + '...' : 'null'
      });
      return res.status(400).json({
        success: false,
        code: "INVALID_QR_CODE",
        message: "Invalid QR code for this session."
      });
    }

    // IMPORTANT: First check for device conflicts BEFORE checking if this student already marked attendance
    // Enhanced device conflict detection
    try {
      const existingDeviceRecords = await Attendance.find({
        session: sessionId,
        status: "Present"
      });

      // 1. Advanced device collision detection with multiple layers
      let deviceConflict = false;
      let conflictType = "";
      let conflictStudent = null;

      // Check for exact device ID or fingerprint matches
      const exactDeviceMatches = existingDeviceRecords.filter(record =>
        record.deviceId === deviceId || record.compositeFingerprint === compositeFingerprint
      );

      if (exactDeviceMatches.length > 0) {
        // Check if this is a different student trying to use the same device
        const differentStudentSameDevice = exactDeviceMatches.some(record =>
          record.student.toString() !== studentId.toString()
        );

        if (differentStudentSameDevice) {
          deviceConflict = true;
          conflictType = "exact";

          // Log which student used the same device
          const conflictingStudentRecord = exactDeviceMatches.find(r => r.student.toString() !== studentId.toString());
          if (conflictingStudentRecord) {
            conflictStudent = conflictingStudentRecord.student.toString();
          }
        } else {
          // Same student using the same device (fall through to check if already marked attendance)
          // This will be caught by the existingStudentRecord check below
        }
      }

      // If no exact match, check for IP address
      if (!deviceConflict) {
        const ipBasedRecords = existingDeviceRecords.filter(record => record.ipAddress === clientIp);
        if (ipBasedRecords.length > 0) {
          // Check if this student already has a record from this IP
          const sameStudentSameIp = ipBasedRecords.some(record =>
            record.student.toString() === studentId.toString()
          );

          // If different students are using the same IP, it's suspicious
          if (!sameStudentSameIp) {
            // Get conflicting student details for audit
            const conflictRecords = ipBasedRecords.filter(r => r.student.toString() !== studentId.toString());
            if (conflictRecords.length > 0) {
              const studentIds = [...new Set(conflictRecords.map(r => r.student.toString()))];

              // If we have multiple students from same IP in this session, flag it
              if (studentIds.length > 0) {
                deviceConflict = true;
                conflictType = "ip";
                conflictStudent = studentIds[0]; // Record the first conflicting student

                // Log this suspicious activity for further investigation
                logger.warn(`IP conflict detected: Student ${studentId} attempting to mark attendance from same IP as students [${studentIds.join(', ')}] for session ${sessionId}`);
              }
            }
          }
        }
      }

      // If no exact match or IP match, check for partial fingerprint similarity
      if (!deviceConflict && compositeFingerprint && compositeFingerprint.length > 20) {
        for (const record of existingDeviceRecords) {
          // Skip records from the same student
          if (record.student.toString() === studentId.toString()) continue;

          if (record.compositeFingerprint && record.compositeFingerprint.length > 20) {
            // Calculate similarity score between fingerprints
            const similarityScore = calculateFingerprintSimilarity(compositeFingerprint, record.compositeFingerprint);

            // If similarity is above threshold, consider it a match
            if (similarityScore > 0.65) { // Lowered threshold to catch cross-browser attempts
              deviceConflict = true;
              conflictType = "similar";
              conflictStudent = record.student.toString();
              break;
            }
          }
        }
      }

      // Check for rapid switching (time-based heuristic)
      if (!deviceConflict) {
        // Find the most recent attendance record from this IP address
        const recentAttendanceFromSameIP = await Attendance.findOne({
          session: sessionId,
          ipAddress: clientIp,
          student: { $ne: mongoose.Types.ObjectId(studentId) } // Different student
        }).sort({ createdAt: -1 }); // Most recent first

        if (recentAttendanceFromSameIP) {
          // If there was another attendance from same IP within the last 2 minutes
          const timeSinceLastAttendance = Date.now() - recentAttendanceFromSameIP.createdAt.getTime();
          const twoMinutesInMs = 2 * 60 * 1000;

          if (timeSinceLastAttendance < twoMinutesInMs) {
            deviceConflict = true;
            conflictType = "timing";
            conflictStudent = recentAttendanceFromSameIP.student.toString();

            // Log suspicious rapid attendance marking
            logger.warn(`Timing conflict: Student ${studentId} attempting to mark attendance ${timeSinceLastAttendance / 1000} seconds after student ${conflictStudent} from same IP ${clientIp}`);
          }
        }
      }

      // If there's a device conflict, reject the request with a clear message
      if (deviceConflict) {
        // Record this attempt for auditing
        try {
          await new Attendance({
            session: sessionId,
            student: studentId,
            status: "Rejected",
            deviceId,
            compositeFingerprint,
            qrToken,
            attendedAt: new Date(),
            ipAddress: clientIp,
            conflictType,
            conflictingStudent: conflictStudent,
            rejectionReason: `Device conflict detected: ${conflictType}`,
            browserInfo: browserInfo || null
          }).save();
        } catch (saveError) {
          console.error("Error saving conflict attendance record:", saveError);
          // Continue execution even if saving the conflict record fails
        }

        // Return a clear device conflict error
        return res.status(403).json({
          success: false,
          code: "DEVICE_CONFLICT",
          message: "This device has already been used to mark attendance for another student. Please use your own device.",
          conflictType: conflictType
        });
      }
    } catch (deviceCheckError) {
      console.error("Error during device conflict check:", deviceCheckError);
      // Don't fail the entire request due to device conflict check error
      // Just log it and continue processing
    }

    // After checking for device conflicts, check if this student already marked attendance
    try {
      const existingStudentRecord = await Attendance.findOne({
        session: sessionId,
        student: studentId,
        $or: [
          { status: "Present" },
          { status: "Rejected" }
        ]
      });

      if (existingStudentRecord) {
        const status = existingStudentRecord.status;
        let message = "You have already marked attendance for this session.";
        let code = "ATTENDANCE_ALREADY_MARKED";

        if (status === "Rejected") {
          if (existingStudentRecord.rejectionReason && existingStudentRecord.rejectionReason.includes("Device conflict")) {
            message = "Your previous attempt was rejected due to device conflict. Please use your own device.";
            code = "DEVICE_CONFLICT";
          } else {
            message = "Your previous attendance submission was rejected. Please contact your lecturer.";
            code = "PREVIOUS_ATTENDANCE_REJECTED";
          }
        }

        return res.status(400).json({
          success: false,
          code: code,
          message: message
        });
      }
    } catch (recordError) {
      console.error("Database error when checking existing attendance:", recordError);
      return res.status(500).json({
        success: false,
        code: "DB_ERROR",
        message: "Database error occurred when checking attendance records."
      });
    }

    // Create new attendance record
    try {
      const attendance = new Attendance({
        session: sessionId,
        student: studentId,
        status: "Present",
        deviceId,
        compositeFingerprint,
        qrToken,
        attendedAt: new Date(),
        ipAddress: clientIp, // Store client IP for detection
        browserInfo: browserInfo || null
      });

      await attendance.save();
    } catch (saveAttendanceError) {
      console.error("Error saving attendance record:", saveAttendanceError);
      return res.status(500).json({
        success: false,
        code: "ATTENDANCE_SAVE_ERROR",
        message: "Failed to save attendance record. Please try again."
      });
    }

    // Update session attendees
    try {
      if (!session.attendees.some(a => a.student.toString() === studentId)) {
        session.attendees.push({ student: studentId });
        await session.save();
      }
    } catch (updateSessionError) {
      console.error("Error updating session attendees:", updateSessionError);
      // Already saved attendance, so don't fail the request here
    }

    res.status(201).json({
      success: true,
      message: "Attendance marked as Present."
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later."
    });
  }
};

/**
 * Enhanced fingerprint similarity calculation
 * More sensitive to detect cross-browser attempts from same device
 */
function calculateFingerprintSimilarity(fp1, fp2) {
  // Handle null or empty cases
  if (!fp1 || !fp2 || fp1.length < 10 || fp2.length < 10) {
    return 0;
  }

  try {
    // For hex fingerprints (most common case)
    if (/^[0-9a-f]+$/i.test(fp1) && /^[0-9a-f]+$/i.test(fp2)) {
      // Take character chunks for comparison with overlapping
      const chunkSize = 4; // Larger chunks for better detection
      const set1 = new Set();
      const set2 = new Set();

      // Create sets of chunks from fingerprints with overlapping
      for (let i = 0; i < fp1.length - chunkSize + 1; i += 2) { // Step by 2 for overlapping
        set1.add(fp1.substring(i, i + chunkSize));
      }

      for (let i = 0; i < fp2.length - chunkSize + 1; i += 2) { // Step by 2 for overlapping
        set2.add(fp2.substring(i, i + chunkSize));
      }

      // Calculate Jaccard similarity: intersection size / union size
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);

      // Return the Jaccard coefficient
      return intersection.size / union.size;
    }
    // For non-hex fingerprints
    else {
      // Split strings and find common substrings
      const parts1 = fp1.split(/[-,_\s]/);
      const parts2 = fp2.split(/[-,_\s]/);

      // Weight matching by length (longer matches count more)
      let totalWeight = 0;
      let matchingWeight = 0;

      for (const part1 of parts1) {
        if (part1.length < 3) continue; // Skip very short parts

        const weight = Math.sqrt(part1.length); // Weight by square root of length
        totalWeight += weight;

        // Find best matching part in parts2
        let bestMatchScore = 0;
        for (const part2 of parts2) {
          if (part2.length < 3) continue;

          if (part1 === part2) {
            bestMatchScore = 1; // Exact match
            break;
          }

          // Check for substring or partial match
          if (part1.includes(part2) || part2.includes(part1)) {
            const matchLength = Math.min(part1.length, part2.length);
            const maxLength = Math.max(part1.length, part2.length);
            const matchScore = matchLength / maxLength;
            bestMatchScore = Math.max(bestMatchScore, matchScore);
          }
        }

        matchingWeight += weight * bestMatchScore;
      }

      return totalWeight > 0 ? matchingWeight / totalWeight : 0;
    }
  } catch (error) {
    console.error("Error calculating fingerprint similarity:", error);
    return 0; // Return no similarity on error
  }
}

exports.markAbsentees = async (sessionId) => {
  try {
    console.log(`Starting markAbsentees for session ${sessionId}`);

    const session = await Session.findById(sessionId).populate({
      path: 'unit',
      populate: { path: 'studentsEnrolled', model: 'User' }
    });

    if (!session || !session.unit) {
      console.error("Session or unit not found for sessionId:", sessionId);
      throw new Error("Session or unit not found");
    }

    const enrolledStudents = session.unit.studentsEnrolled.map(student => student._id.toString());
    console.log(`Found ${enrolledStudents.length} enrolled students`);

    if (enrolledStudents.length === 0) {
      console.log("No students enrolled in unit for session:", sessionId);
      return;
    }

    // Get existing attendance records
    const existingAttendance = await Attendance.find({ session: sessionId }).select('student');
    const markedStudents = new Set(existingAttendance.map(record => record.student.toString()));
    console.log(`Found ${markedStudents.size} existing attendance records`);

    // Find students who haven't marked attendance
    const absentees = enrolledStudents.filter(studentId => !markedStudents.has(studentId));
    console.log(`Found ${absentees.length} absentees to mark`);

    if (absentees.length === 0) {
      console.log("All enrolled students marked attendance for session:", sessionId);
      return;
    }

    // Create attendance records for absentees
    const absenteeRecords = absentees.map(studentId => ({
      session: sessionId,
      student: studentId,
      status: "Absent",
      deviceId: "system-generated",
      compositeFingerprint: "system-generated",
      qrToken: "system-generated",
      timestamp: new Date(),
      feedbackSubmitted: false
    }));

    await Attendance.insertMany(absenteeRecords);
    console.log(`Successfully marked ${absentees.length} students as absent for session:`, sessionId);

    return absentees.length; // Return number of marked absentees
  } catch (error) {
    console.error("Error in markAbsentees:", error);
    throw error;
  }
};

exports.handleSessionEnd = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID format" });
    }

    await exports.markAbsentees(sessionId);
    res.status(200).json({ message: "Absent students marked successfully" });
  } catch (error) {
    console.error("Error processing session end:", error);
    res.status(500).json({ message: "Error processing absentees", error: error.message });
  }
};

exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Modified query to get all attendance records for the student without filtering by status
    const attendanceRecords = await Attendance.find({ student: studentId })
      .select('session status attendedAt')
      .populate({
        path: 'session',
        select: 'unit startTime endTime',
        populate: { path: 'unit', select: 'name' }
      })
      .sort({ attendedAt: -1 });

    console.log('Found attendance records:', attendanceRecords); // Debug log

    if (!attendanceRecords.length) {
      return res.status(200).json({
        attendanceRecords: [],
        weeklyEvents: [],
        dailyEvents: []
      });
    }

    // Process daily events with all records
    const dailyEvents = {};
    attendanceRecords.forEach(record => {
      const sessionDate = new Date(record.attendedAt || record.session.startTime);
      const dateStr = sessionDate.toISOString().split('T')[0];

      if (!dailyEvents[dateStr]) {
        dailyEvents[dateStr] = [];
      }

      dailyEvents[dateStr].push({
        unitName: record.session.unit?.name || 'Unknown',
        status: record.status || 'Unknown',
        startTime: record.session.startTime,
      });
    });

    // Process weekly events using same calendar structure as daily
    const weeklyEvents = {};
    attendanceRecords.forEach(record => {
      const sessionDate = new Date(record.attendedAt || record.session.startTime);
      const startOfWeek = new Date(sessionDate);
      startOfWeek.setDate(sessionDate.getDate() - sessionDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const weekLabel = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

      if (!weeklyEvents[weekLabel]) {
        weeklyEvents[weekLabel] = [];
      }

      weeklyEvents[weekLabel].push({
        unitName: record.session.unit?.name || 'Unknown',
        status: record.status || 'Unknown',
        startTime: record.session.startTime,
      });
    });

    const dailyData = Object.entries(dailyEvents).map(([date, events]) => ({
      date,
      events
    }));

    const weeklyData = Object.entries(weeklyEvents).map(([week, events]) => ({
      week,
      events
    }));

    const response = {
      attendanceRecords,
      weeklyEvents: weeklyData,
      dailyEvents: dailyData
    };

    console.log('Sending response:', response); // Debug log

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getStudentAttendance:", error);
    res.status(500).json({ message: "Error fetching attendance records", error: error.message });
  }
};

exports.getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID format" });
    }
    const attendanceRecords = await Attendance.find({ session: sessionId })
      .populate({
        path: 'student',
        select: 'regNo firstName lastName course year semester',
        populate: { path: 'course', select: 'name' }
      })
      .populate('session', 'unit')
      .select('regNo course year semester status deviceId qrToken');
    res.status(200).json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: "Error fetching session attendance", error: error.message });
  }
};

exports.getStudentAttendanceByFilter = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { filter, startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    let query = { student: studentId };
    if (startDate && endDate) {
      query.attendedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (filter === '30days') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      query.attendedAt = { $gte: thirtyDaysAgo };
    }

    const attendanceRecords = await Attendance.find(query)
      .select('session status attendedAt')
      .populate({
        path: 'session',
        select: 'unit startTime endTime',
        populate: { path: 'unit', select: 'name' }
      })
      .sort({ attendedAt: -1 });

    if (!attendanceRecords.length) {
      return res.status(200).json({ events: [] });
    }

    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const semesterStartDate = new Date('2025-01-01');

    const formatEvent = (record) => ({
      unitName: record.session.unit?.name || 'Unknown',
      status: record.status,
      startTime: record.session.startTime,
    });

    let events = [];
    switch (filter) {
      case 'daily':
      case '30days':
        const dailyEvents = {};
        attendanceRecords.forEach(record => {
          const dateStr = new Date(record.attendedAt || record.session.startTime).toISOString().split('T')[0];
          if (!dailyEvents[dateStr]) dailyEvents[dateStr] = [];
          dailyEvents[dateStr].push(formatEvent(record));
        });
        events = Object.entries(dailyEvents).map(([date, evts]) => ({ date, events: evts }));
        break;
      case 'weekly':
        const weeklyEvents = {};
        attendanceRecords.forEach(record => {
          const sessionDate = new Date(record.attendedAt || record.session.startTime);
          const daysSinceStart = Math.floor((sessionDate - semesterStartDate) / oneDay);
          const weekNumber = Math.floor(daysSinceStart / 7) + 1;
          const weekStart = new Date(semesterStartDate.getTime() + (weekNumber - 1) * oneWeek);
          const weekEnd = new Date(weekStart.getTime() + 6 * oneDay);
          const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
          if (!weeklyEvents[weekLabel]) weeklyEvents[weekLabel] = [];
          weeklyEvents[weekLabel].push(formatEvent(record));
        });
        events = Object.entries(weeklyEvents).map(([week, evts]) => ({ week, events: evts }));
        break;
      default:
        return res.status(400).json({ message: "Invalid filter. Use 'daily', 'weekly', or '30days'" });
    }

    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ message: "Error fetching filtered attendance", error: error.message });
  }
};

exports.updateAttendanceStatus = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
      return res.status(400).json({ message: "Invalid attendance ID format" });
    }
    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      { status },
      { new: true }
    );
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Error updating attendance status", error: error.message });
  }
};

exports.getAttendanceTrends = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(unitId)) {
      return res.status(400).json({ message: "Invalid unit ID format" });
    }

    let query = { unit: unitId };
    if (startDate && endDate) {
      query.startTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const sessions = await Session.find(query)
      .sort({ startTime: 1 })
      .select('startTime _id');

    if (!sessions.length) {
      return res.status(200).json({ labels: [], present: [], absent: [], rates: [] });
    }

    const trends = await Promise.all(sessions.map(async (session) => {
      const stats = await Attendance.aggregate([
        { $match: { session: session._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      const presentCount = stats.find(stat => stat._id === "Present")?.count || 0;
      const absentCount = stats.find(stat => stat._id === "Absent")?.count || 0;
      const total = presentCount + absentCount;
      const rate = total > 0 ? (presentCount / total) * 100 : 0;

      return {
        date: session.startTime.toISOString().split('T')[0],
        present: presentCount,
        absent: absentCount,
        rate: Number(rate.toFixed(1))
      };
    }));

    const response = {
      labels: trends.map(t => t.date),
      present: trends.map(t => t.present),
      absent: trends.map(t => t.absent),
      rates: trends.map(t => t.rate)
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching attendance trends:", error);
    res.status(500).json({ message: "Error fetching attendance trends", error: error.message });
  }
};

exports.getCourseAttendanceRate = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const pipeline = [
      { $match: { course: new mongoose.Types.ObjectId(courseId) } },
      {
        $lookup: {
          from: 'sessions',
          localField: '_id',
          foreignField: 'unit',
          as: 'sessions'
        }
      },
      { $unwind: { path: '$sessions', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'attendances',
          localField: 'sessions._id',
          foreignField: 'session',
          as: 'attendance'
        }
      },
      {
        $project: {
          unitId: '$_id',
          studentsEnrolledCount: { $size: { $ifNull: ['$studentsEnrolled', []] } },
          sessionId: '$sessions._id',
          sessionStartTime: '$sessions.startTime',
          attendance: 1
        }
      },
      {
        $group: {
          _id: '$sessionId',
          unitId: { $first: '$unitId' },
          startTime: { $first: '$sessionStartTime' },
          studentsEnrolledCount: { $first: '$studentsEnrolledCount' },
          present: {
            $sum: {
              $cond: [{ $in: ['Present', '$attendance.status'] }, 1, 0]
            }
          },
          totalPossible: { $first: '$studentsEnrolledCount' }
        }
      },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalPresent: { $sum: '$present' },
                totalPossible: { $sum: '$totalPossible' }
              }
            }
          ],
          dailyTrends: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
                present: { $sum: '$present' },
                absent: { $sum: { $subtract: ['$totalPossible', '$present'] } },
                possible: { $sum: '$totalPossible' },
                sessions: { $push: { sessionId: '$_id', present: '$present', absent: { $subtract: ['$totalPossible', '$present'] }, rate: { $cond: [{ $gt: ['$totalPossible', 0] }, { $multiply: [{ $divide: ['$present', '$totalPossible'] }, 100] }, 0] } } }
              }
            },
            {
              $project: {
                date: '$_id',
                present: 1,
                absent: 1,
                rate: { $cond: [{ $gt: ['$possible', 0] }, { $round: [{ $multiply: [{ $divide: ['$present', '$possible'] }, 100] }, 0] }, 0] },
                sessionCount: { $size: '$sessions' },
                sessions: 1,
                _id: 0
              }
            }
          ],
          weeklyTrends: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%U',
                    date: '$startTime'
                  }
                },
                present: { $sum: '$present' },
                absent: { $sum: { $subtract: ['$totalPossible', '$present'] } },
                possible: { $sum: '$totalPossible' },
                sessions: { $push: { sessionId: '$_id', present: '$present', absent: { $subtract: ['$totalPossible', '$present'] }, rate: { $cond: [{ $gt: ['$totalPossible', 0] }, { $multiply: [{ $divide: ['$present', '$totalPossible'] }, 100] }, 0] } } },
                weekStart: { $min: '$startTime' }
              }
            },
            {
              $project: {
                week: {
                  $concat: [
                    { $dateToString: { format: '%b %d', date: '$weekStart' } },
                    ' - ',
                    { $dateToString: { format: '%b %d, %Y', date: { $dateAdd: { startDate: '$weekStart', unit: 'day', amount: 6 } } } }
                  ]
                },
                present: 1,
                absent: 1,
                rate: { $cond: [{ $gt: ['$possible', 0] }, { $round: [{ $multiply: [{ $divide: ['$present', '$possible'] }, 100] }, 0] }, 0] },
                sessionCount: { $size: '$sessions' },
                sessions: 1,
                _id: 0
              }
            }
          ]
        }
      }
    ];

    const result = await Unit.aggregate(pipeline);

    if (!result.length || !result[0].overall.length) {
      return res.status(200).json({
        totalPresent: 0,
        totalPossible: 0,
        weeklyTrends: [],
        dailyTrends: []
      });
    }

    const { overall, dailyTrends, weeklyTrends } = result[0];
    const { totalPresent, totalPossible } = overall[0] || { totalPresent: 0, totalPossible: 0 };

    res.status(200).json({
      totalPresent,
      totalPossible,
      weeklyTrends: weeklyTrends.sort((a, b) => (a.week || "").localeCompare(b.week || "")),
      dailyTrends: dailyTrends.sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    });
  } catch (error) {
    console.error("Error fetching course attendance rate:", error);
    res.status(500).json({ message: "Error fetching attendance rate", error: error.message });
  }
};

exports.getPendingFeedbackAttendance = async (req, res) => {
  try {
    const studentId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const attendanceRecords = await Attendance.find({
      student: studentId,
      status: "Present",
      feedbackSubmitted: false
    })
      .populate({
        path: 'session',
        select: '_id unit ended feedbackEnabled endTime',
        match: { ended: true, feedbackEnabled: true },
        populate: {
          path: 'unit',
          select: 'name'
        }
      })
      .select('status feedbackSubmitted');

    const filteredRecords = attendanceRecords.filter(record => record.session !== null);

    console.log('Pending Feedback Attendance Records:', filteredRecords);

    res.status(200).json({
      pendingFeedbackRecords: filteredRecords
    });
  } catch (error) {
    console.error('Error fetching pending feedback attendance:', error);
    res.status(500).json({ message: "Error fetching pending feedback attendance", error: error.message });
  }
};

exports.checkFeedbackStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID format" });
    }

    const attendance = await Attendance.findOne({
      session: sessionId,
      student: req.user.userId,
    });

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.status(200).json({ feedbackSubmitted: attendance.feedbackSubmitted });
  } catch (error) {
    console.error("Error checking feedback status:", error);
    res.status(500).json({ message: "Error checking feedback status", error: error.message });
  }
};

// Updated endpoint to fetch attendance records for all lecturer's units with filters
exports.getLecturerUnitAttendance = async (req, res) => {
  try {
    const lecturerId = req.user.userId; // From authenticated middleware
    const { unitId, startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(lecturerId)) {
      return res.status(400).json({ message: "Invalid lecturer ID format" });
    }

    // Fetch all units assigned to the lecturer
    const unitQuery = { lecturer: lecturerId };
    if (unitId && mongoose.Types.ObjectId.isValid(unitId)) {
      unitQuery._id = unitId; // Filter by specific unit if provided
    }
    const units = await Unit.find(unitQuery).select('_id');
    const unitIds = units.map(unit => unit._id);

    if (!unitIds.length) {
      return res.status(200).json([]); // No units assigned, return empty array
    }

    // Fetch sessions for these units
    const sessionQuery = { unit: { $in: unitIds } };
    const sessions = await Session.find(sessionQuery).select('_id unit');
    const sessionIds = sessions.map(session => session._id);

    if (!sessionIds.length) {
      return res.status(200).json([]); // No sessions found, return empty array
    }

    // Fetch attendance records with optional date filters
    const attendanceQuery = { session: { $in: sessionIds } };
    if (startDate && endDate) {
      attendanceQuery.attendedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate({
        path: 'student',
        select: 'regNo firstName lastName course year semester',
        populate: { path: 'course', select: 'name' }
      })
      .populate('session', 'unit startTime endTime')
      .select('session status attendedAt');

    res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching lecturer unit attendance:", error);
    res.status(500).json({ message: "Error fetching attendance records", error: error.message });
  }
};

exports.getRealTimeAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const session = await Session.findById(sessionId);
    if (!session || session.ended) {
      return res.status(404).json({ message: "No active session found" });
    }

    const attendanceRecords = await Attendance.find({ session: sessionId })
      .populate({
        path: 'student',
        select: 'regNo firstName lastName'
      })
      .select('status attendedAt');

    res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching real-time attendance:", error);
    res.status(500).json({ message: "Error fetching real-time data", error: error.message });
  }
};
exports.getLecturerRealTimeAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const session = await Session.findById(sessionId);
    if (!session || session.ended) {
      return res.status(404).json({ message: "No active session found" });
    }

    const attendanceRecords = await Attendance.find({ session: sessionId })
      .populate({
        path: 'student',
        select: 'regNo firstName lastName'
      })
      .select('status attendedAt');

    res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching lecturer real-time attendance:", error);
    res.status(500).json({ message: "Error fetching real-time data", error: error.message });
  }
};

exports.getLecturerPastAttendance = async (req, res) => {
  try {
    const lecturerId = req.user.userId;
    const { startDate, endDate, unitId } = req.query;

    console.log('Query params:', { startDate, endDate, unitId }); // Debug log

    if (!mongoose.Types.ObjectId.isValid(lecturerId)) {
      return res.status(400).json({ message: "Invalid lecturer ID format" });
    }

    // Build unit query
    const unitQuery = { lecturer: lecturerId };
    if (unitId && mongoose.Types.ObjectId.isValid(unitId)) {
      unitQuery._id = unitId;
    }

    // Get lecturer's units
    const units = await Unit.find(unitQuery).select('_id name');
    const unitIds = units.map(unit => unit._id);

    if (!unitIds.length) {
      return res.status(200).json([]);
    }

    // Build session query with proper date handling
    const sessionQuery = {
      unit: { $in: unitIds },
      ended: true
    };

    if (startDate || endDate) {
      sessionQuery.$or = [
        // Check session start/end times
        {
          startTime: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) })
          }
        },
        // Check session creation/update times
        {
          createdAt: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) })
          }
        }
      ];
    }

    console.log('Session Query:', JSON.stringify(sessionQuery, null, 2)); // Debug log

    const sessions = await Session.find(sessionQuery)
      .populate('unit', 'name')
      .select('_id unit startTime endTime')
      .sort({ startTime: -1 });

    console.log(`Found ${sessions.length} sessions`); // Debug log

    if (!sessions.length) {
      return res.status(200).json([]);
    }

    // Build attendance query with proper date handling
    const sessionIds = sessions.map(session => session._id);
    const attendanceQuery = {
      session: { $in: sessionIds }
    };

    if (startDate || endDate) {
      attendanceQuery.$or = [
        {
          attendedAt: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) })
          }
        },
        {
          timestamp: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) })
          }
        },
        {
          createdAt: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) })
          }
        }
      ];
    }

    console.log('Attendance Query:', JSON.stringify(attendanceQuery, null, 2)); // Debug log

    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate({
        path: 'student',
        select: 'regNo firstName lastName course year semester',
        populate: { path: 'course', select: 'name' }
      })
      .populate({
        path: 'session',
        select: 'unit startTime endTime',
        populate: { path: 'unit', select: 'name' }
      })
      .select('session status attendedAt timestamp createdAt');

    console.log(`Found ${attendanceRecords.length} attendance records`); // Debug log

    // Group attendance records by session with additional metadata
    const sessionsWithAttendance = sessions.map(session => {
      const sessionAttendance = attendanceRecords.filter(
        record => record.session._id.toString() === session._id.toString()
      );

      return {
        sessionId: session._id,
        unitName: session.unit.name,
        unit: session.unit._id,
        startTime: session.startTime,
        endTime: session.endTime,
        attendance: sessionAttendance,
        totalPresent: sessionAttendance.filter(r => r.status === 'Present').length,
        totalAbsent: sessionAttendance.filter(r => r.status === 'Absent').length
      };
    });

    res.status(200).json(sessionsWithAttendance);
  } catch (error) {
    console.error("Error fetching lecturer past attendance:", error);
    res.status(500).json({ message: "Error fetching attendance records", error: error.message });
  }
};

// New controller method to get attendance rate for a specific unit
exports.getUnitAttendanceRate = async (req, res) => {
  try {
    const { unitId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(unitId)) {
      return res.status(400).json({ message: "Invalid unit ID format" });
    }

    // Fetch the unit to check if it exists
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // Find sessions for this unit
    const sessions = await Session.find({ unit: unitId }).select('_id');
    if (!sessions.length) {
      return res.status(200).json({
        totalPresent: 0,
        totalPossible: 0,
        weeklyTrends: [],
        dailyTrends: []
      });
    }

    const sessionIds = sessions.map(s => s._id);

    // Get all attendance records for these sessions
    const attendanceRecords = await Attendance.find({
      session: { $in: sessionIds }
    }).populate({
      path: 'session',
      select: 'startTime _id unit',
    });

    if (!attendanceRecords.length) {
      return res.status(200).json({
        totalPresent: 0,
        totalPossible: 0,
        weeklyTrends: [],
        dailyTrends: []
      });
    }

    // Group attendance by session
    const sessionAttendance = {};
    attendanceRecords.forEach(record => {
      const sessionId = record.session._id.toString();
      if (!sessionAttendance[sessionId]) {
        sessionAttendance[sessionId] = {
          session: record.session,
          present: 0,
          absent: 0,
          startTime: record.session.startTime
        };
      }

      if (record.status === 'Present') {
        sessionAttendance[sessionId].present += 1;
      } else if (record.status === 'Absent') {
        sessionAttendance[sessionId].absent += 1;
      }
    });

    // Convert to array and sort by startTime
    const sessionsArray = Object.values(sessionAttendance).sort((a, b) =>
      new Date(a.startTime) - new Date(b.startTime)
    );

    // Calculate totals
    const totalPresent = sessionsArray.reduce((sum, s) => sum + s.present, 0);
    const totalPossible = sessionsArray.reduce((sum, s) => sum + s.present + s.absent, 0);

    // Group by day
    const dailyTrends = {};
    sessionsArray.forEach(s => {
      const date = new Date(s.startTime).toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dailyTrends[date]) {
        dailyTrends[date] = {
          date,
          present: 0,
          absent: 0,
          sessions: [],
          sessionCount: 0
        };
      }

      dailyTrends[date].present += s.present;
      dailyTrends[date].absent += s.absent;
      dailyTrends[date].sessions.push({
        sessionId: s.session._id,
        unit: unitId,
        present: s.present,
        absent: s.absent,
        rate: s.present + s.absent > 0 ? Math.round((s.present / (s.present + s.absent)) * 100) : 0
      });
      dailyTrends[date].sessionCount += 1;
    });

    // Calculate daily rates
    Object.values(dailyTrends).forEach(day => {
      day.rate = day.present + day.absent > 0 ?
        Math.round((day.present / (day.present + day.absent)) * 100) : 0;
    });

    // Group by week
    const weeklyTrends = {};
    sessionsArray.forEach(s => {
      const date = new Date(s.startTime);
      const year = date.getFullYear();
      const weekNumber = getISOWeek(date);
      const weekStart = getStartOfWeek(date);
      const weekEnd = getEndOfWeek(date);
      const weekKey = `${year}-W${weekNumber}`;

      const formattedWeek = `${formatDate(weekStart, 'MMM D')} - ${formatDate(weekEnd, 'MMM D, YYYY')}`;

      if (!weeklyTrends[weekKey]) {
        weeklyTrends[weekKey] = {
          week: formattedWeek,
          present: 0,
          absent: 0,
          sessions: [],
          sessionCount: 0
        };
      }

      weeklyTrends[weekKey].present += s.present;
      weeklyTrends[weekKey].absent += s.absent;
      weeklyTrends[weekKey].sessions.push({
        sessionId: s.session._id,
        unit: unitId,
        present: s.present,
        absent: s.absent,
        rate: s.present + s.absent > 0 ? Math.round((s.present / (s.present + s.absent)) * 100) : 0
      });
      weeklyTrends[weekKey].sessionCount += 1;
    });

    // Calculate weekly rates
    Object.values(weeklyTrends).forEach(week => {
      week.rate = week.present + week.absent > 0 ?
        Math.round((week.present / (week.present + week.absent)) * 100) : 0;
    });

    // Format response
    res.status(200).json({
      totalPresent,
      totalPossible,
      weeklyTrends: Object.values(weeklyTrends).sort((a, b) => a.week.localeCompare(b.week)),
      dailyTrends: Object.values(dailyTrends).sort((a, b) => a.date.localeCompare(b.date))
    });
  } catch (error) {
    console.error("Error fetching unit attendance rate:", error);
    res.status(500).json({ message: "Error fetching unit attendance rate", error: error.message });
  }
};

// Helper functions for date manipulation
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
}

function getEndOfWeek(date) {
  const d = new Date(getStartOfWeek(date));
  d.setDate(d.getDate() + 6);
  return d;
}

function formatDate(date, format) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  const day = d.getDate();

  return format
    .replace('YYYY', year)
    .replace('MMM', month)
    .replace('D', day);
}

// Export attendance data for a specific unit
exports.exportUnitAttendance = async (req, res) => {
  try {
    const { unitId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(unitId)) {
      return res.status(400).json({ message: "Invalid unit ID format" });
    }

    // Find the unit to get its details
    const unit = await Unit.findById(unitId).populate('lecturer', 'firstName lastName');
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // Get all sessions for this unit
    const sessions = await Session.find({ unit: unitId });
    if (!sessions.length) {
      return res.status(404).json({ message: "No sessions found for this unit" });
    }

    const sessionIds = sessions.map(s => s._id);

    // Get all attendance records for these sessions
    const attendanceRecords = await Attendance.find({ session: { $in: sessionIds } })
      .populate({
        path: 'student',
        select: 'regNo firstName lastName'
      })
      .populate({
        path: 'session',
        select: 'startTime endTime'
      })
      .sort({ 'session.startTime': -1, 'student.regNo': 1 });

    // Process data for export
    const exportData = attendanceRecords.map(record => ({
      'Session Date': new Date(record.session.startTime).toLocaleDateString(),
      'Session Time': `${new Date(record.session.startTime).toLocaleTimeString()} - ${new Date(record.session.endTime).toLocaleTimeString()}`,
      'Registration Number': record.student.regNo,
      'First Name': record.student.firstName,
      'Last Name': record.student.lastName,
      'Status': record.status,
      'Attendance Time': record.attendedAt ? new Date(record.attendedAt).toLocaleTimeString() : 'N/A'
    }));

    // Determine export format based on request headers
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/json')) {
      return res.json(exportData);
    }

    // Default to Excel export
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    // Add headers
    worksheet.columns = [
      { header: 'Session Date', key: 'Session Date', width: 15 },
      { header: 'Session Time', key: 'Session Time', width: 25 },
      { header: 'Registration Number', key: 'Registration Number', width: 20 },
      { header: 'First Name', key: 'First Name', width: 15 },
      { header: 'Last Name', key: 'Last Name', width: 15 },
      { header: 'Status', key: 'Status', width: 12 },
      { header: 'Attendance Time', key: 'Attendance Time', width: 18 }
    ];

    // Add title row with unit info
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Attendance Report for ${unit.name} (${unit.code})`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    // Add metadata row
    worksheet.mergeCells('A2:G2');
    const metaCell = worksheet.getCell('A2');
    metaCell.value = `Generated on ${new Date().toLocaleString()} | Lecturer: ${unit.lecturer?.firstName || ''} ${unit.lecturer?.lastName || ''}`;
    metaCell.font = { size: 12, italic: true };
    metaCell.alignment = { horizontal: 'center' };

    // Add empty row
    worksheet.addRow({});

    // Style the header row
    worksheet.getRow(4).font = { bold: true };
    worksheet.getRow(4).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' }
    };
    worksheet.getRow(4).font = { color: { argb: 'FFFFFF' }, bold: true };

    // Add data rows
    exportData.forEach(record => {
      const row = worksheet.addRow(record);
      // Color code attendance status
      const statusCell = row.getCell(6);
      if (record.Status === 'Present') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'C6EFCE' }
        };
        statusCell.font = { color: { argb: '006100' } };
      } else {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC7CE' }
        };
        statusCell.font = { color: { argb: '9C0006' } };
      }
    });

    // Generate filename
    const filename = `${unit.code}_${unit.name.replace(/\s+/g, '_')}_attendance_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send the workbook
    await workbook.xlsx.write(res);
    res.end();

    logger.info(`Unit attendance exported for unit ${unitId} by user ${req.user.userId}`);

  } catch (error) {
    logger.error(`Error exporting unit attendance: ${error.message}`);
    console.error("Error exporting unit attendance:", error);
    res.status(500).json({ message: "Error exporting attendance data", error: error.message });
  }
};

// Export attendance data for a specific session
exports.exportSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID format" });
    }

    // Find the session to get its details
    const session = await Session.findById(sessionId)
      .populate('unit', 'name code')
      .populate('lecturer', 'firstName lastName');

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Get all attendance records for this session
    const attendanceRecords = await Attendance.find({ session: sessionId })
      .populate({
        path: 'student',
        select: 'regNo firstName lastName'
      })
      .sort({ 'student.regNo': 1 });

    // Process data for export
    const exportData = attendanceRecords.map(record => ({
      'Registration Number': record.student.regNo,
      'First Name': record.student.firstName,
      'Last Name': record.student.lastName,
      'Status': record.status,
      'Attendance Time': record.attendedAt ? new Date(record.attendedAt).toLocaleTimeString() : 'N/A'
    }));

    // Determine export format based on request headers
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/json')) {
      return res.json(exportData);
    }

    // Default to Excel export
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    // Add headers
    worksheet.columns = [
      { header: 'Registration Number', key: 'Registration Number', width: 20 },
      { header: 'First Name', key: 'First Name', width: 15 },
      { header: 'Last Name', key: 'Last Name', width: 15 },
      { header: 'Status', key: 'Status', width: 12 },
      { header: 'Attendance Time', key: 'Attendance Time', width: 18 }
    ];

    // Add title row with session info
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Attendance Report for ${session.unit.name} (${session.unit.code})`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    // Add session details row
    worksheet.mergeCells('A2:E2');
    const sessionCell = worksheet.getCell('A2');
    sessionCell.value = `Session on ${new Date(session.startTime).toLocaleDateString()} from ${new Date(session.startTime).toLocaleTimeString()} to ${new Date(session.endTime).toLocaleTimeString()}`;
    sessionCell.font = { size: 12 };
    sessionCell.alignment = { horizontal: 'center' };

    // Add lecturer info
    worksheet.mergeCells('A3:E3');
    const lecturerCell = worksheet.getCell('A3');
    lecturerCell.value = `Lecturer: ${session.lecturer?.firstName || ''} ${session.lecturer?.lastName || ''}`;
    lecturerCell.font = { size: 12, italic: true };
    lecturerCell.alignment = { horizontal: 'center' };

    // Add empty row
    worksheet.addRow({});

    // Style the header row
    worksheet.getRow(5).font = { bold: true };
    worksheet.getRow(5).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' }
    };
    worksheet.getRow(5).font = { color: { argb: 'FFFFFF' }, bold: true };

    // Add data rows
    exportData.forEach(record => {
      const row = worksheet.addRow(record);
      // Color code attendance status
      const statusCell = row.getCell(4);
      if (record.Status === 'Present') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'C6EFCE' }
        };
        statusCell.font = { color: { argb: '006100' } };
      } else {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC7CE' }
        };
        statusCell.font = { color: { argb: '9C0006' } };
      }
    });

    // Add summary section
    worksheet.addRow({});
    const summaryRow = worksheet.addRow(['Summary']);
    summaryRow.font = { bold: true };

    const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;
    const totalCount = attendanceRecords.length;
    const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

    worksheet.addRow(['Present', presentCount]);
    worksheet.addRow(['Absent', absentCount]);
    worksheet.addRow(['Total', totalCount]);
    worksheet.addRow(['Attendance Rate', `${attendanceRate.toFixed(1)}%`]);

    // Generate filename
    const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
    const sessionTime = new Date(session.startTime).toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `${session.unit.code}_${sessionDate}_${sessionTime}_attendance.xlsx`;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send the workbook
    await workbook.xlsx.write(res);
    res.end();

    logger.info(`Session attendance exported for session ${sessionId} by user ${req.user.userId}`);

  } catch (error) {
    logger.error(`Error exporting session attendance: ${error.message}`);
    console.error("Error exporting session attendance:", error);
    res.status(500).json({ message: "Error exporting attendance data", error: error.message });
  }
};

// Export attendance data for all sessions of a lecturer
exports.exportAllSessionsAttendance = async (req, res) => {
  try {
    const lecturerId = req.user.userId;
    const { startDate, endDate, unitId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(lecturerId)) {
      return res.status(400).json({ message: "Invalid lecturer ID format" });
    }

    // Get all units taught by this lecturer
    let units = [];
    if (unitId && mongoose.Types.ObjectId.isValid(unitId)) {
      // If unitId is provided and valid, fetch only that unit
      const unit = await Unit.findById(unitId).select('_id name code');
      if (unit) {
        units = [unit];
      } else {
        return res.status(404).json({ message: "Unit not found" });
      }
    } else {
      // Otherwise, fetch all units for the lecturer
      units = await Unit.find({ lecturer: lecturerId }).select('_id name code');
    }

    if (!units.length) {
      return res.status(404).json({
        message: "No units found for this lecturer",
        code: "NO_DATA_FOUND"
      });
    }

    const unitIds = units.map(unit => unit._id);

    // Build query with date range if provided
    const sessionQuery = {
      unit: { $in: unitIds },
      ended: true
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      sessionQuery.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))  // Include entire end date
      };

      logger.info(`Filtering sessions between ${startDate} and ${endDate} for lecturer ${lecturerId}`);
    }

    // Get all sessions for these units with optional date filtering
    const sessions = await Session.find(sessionQuery).sort({ startTime: -1 });

    if (!sessions.length) {
      logger.info(`No sessions found for the selected criteria for lecturer ${lecturerId}`);
      return res.status(404).json({
        message: "No sessions found for the selected date range. Please try a different date range.",
        code: "NO_DATA_FOUND"
      });
    }

    const sessionIds = sessions.map(session => session._id);

    // Get attendance records for all these sessions
    const attendanceRecords = await Attendance.find({ session: { $in: sessionIds } })
      .populate({
        path: 'student',
        select: 'regNo firstName lastName'
      })
      .populate({
        path: 'session',
        select: 'startTime endTime unit'
      })
      .sort({ 'session.startTime': 1, 'student.regNo': 1 }); // Sort for better organization

    if (!attendanceRecords.length) {
      logger.info(`No attendance records found for the selected sessions for lecturer ${lecturerId}`);
      return res.status(404).json({
        message: "No attendance records found for the selected date range. Please try a different date range.",
        code: "NO_DATA_FOUND"
      });
    }

    // Create a map of unit IDs to unit details for easier lookup
    const unitMap = new Map(units.map(unit => [unit._id.toString(), unit]));

    // Process data for export - sanitize and ensure proper structure
    const { sanitizeExportData } = require('../utils/exportUtils');
    let exportData = [];

    try {
      // First create properly structured data
      exportData = attendanceRecords.map(record => {
        try {
          // Look up the unit details for this session
          const unitId = record.session?.unit?.toString() || '';
          const unit = unitMap.get(unitId) || { name: 'Unknown Unit', code: 'N/A' };

          // Ensure student details exist and are properly formatted
          const student = record.student || { regNo: 'N/A', firstName: 'Unknown', lastName: 'Student' };

          // Normalize status value - convert all to proper case format for consistency
          const normalizedStatus = record.status ?
            record.status.toString().charAt(0).toUpperCase() +
            record.status.toString().slice(1).toLowerCase() : 'Unknown';

          // Create record with proper structure
          return {
            'Unit Code': unit.code || 'N/A',
            'Unit Name': unit.name || 'Unknown Unit',
            'Session Date': record.session?.startTime ? new Date(record.session.startTime).toLocaleDateString() : 'N/A',
            'Session Time': record.session?.startTime && record.session?.endTime ?
              `${new Date(record.session.startTime).toLocaleTimeString()} - ${new Date(record.session.endTime).toLocaleTimeString()}` :
              'N/A',
            'Registration Number': student.regNo || 'N/A',
            'First Name': student.firstName || 'Unknown',
            'Last Name': student.lastName || 'Student',
            'Status': normalizedStatus,
            'Attendance Time': record.attendedAt ? new Date(record.attendedAt).toLocaleTimeString() : 'N/A'
          };
        } catch (error) {
          logger.error(`Error processing attendance record: ${error.message}`);
          // Return a placeholder record in case of error
          return {
            'Unit Code': 'Error',
            'Unit Name': 'Error Processing Record',
            'Session Date': 'N/A',
            'Session Time': 'N/A',
            'Registration Number': 'N/A',
            'First Name': 'Error',
            'Last Name': 'Processing',
            'Status': 'Error',
            'Attendance Time': 'N/A'
          };
        }
      });

      // Then sanitize the data to ensure consistency
      exportData = sanitizeExportData(exportData);

    } catch (error) {
      logger.error(`Error preparing export data: ${error.message}`);
      // If everything fails, return an empty array
      exportData = [];
    }

    // Determine export format based on request headers
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/json')) {
      // Send valid JSON data
      return res.json(exportData);
    }

    // Default to Excel export with enhanced formatting
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Attendance', {
      properties: { tabColor: { argb: '4167B8' } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 4, topLeftCell: 'A5' }] // Freeze the header rows
    });

    // Add headers with proper formatting
    worksheet.columns = [
      { header: 'Unit Code', key: 'Unit Code', width: 12, style: { alignment: { horizontal: 'left' } } },
      { header: 'Unit Name', key: 'Unit Name', width: 25, style: { alignment: { horizontal: 'left' } } },
      { header: 'Session Date', key: 'Session Date', width: 15, style: { alignment: { horizontal: 'left' } } },
      { header: 'Session Time', key: 'Session Time', width: 25, style: { alignment: { horizontal: 'left' } } },
      { header: 'Registration Number', key: 'Registration Number', width: 20, style: { alignment: { horizontal: 'left' } } },
      { header: 'First Name', key: 'First Name', width: 15, style: { alignment: { horizontal: 'left' } } },
      { header: 'Last Name', key: 'Last Name', width: 15, style: { alignment: { horizontal: 'left' } } },
      { header: 'Status', key: 'Status', width: 12, style: { alignment: { horizontal: 'center' } } },
      { header: 'Attendance Time', key: 'Attendance Time', width: 18, style: { alignment: { horizontal: 'left' } } }
    ];

    // Add title
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Comprehensive Attendance Report';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    // Add metadata
    worksheet.mergeCells('A2:I2');
    const metaCell = worksheet.getCell('A2');
    const now = new Date();
    const nairobiTime = now.toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });
    const unitText = units.length === 1 ? `Unit: ${units[0].name} (${units[0].code})` : 'All Units';
    metaCell.value = `Generated on ${nairobiTime} | ${unitText}`;
    metaCell.font = { size: 12, italic: true };
    metaCell.alignment = { horizontal: 'center' };

    // Add empty row
    worksheet.addRow({});

    // Style header row
    worksheet.getRow(4).font = { bold: true };
    worksheet.getRow(4).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' }
    };
    worksheet.getRow(4).font = { color: { argb: 'FFFFFF' }, bold: true };

    // Add data with alternating row colors and conditional formatting
    let rowIndex = 5;
    if (exportData.length > 0) {
      exportData.forEach(record => {
        try {
          const row = worksheet.addRow(record);

          // Explicitly set row values based on our specific columns
          row.getCell(1).value = record['Unit Code'];
          row.getCell(2).value = record['Unit Name'];
          row.getCell(3).value = record['Session Date'];
          row.getCell(4).value = record['Session Time'];
          row.getCell(5).value = record['Registration Number'];
          row.getCell(6).value = record['First Name'];
          row.getCell(7).value = record['Last Name'];
          row.getCell(8).value = record['Status'];
          row.getCell(9).value = record['Attendance Time'];

          // Apply alternating row colors
          if (rowIndex % 2 === 0) {
            row.eachCell({ includeEmpty: true }, cell => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F5F5F5' }
              };
            });
          }

          // Color code status cell
          const statusCell = row.getCell(8); // Status column - use case-insensitive comparison
          if (record['Status']) {
            const normalizedStatus = record['Status'].toString().toLowerCase();
            if (normalizedStatus.includes('present')) {
              statusCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'C6EFCE' }
              };
              statusCell.font = { color: { argb: '006100' } };
            } else if (normalizedStatus.includes('absent')) {
              statusCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFC7CE' }
              };
              statusCell.font = { color: { argb: '9C0006' } };
            } else if (normalizedStatus.includes('rejected')) {
              statusCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFCCCB' }
              };
              statusCell.font = { color: { argb: '800000' } };
            }
          }
          rowIndex++;
        } catch (error) {
          logger.error(`Error adding row to Excel: ${error.message}`);
          // Continue to next record
        }
      });
    } else {
      // Add a message if no data is available
      const noDataRow = worksheet.addRow(["No attendance data found for the selected criteria"]);
      worksheet.mergeCells(`A${rowIndex}:I${rowIndex}`);
      noDataRow.getCell(1).alignment = { horizontal: 'center' };
      noDataRow.getCell(1).font = { italic: true, color: { argb: '888888' } };
      rowIndex++;
    }

    // Add summary section
    worksheet.addRow({});
    const summaryTitleRow = worksheet.addRow(['Summary Statistics']);
    summaryTitleRow.getCell(1).font = { bold: true, size: 14 };
    worksheet.mergeCells(`A${rowIndex + 1}:I${rowIndex + 1}`);
    rowIndex++;

    // Calculate statistics with better error handling and case-insensitive matching
    const totalRecords = attendanceRecords.length || 0;
    const presentCount = attendanceRecords.filter(r => {
      const status = (r.status || '').toString().toLowerCase();
      return status === 'present';
    }).length || 0;
    const absentCount = attendanceRecords.filter(r => {
      const status = (r.status || '').toString().toLowerCase();
      return status === 'absent';
    }).length || 0;
    const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    // Count unique students and sessions with error handling
    const uniqueStudents = new Set(
      attendanceRecords
        .filter(r => r.student?._id)
        .map(r => r.student._id.toString())
    ).size || 0;

    const uniqueSessions = new Set(
      attendanceRecords
        .filter(r => r.session?._id)
        .map(r => r.session._id.toString())
    ).size || 0;

    // Add statistics rows
    worksheet.addRow(['Total Records', totalRecords]);
    worksheet.addRow(['Present Records', presentCount]);
    worksheet.addRow(['Absent Records', absentCount]);
    worksheet.addRow(['Overall Attendance Rate', `${attendanceRate.toFixed(1)}%`]);
    worksheet.addRow(['Unique Students', uniqueStudents]);
    worksheet.addRow(['Total Sessions', uniqueSessions]);
    worksheet.addRow(['Total Units', units.length]);

    // Format summary section
    for (let i = rowIndex + 1; i <= rowIndex + 7; i++) {
      worksheet.getCell(`A${i}`).font = { bold: true };
    }

    // Add date range to filename and title if provided
    const today = new Date().toISOString().split('T')[0];
    let filename = 'complete_attendance_report';
    let reportTitle = 'Comprehensive Attendance Report';
    if (startDate && endDate) {
      filename = `attendance_report_${startDate}_to_${endDate}`;
      reportTitle = `Attendance Report (${startDate} to ${endDate})`;
    } else {
      filename = `complete_attendance_report_${today}`;
    }

    // Append unit names to filename
    if (units.length === 1) {
      // If only one unit is selected, add its name
      filename += `_${units[0].code}_${units[0].name.replace(/\s+/g, '_')}`;
    } else {
      // If multiple units are selected, indicate "all_units"
      filename += '_all_units';
    }
    filename += '.xlsx';

    // Update title in the Excel file
    titleCell.value = reportTitle;

    // Set response headers with correct content type
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send the workbook
    await workbook.xlsx.write(res);
    res.end();

    logger.info(`Complete attendance report exported by user ${req.user.userId}`);

  } catch (error) {
    logger.error(`Error exporting all sessions attendance: ${error.message}`);
    console.error("Error exporting all sessions attendance:", error);
    res.status(500).json({ message: "Error exporting attendance data", error: error.message });
  }
};

exports.exportFilteredAttendance = async (req, res) => {
  try {
    const { unitId = undefined, startDate, endDate } = req.query;
    const studentId = req.user.userId;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Get current time in Nairobi timezone
    const nairobiTime = new Date().toLocaleString('en-KE', {
      timeZone: 'Africa/Nairobi',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    // Get the student details
    const student = await User.findById(studentId).select('regNo firstName lastName');

    // Build the query for fetching attendance records
    let attendanceQuery = {
      student: new mongoose.Types.ObjectId(studentId)
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      attendanceQuery.attendedAt = {};
      if (startDate) {
        attendanceQuery.attendedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        attendanceQuery.attendedAt.$lte = new Date(endDate);
      }
    }

    // Fetch all attendance records without unit filtering first
    const allAttendanceRecords = await Attendance.find(attendanceQuery)
      .populate({
        path: 'session',
        select: 'startTime endTime unit',
        populate: { path: 'unit', select: 'name code' }
      })
      .lean();

    // Then filter by unit if unitId is provided (doing this in memory for accuracy)
    let filteredRecords = allAttendanceRecords;
    if (unitId && mongoose.Types.ObjectId.isValid(unitId)) {
      filteredRecords = allAttendanceRecords.filter(record =>
        record.session && record.session.unit &&
        record.session.unit._id.toString() === unitId.toString()
      );
    }

    if (!filteredRecords || filteredRecords.length === 0) {
      return res.status(404).json({
        message: 'No attendance records found for the specified criteria'
      });
    }

    // Group records by unit to calculate per-unit attendance rates
    const unitAttendanceMap = {};

    // Get all enrolled units correctly - fix for the schema issue
    // Instead of trying to populate unitsEnrolled directly, get the units from attendance records
    let enrolledUnitIds = new Set();
    let enrolledUnits = [];

    // First get all unit IDs from the attendance records
    allAttendanceRecords.forEach(record => {
      if (record.session && record.session.unit && record.session.unit._id) {
        enrolledUnitIds.add(record.session.unit._id.toString());
      }
    });

    // Then fetch the actual unit details if we need to use the dashboard calculation
    if (useDisplayCalculation && enrolledUnitIds.size > 0) {
      try {
        // Get complete unit information for all units the student has attendance records for
        enrolledUnits = await Unit.find({
          _id: { $in: Array.from(enrolledUnitIds) }
        }).select('_id name code').lean();

        console.log(`Found ${enrolledUnits.length} enrolled units`);
      } catch (unitFetchError) {
        console.error("Error fetching enrolled units:", unitFetchError);
        // Continue with what we have from attendance records
        enrolledUnits = Array.from(enrolledUnitIds).map(id => {
          // Try to find unit info in attendance records
          const record = allAttendanceRecords.find(r =>
            r.session && r.session.unit && r.session.unit._id.toString() === id
          );

          if (record && record.session.unit) {
            return {
              _id: record.session.unit._id,
              name: record.session.unit.name || 'Unknown Unit',
              code: record.session.unit.code || 'N/A'
            };
          }

          // Fallback if not found
          return { _id: id, name: 'Unknown Unit', code: 'N/A' };
        });
      }
    }

    // If using dashboard calculation method, we need to get all sessions per unit, not just attended ones
    if (useDisplayCalculation) {
      try {
        // Get all sessions for these units
        const allSessions = await Session.find({
          unit: { $in: Array.from(enrolledUnitIds) },
          ended: true // Only count completed sessions
        }).select('_id unit').lean();

        console.log(`Found ${allSessions.length} total sessions across all enrolled units`); // Debug log

        // Create a map of unit IDs to session counts
        const unitSessionCounts = {};
        allSessions.forEach(session => {
          const unitId = session.unit.toString();
          unitSessionCounts[unitId] = (unitSessionCounts[unitId] || 0) + 1;
        });

        // Initialize the unit attendance map with all enrolled units
        enrolledUnits.forEach(unit => {
          const unitId = unit._id.toString();
          unitAttendanceMap[unitId] = {
            name: unit.name || 'Unknown Unit',
            code: unit.code || 'N/A',
            totalSessions: unitSessionCounts[unitId] || 0,
            presentCount: 0,
            absentCount: 0,
            rate: 0
          };
        });
      } catch (error) {
        console.error("Error getting session data:", error);
        // Fall back to basic calculation if dashboard calculation fails
        useDisplayCalculation = false;
      }
    }

    // Process attendance records by unit - counting both Present and Absent
    filteredRecords.forEach(record => {
      if (record.session && record.session.unit) {
        const unitId = record.session.unit._id.toString();

        if (!unitAttendanceMap[unitId]) {
          unitAttendanceMap[unitId] = {
            name: record.session.unit.name || 'Unknown Unit',
            code: record.session.unit.code || 'N/A',
            totalSessions: useDisplayCalculation ? 0 : 0,
            presentCount: 0,
            absentCount: 0,
            rate: 0
          };
        }

        // Count both Present and Absent records, but not Rejected
        if (record.status === 'Present') {
          unitAttendanceMap[unitId].presentCount++;
        } else if (record.status === 'Absent') {
          unitAttendanceMap[unitId].absentCount++;
        }

        // Only increment totalSessions if NOT using dashboard calculation
        // (for dashboard calculation, we already populated totalSessions above)
        if (!useDisplayCalculation) {
          unitAttendanceMap[unitId].totalSessions++;
        }
      }
    });

    // Calculate attendance rates for each unit using appropriate method
    Object.values(unitAttendanceMap).forEach(unitData => {
      if (useDisplayCalculation) {
        // Dashboard calculation: present sessions / total possible sessions
        unitData.rate = unitData.totalSessions > 0
          ? ((unitData.presentCount / unitData.totalSessions) * 100).toFixed(1)
          : "0.0";
      } else {
        // Original calculation: present / (present + absent)
        const totalAttended = unitData.presentCount + unitData.absentCount;
        unitData.rate = totalAttended > 0
          ? ((unitData.presentCount / totalAttended) * 100).toFixed(1)
          : "0.0";
      }

      console.log(`Unit ${unitData.code}: Total=${unitData.totalSessions}, Present=${unitData.presentCount}, Absent=${unitData.absentCount}, Rate=${unitData.rate}%`); // Debug log
    });

    // Process data for export
    const exportData = filteredRecords.map(record => ({
      'Unit': record.session.unit.name || 'N/A',
      'Code': record.session.unit.code || 'N/A',
      'Session Date': record.session.startTime ?
        new Date(record.session.startTime).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' }) :
        'N/A',
      'Session Time': record.session.startTime && record.session.endTime ?
        `${new Date(record.session.startTime).toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })} - ${new Date(record.session.endTime).toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })}` :
        'N/A',
      'Status': record.status || 'N/A',
      'Feedback': record.feedbackSubmitted ? 'Yes' : 'No'
    }));

    // Create workbook with better styling
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report', {
      properties: { tabColor: { argb: '4167B8' } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 4, topLeftCell: 'A5' }]
    });

    // Determine the unit name for the title
    let reportTitle = 'Student Attendance Report';
    if (unitId && filteredRecords.length > 0 && filteredRecords[0].session?.unit) {
      const unitName = filteredRecords[0].session.unit.name || 'Selected Unit';
      reportTitle = `Attendance Report - ${unitName}`;
    }

    // Add title section with better formatting
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = reportTitle;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2F75B5' }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add student info and date range
    worksheet.mergeCells('A2:F2');
    const infoCell = worksheet.getCell('A2');
    infoCell.value = `Student: ${student.firstName} ${student.lastName} (${student.regNo})`;
    infoCell.font = { size: 12, italic: true };
    infoCell.alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:F3');
    const dateCell = worksheet.getCell('A3');
    dateCell.value = `Generated on ${nairobiTime} (EAT)`;
    dateCell.font = { size: 11, italic: true };
    dateCell.alignment = { horizontal: 'center' };

    // Define columns with better formatting
    worksheet.columns = [
      { header: 'Unit', key: 'Unit', width: 30 },
      { header: 'Code', key: 'Code', width: 15 },
      { header: 'Session Date', key: 'Session Date', width: 15 },
      { header: 'Session Time', key: 'Session Time', width: 25 },
      { header: 'Status', key: 'Status', width: 12 },
      { header: 'Feedback', key: 'Feedback', width: 15 },
    ];

    // Style header row
    worksheet.getRow(4).height = 30;
    worksheet.getRow(4).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFF' } }
      };
    });

    // Add data rows with enhanced styling
    let rowIndex = 5;
    exportData.forEach(record => {
      const row = worksheet.addRow({
        Unit: record.Unit,
        Code: record.Code,
        'Session Date': record['Session Date'],
        'Session Time': record['Session Time'],
        Status: record.Status,
        Feedback: record.Feedback
      });

      // Color code status cells
      const statusCell = row.getCell(5);
      if (record.Status === 'Present') {
        statusCell.font = { color: { argb: '006100' } };
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'C6EFCE' }
        };
      } else if (record.Status === 'Absent') {
        statusCell.font = { color: { argb: '9C0006' } };
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC7CE' }
        };
      } else if (record.Status === 'Rejected') {
        statusCell.font = { color: { argb: '800000' } }; // Dark red color
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCCCB' } // Light red color
        };
      } else {
        // Add a default style for other statuses (e.g., Rejected)
        statusCell.font = { color: { argb: '808080' } }; // Gray color
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D3D3D3' } // Light gray color
        };
      }

      rowIndex++;
    });

    // Add summary section with enhanced styling
    worksheet.addRow([]); // Empty row for spacing

    // Calculate correct attendance statistics
    const presentCount = filteredRecords.filter(r => r.status === 'Present').length;
    const absentCount = filteredRecords.filter(r => r.status === 'Absent').length;
    const totalCount = presentCount + absentCount;
    const attendanceRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : "0.0";

    // Style summary section
    worksheet.mergeCells(`A${rowIndex + 1}:F${rowIndex + 1}`);
    const summaryHeader = worksheet.getCell(`A${rowIndex + 1}`);
    summaryHeader.value = 'Attendance Summary';
    summaryHeader.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
    summaryHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2F75B5' }
    };
    summaryHeader.alignment = { horizontal: 'center' };

    // Add summary statistics with styling
    const summaryData = [
      ['Total Sessions', totalCount],
      ['Present', presentCount],
      ['Absent', absentCount],
      ['Attendance Rate', `${attendanceRate}%`]
    ];

    summaryData.forEach((data, index) => {
      const row = worksheet.addRow(['', data[0], '', data[1], '', '']);
      row.getCell(2).font = { bold: true };
      row.getCell(4).font = { bold: true };

      if (data[0] === 'Attendance Rate') {
        row.getCell(4).font.color = {
          argb: parseFloat(attendanceRate) >= 75 ? '006100' : '9C0006'
        };
      }

      worksheet.mergeCells(`B${rowIndex + 2 + index}:C${rowIndex + 2 + index}`);
      worksheet.mergeCells(`D${rowIndex + 2 + index}:E${rowIndex + 2 + index}`);
    });

    // Generate filename with unit info if filtered
    let filename = `attendance_report_${new Date().toISOString().split('T')[0]}`;
    if (unitId && filteredRecords.length > 0 && filteredRecords[0].session?.unit) {
      const unitCode = filteredRecords[0].session.unit.code || 'unit';
      filename = `${unitCode}_attendance_report_${new Date().toISOString().split('T')[0]}`;
    }

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${filename}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error in exportFilteredAttendance:', error);
    res.status(500).json({
      message: 'Error exporting attendance data',
      error: error.message,
    });
  }
};