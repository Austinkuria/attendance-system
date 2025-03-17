const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require("../models/User");
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const Unit = require("../models/Unit");

exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, studentId, deviceId, qrToken, compositeFingerprint } = req.body;

    // Decode the QR token
    let decodedToken;
    try {
      const jsonData = Buffer.from(qrToken, 'base64').toString();
      decodedToken = JSON.parse(jsonData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        code: "INVALID_QR_CODE",
        message: "QR code is invalid or corrupted"
      });
    }

    // Check if QR code has expired
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (decodedToken.e && decodedToken.e < currentTimestamp) {
      return res.status(400).json({
        success: false,
        code: "QR_CODE_EXPIRED",
        message: "This QR code has expired. A new code is generated periodically for security. Please use the current QR code."
      });
    }

    // Verify the session ID in the token matches the requested session
    if (decodedToken.s !== sessionId) {
      return res.status(400).json({
        success: false,
        code: "TOKEN_MISMATCH",
        message: "QR code does not match this session"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_ID_FORMAT",
        message: "Invalid ID format provided."
      });
    }

    if (!deviceId || !compositeFingerprint || !qrToken) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
        message: "Device ID, composite fingerprint, and QR token are required."
      });
    }

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        code: "NO_TOKEN_PROVIDED",
        message: "No authentication token provided."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.userId !== studentId) {
      return res.status(403).json({
        success: false,
        code: "TOKEN_MISMATCH",
        message: "Unauthorized: Token does not match student ID."
      });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        code: "SESSION_NOT_FOUND",
        message: "Session not found."
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
      return res.status(400).json({
        success: false,
        code: "INVALID_QR_CODE",
        message: "Invalid QR code for this session."
      });
    }

    const existingStudentRecord = await Attendance.findOne({ session: sessionId, student: studentId });
    if (existingStudentRecord) {
      return res.status(400).json({
        success: false,
        code: "ATTENDANCE_ALREADY_MARKED",
        message: "You have already marked attendance for this session."
      });
    }

    const existingDeviceRecord = await Attendance.findOne({
      session: sessionId,
      $or: [
        { deviceId: deviceId, compositeFingerprint: compositeFingerprint },
        { deviceId: deviceId },
        { compositeFingerprint: compositeFingerprint }
      ],
      status: "Present"
    });
    if (existingDeviceRecord) {
      return res.status(403).json({
        success: false,
        code: "DEVICE_CONFLICT",
        message: "This device or fingerprint has already marked attendance for this session."
      });
    }

    const attendance = new Attendance({
      session: sessionId,
      student: studentId,
      status: "Present",
      deviceId,
      compositeFingerprint,
      qrToken,
      attendedAt: new Date()
    });
    await attendance.save();

    if (!session.attendees.some(a => a.student.toString() === studentId)) {
      session.attendees.push({ student: studentId });
      await session.save();
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

    const attendanceRecords = await Attendance.find({ student: studentId })
      .select('session status attendedAt')
      .populate({
        path: 'session',
        select: 'unit startTime endTime',
        populate: { path: 'unit', select: 'name' }
      })
      .sort({ attendedAt: -1 });

    if (!attendanceRecords.length) {
      return res.status(200).json({
        attendanceRecords: [],
        weeklyEvents: [],
        dailyEvents: []
      });
    }

    const semesterStartDate = new Date('2025-01-01');
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    const dailyEvents = {};
    attendanceRecords.forEach(record => {
      const sessionDate = new Date(record.attendedAt || record.session.startTime);
      const dateStr = sessionDate.toISOString().split('T')[0];
      if (!dailyEvents[dateStr]) {
        dailyEvents[dateStr] = [];
      }
      dailyEvents[dateStr].push({
        unitName: record.session.unit?.name || 'Unknown',
        status: record.status,
        startTime: record.session.startTime,
      });
    });

    const dailyData = Object.entries(dailyEvents).map(([date, events]) => ({
      date,
      events
    }));

    const weeklyEvents = {};
    attendanceRecords.forEach(record => {
      const sessionDate = new Date(record.attendedAt || record.session.startTime);
      const daysSinceStart = Math.floor((sessionDate - semesterStartDate) / oneDay);
      const weekNumber = Math.floor(daysSinceStart / 7) + 1;
      const weekStart = new Date(semesterStartDate.getTime() + (weekNumber - 1) * oneWeek);
      const weekEnd = new Date(weekStart.getTime() + 6 * oneDay);
      const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

      if (!weeklyEvents[weekLabel]) {
        weeklyEvents[weekLabel] = [];
      }
      weeklyEvents[weekLabel].push({
        unitName: record.session.unit?.name || 'Unknown',
        status: record.status,
        startTime: record.session.startTime,
      });
    });

    const weeklyData = Object.entries(weeklyEvents).map(([week, events]) => ({
      week,
      events
    }));

    res.status(200).json({
      attendanceRecords,
      weeklyEvents: weeklyData,
      dailyEvents: dailyData
    });
  } catch (error) {
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