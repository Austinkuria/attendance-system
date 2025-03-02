const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require("../models/User");
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const Unit = require("../models/Unit");

exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, studentId, deviceId, qrToken, compositeFingerprint } = req.body;

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

    const now = new Date();
    if (now < session.startTime || now > session.endTime || session.ended) {
      return res.status(400).json({
        success: false,
        code: "SESSION_INACTIVE",
        message: "Session is not active."
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
    const session = await Session.findById(sessionId).populate({
      path: 'unit',
      populate: { path: 'studentsEnrolled', model: 'User' }
    });
    if (!session || !session.unit) {
      console.error("Session or unit not found for sessionId:", sessionId);
      return;
    }

    const enrolledStudents = session.unit.studentsEnrolled.map(student => student._id.toString());
    if (enrolledStudents.length === 0) {
      console.log("No students enrolled in unit for session:", sessionId);
      return;
    }

    const existingAttendance = await Attendance.find({ session: sessionId }).select('student');
    const markedStudents = new Set(existingAttendance.map(record => record.student.toString()));

    const absentees = enrolledStudents.filter(studentId => !markedStudents.has(studentId));
    if (absentees.length === 0) {
      console.log("All enrolled students marked attendance for session:", sessionId);
      return;
    }

    await Attendance.insertMany(
      absentees.map(studentId => ({
        session: sessionId,
        student: studentId,
        status: "Absent",
        deviceId: "system-generated",
        compositeFingerprint: "system-generated",
        qrToken: "system-generated",
        timestamp: new Date(),
        feedbackSubmitted: false
      }))
    );

    console.log(`Marked ${absentees.length} students as absent for session:`, sessionId);
  } catch (error) {
    console.error("Error marking absentees:", error.message);
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
      weeklyTrends: weeklyTrends.sort((a, b) => a.week.localeCompare(b.week)),
      dailyTrends: dailyTrends.sort((a, b) => a.date.localeCompare(b.date))
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