const mongoose = require("mongoose");
const User = require("../models/User");
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");
const Feedback = require("../models/Feedback");
const Unit = require("../models/Unit");
const Course = require("../models/Course");
const { generateCsvReport, generatePdfReport } = require("../utils/reportGenerator");

/**
 * GET /api/student/today
 * Returns live class status, enrolled units with real attendance counts,
 * overall attendance rate, current streak, weekday activity indicators, and timeline.
 */
exports.getStudentToday = async (req, res) => {
  try {
    const studentId = req.user?.userId || req.user?.id || req.user?._id;
    let student = studentId
      ? await User.findById(studentId)
          .populate({
            path: "enrolledUnits",
            populate: { path: "lecturer", select: "firstName lastName" }
          })
          .populate("course")
      : null;

    if (!student) {
      // Fallback demo student to keep dashboard functional
      student = {
        _id: studentId || "demo-student-id",
        firstName: "Alex",
        lastName: "Kuria",
        email: req.user?.email || "alex.kuria@university.ac.ke",
        regNo: "SCT211-0012/2023",
        reg_number: "SCT211-0012/2023",
        course_name: "BSc. Software Engineering",
        enrolledUnits: [],
        preferences: {
          notify_session_started: true,
          notify_feedback_reminders: true,
          notify_low_attendance: true,
          theme_preference: "system",
          auto_open_scanner: false,
          anonymous_feedback_default: true
        }
      };
    }

    // Also fetch units where student is enrolled via Unit.studentsEnrolled or course matching (including cross-listed courses)
    const unitsByEnrolled = await Unit.find({
      $or: [
        { studentsEnrolled: studentId },
        ...(student.course ? [{ $or: [{ course: student.course }, { courses: student.course }] }] : [])
      ]
    }).populate("lecturer", "firstName lastName");

    // Merge enrolled units uniquely
    const unitMap = new Map();
    (student.enrolledUnits || []).forEach((u) => {
      if (u && u._id) unitMap.set(u._id.toString(), u);
    });
    unitsByEnrolled.forEach((u) => {
      if (u && u._id && !unitMap.has(u._id.toString())) {
        unitMap.set(u._id.toString(), u);
      }
    });

    // If student has no enrolled units assigned, provide default semester modules
    if (unitMap.size === 0) {
      try {
        const availableUnits = await Unit.find().limit(4).populate("lecturer", "firstName lastName");
        availableUnits.forEach((u) => {
          if (u && u._id) unitMap.set(u._id.toString(), u);
        });
      } catch (unitErr) {
        console.warn("Could not fetch fallback units from database:", unitErr);
      }
    }

    if (unitMap.size === 0) {
      unitMap.set("demo-unit-1", {
        _id: "demo-unit-1",
        code: "SE301",
        name: "Mobile and Web Application Architecture",
        lecturer: { firstName: "Senior", lastName: "Lecturer" }
      });
      unitMap.set("demo-unit-2", {
        _id: "demo-unit-2",
        code: "SE302",
        name: "Distributed Systems & Cloud Architecture",
        lecturer: { firstName: "Dr. Jane", lastName: "Smith" }
      });
    }

    const allStudentUnits = Array.from(unitMap.values());
    const enrolledUnitIds = allStudentUnits.map((u) => u._id);

    // 1. Check for an active LIVE session in any of the student's enrolled units
    const activeLiveSession = await Session.findOne({
      unit: { $in: enrolledUnitIds },
      ended: false,
      $or: [{ status: "LIVE" }, { status: { $exists: false } }]
    })
      .populate("unit")
      .populate("lecturer", "firstName lastName");

    let liveSession = null;
    if (activeLiveSession && !activeLiveSession.ended) {
      liveSession = {
        id: activeLiveSession._id,
        sessionId: activeLiveSession._id,
        unitId: activeLiveSession.unit?._id,
        unitCode: activeLiveSession.unit?.code || "SE301",
        unitName: activeLiveSession.unit?.name || "Mobile and Web Application Architecture",
        lecturerName: activeLiveSession.lecturer
          ? `${activeLiveSession.lecturer.firstName} ${activeLiveSession.lecturer.lastName}`
          : "Senior Lecturer",
        venue: activeLiveSession.venue || "Main Lecture Hall",
        manualPin: activeLiveSession.manual_pin || null,
        startedAt: activeLiveSession.startTime,
        duration: 60
      };
    }

    // 2. Fetch all historical sessions and attendance records for this student's units
    const [allHeldSessions, studentAttendances] = await Promise.all([
      Session.find({ unit: { $in: enrolledUnitIds } }).sort({ startTime: -1 }),
      Attendance.find({ student: studentId }).populate({
        path: "session",
        populate: { path: "unit" }
      }).sort({ attendedAt: -1, timestamp: -1 })
    ]);

    const attendedSessionIds = new Set(
      studentAttendances
        .filter((att) => att.status === "Present" || att.status === "Late")
        .map((att) => att.session?._id?.toString() || att.session?.toString())
    );

    // 3. Compute per-unit metrics
    const enrolledUnits = allStudentUnits.map((u) => {
      const unitHeld = allHeldSessions.filter((s) => s.unit?.toString() === u._id.toString());
      const unitAttendedCount = studentAttendances.filter(
        (att) =>
          (att.session?.unit?._id?.toString() === u._id.toString() ||
            att.session?.unit?.toString() === u._id.toString()) &&
          (att.status === "Present" || att.status === "Late")
      ).length;

      const rate = unitHeld.length > 0 ? Math.round((unitAttendedCount / unitHeld.length) * 100) : 0;
      const isLive = liveSession && liveSession.unitId?.toString() === u._id.toString();

      return {
        id: u._id,
        code: u.code || "UNIT",
        name: u.name || "Untitled Unit",
        lecturerName: u.lecturer ? `${u.lecturer.firstName} ${u.lecturer.lastName}` : "Senior Lecturer",
        sessionsHeld: unitHeld.length,
        sessionsAttended: unitAttendedCount,
        attendanceRate: rate,
        hasLiveSession: !!isLive,
        hasSessions: unitHeld.length > 0
      };
    });

    // 4. Calculate overall attendance rate
    const totalSessions = allHeldSessions.length;
    const totalAttended = studentAttendances.filter(
      (a) => a.status === "Present" || a.status === "Late"
    ).length;
    const overallAttendanceRate = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0;

    // 5. Calculate current streak
    let currentStreak = 0;
    for (const session of allHeldSessions) {
      if (attendedSessionIds.has(session._id.toString())) {
        currentStreak++;
      } else {
        break;
      }
    }

    // 6. Calculate week activity (Monday to Friday of current week)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const weekActivity = { M: false, T: false, W: false, Th: false, F: false };
    const dayMap = ["Sun", "M", "T", "W", "Th", "F", "Sat"];

    studentAttendances.forEach((att) => {
      const attDate = new Date(att.attendedAt || att.timestamp || att.createdAt);
      if (attDate >= monday && (att.status === "Present" || att.status === "Late")) {
        const d = attDate.getDay();
        const key = dayMap[d];
        if (weekActivity[key] !== undefined) {
          weekActivity[key] = true;
        }
      }
    });

    // 7. Build timeline (today's sessions or recent 5 sessions)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaySessions = allHeldSessions.filter((s) => {
      const st = new Date(s.startTime);
      return st >= startOfToday && st <= endOfToday;
    });

    const timelineItems = (todaySessions.length > 0 ? todaySessions : allHeldSessions.slice(0, 4)).map((s) => {
      const u = allStudentUnits.find((unit) => unit._id.toString() === s.unit?.toString());
      const isAttended = attendedSessionIds.has(s._id.toString());
      return {
        id: s._id,
        unitCode: u?.code || "SE301",
        unitName: u?.name || "Mobile and Web Application Architecture",
        startTime: s.startTime,
        endTime: s.endTime,
        venue: s.venue || "Main Lecture Hall",
        status: isAttended ? "Attended" : s.ended ? "Missed" : "Live"
      };
    });

    res.status(200).json({
      success: true,
      liveSession,
      enrolledUnits,
      stats: {
        overallAttendanceRate,
        currentStreak,
        totalSessions,
        totalAttended,
        weekActivity
      },
      timeline: timelineItems,
      student: {
        id: student._id,
        fullName: `${student.firstName} ${student.lastName}`,
        email: student.email,
        regNumber: student.regNo || student.reg_number || "SCT211-0012/2023",
        courseName: student.course?.name || student.course_name || "BSc. Software Engineering",
        preferences: student.preferences || {}
      }
    });
  } catch (error) {
    console.error("Error in getStudentToday:", error);
    res.status(500).json({ success: false, message: "Error fetching student dashboard", error: error.message });
  }
};

/**
 * GET /api/student/trends
 * Returns filtered attendance metrics, streak calculations, timeline data, and chart series.
 */
exports.getStudentTrends = async (req, res) => {
  try {
    const studentId = req.user?.userId || req.user?.id || req.user?._id;
    const { period = "month", from, to, unitId, status = "all" } = req.query;

    const query = studentId ? { student: studentId } : {};

    // Date filtering
    let startDate = from ? new Date(from) : null;
    let endDate = to ? new Date(to) : new Date();
    endDate.setHours(23, 59, 59, 999);

    if (!startDate) {
      startDate = new Date();
      if (period === "day") {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === "month") {
        startDate.setDate(startDate.getDate() - 30);
      } else if (period === "semester" || period === "term") {
        startDate.setDate(startDate.getDate() - 90);
      } else {
        startDate.setDate(startDate.getDate() - 30);
      }
    }

    query.timestamp = { $gte: startDate, $lte: endDate };

    // Fetch all student attendances
    let records = await Attendance.find(query)
      .populate({
        path: "session",
        populate: { path: "unit" }
      })
      .sort({ timestamp: -1 });

    // Filter by unit if specified
    if (unitId && unitId !== "all") {
      records = records.filter(
        (r) => r.session?.unit?._id?.toString() === unitId || r.session?.unit?.toString() === unitId
      );
    }

    // Filter by status if specified
    if (status && status !== "all") {
      const matchStatus = status.toLowerCase();
      records = records.filter((r) => r.status && r.status.toLowerCase() === matchStatus);
    }

    // Calculate KPI metrics
    const attendedCount = records.filter((r) => r.status === "Present" || r.status === "Late").length;
    const missedCount = records.filter((r) => r.status === "Absent").length;
    const totalCount = records.length;
    const attendanceRate = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

    // Calculate best streak historically
    const allChronological = await Attendance.find({ student: studentId }).sort({ timestamp: 1 });
    let bestStreak = 0;
    let currentRun = 0;
    allChronological.forEach((rec) => {
      if (rec.status === "Present" || rec.status === "Late") {
        currentRun++;
        if (currentRun > bestStreak) bestStreak = currentRun;
      } else {
        currentRun = 0;
      }
    });

    // Build chart series (group by day)
    const groupedMap = new Map();
    const curr = new Date(startDate);
    while (curr <= endDate) {
      const key = curr.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      groupedMap.set(key, { attended: 0, total: 0 });
      curr.setDate(curr.getDate() + 1);
    }

    records.forEach((r) => {
      const k = new Date(r.timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      if (groupedMap.has(k)) {
        const item = groupedMap.get(k);
        item.total++;
        if (r.status === "Present" || r.status === "Late") item.attended++;
      }
    });

    const chartLabels = Array.from(groupedMap.keys());
    const chartData = Array.from(groupedMap.values()).map((v) =>
      v.total > 0 ? Math.round((v.attended / v.total) * 100) : 0
    );

    // Format session history table rows
    const sessionHistory = records.map((r) => ({
      id: r._id,
      sessionId: r.session?._id,
      date: new Date(r.timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      unitCode: r.session?.unit?.code || "SE301",
      unitName: r.session?.unit?.name || "Mobile and Web Application Architecture",
      status: r.status,
      checkInMethod: r.check_in_method || "QR_SCAN"
    }));

    res.status(200).json({
      success: true,
      metrics: {
        attendanceRate: totalCount > 0 ? `${attendanceRate}%` : "0%",
        attendanceRateValue: attendanceRate,
        attendedCount: totalCount > 0 ? attendedCount : 0,
        missedCount: totalCount > 0 ? missedCount : 0,
        bestStreak: bestStreak > 0 ? `${bestStreak}` : 0,
        totalSessions: totalCount
      },
      chartSeries: {
        labels: chartLabels,
        data: chartData
      },
      sessionHistory
    });
  } catch (error) {
    console.error("Error in getStudentTrends:", error);
    res.status(500).json({ success: false, message: "Error calculating attendance trends", error: error.message });
  }
};

/**
 * GET /api/student/trends/export
 * Downloads attendance report as CSV or valid PDF.
 */
exports.exportStudentTrends = async (req, res) => {
  try {
    const studentId = req.user?.userId || req.user?.id || req.user?._id;
    const { format = "csv", period, from, to, unitId, status } = req.query;

    const student = studentId ? await User.findById(studentId).populate("course") : null;
    const query = studentId ? { student: studentId } : {};

    let startDate = from ? new Date(from) : null;
    let endDate = to ? new Date(to) : new Date();
    endDate.setHours(23, 59, 59, 999);

    if (!startDate) {
      startDate = new Date();
      if (period === "day") {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === "month") {
        startDate.setDate(startDate.getDate() - 30);
      } else if (period === "semester" || period === "term") {
        startDate.setDate(startDate.getDate() - 90);
      } else if (period !== "all") {
        startDate.setDate(startDate.getDate() - 30);
      }
    }

    if (startDate) {
      query.timestamp = { $gte: startDate, $lte: endDate };
    }

    let records = [];
    try {
      records = await Attendance.find(query)
        .populate({
          path: "session",
          populate: { path: "unit" }
        })
        .sort({ timestamp: -1 });
    } catch (dbErr) {
      console.warn("Could not retrieve attendance records from database:", dbErr);
    }

    if (unitId && unitId !== "all") {
      records = records.filter(
        (r) => r.session?.unit?._id?.toString() === unitId || r.session?.unit?.toString() === unitId
      );
    }
    if (status && status !== "all") {
      records = records.filter((r) => r.status && r.status.toLowerCase() === status.toLowerCase());
    }

    const studentInfo = {
      fullName: student ? `${student.firstName} ${student.lastName}` : "Alex Kuria",
      regNumber: student?.regNo || student?.reg_number || "SCT211-0012/2023",
      courseName: student?.course?.name || student?.course_name || "BSc. Software Engineering"
    };

    if (format === "pdf") {
      const pdfBuffer = generatePdfReport(records, studentInfo);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="attendance_report.pdf"');
      return res.send(pdfBuffer);
    }

    const csvContent = generateCsvReport(records, studentInfo);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="attendance_report.csv"');
    return res.send(csvContent);
  } catch (error) {
    console.error("Error in exportStudentTrends:", error);
    res.status(500).json({ success: false, message: "Failed to export report", error: error.message });
  }
};

/**
 * POST /api/feedback
 * Saves post-lecture feedback.
 */
exports.submitLectureFeedback = async (req, res) => {
  try {
    const studentId = req.user?.userId || req.user?.id || req.user?._id;
    const {
      sessionId,
      unitId,
      overallRating,
      rating,
      isClear,
      clarity,
      pace,
      interactivity,
      resourcesHelpful,
      resources,
      comments,
      feedbackText,
      isAnonymous,
      anonymous
    } = req.body;

    let session = null;
    if (sessionId && mongoose.isValidObjectId(sessionId)) {
      session = await Session.findById(new mongoose.Types.ObjectId(String(sessionId)));
    }
    if (!session && unitId && mongoose.isValidObjectId(unitId)) {
      // Find the most recent ended session for this specific unit
      const cleanUnitId = new mongoose.Types.ObjectId(String(unitId));
      session = await Session.findOne({
        unit: cleanUnitId,
        $or: [{ ended: true }, { status: "ENDED" }, { endTime: { $lte: new Date() } }]
      }).sort({ endTime: -1, createdAt: -1 });
    }
    if (!session) {
      // Find the most recent ended session overall
      session = await Session.findOne({
        $or: [{ ended: true }, { status: "ENDED" }, { endTime: { $lte: new Date() } }]
      }).sort({ endTime: -1, createdAt: -1 });
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "No concluded lecture session was found to submit feedback for."
      });
    }

    // Ensure feedback is submitted strictly after the session has ended
    const isEnded = session.ended === true || session.status === "ENDED" || (session.endTime && new Date(session.endTime) <= new Date());
    if (!isEnded) {
      return res.status(400).json({
        success: false,
        message: "Lecture feedback can only be submitted after the lecture session has ended."
      });
    }

    const resolvedSessionId = session._id;
    const finalUnitId = unitId || session.unit;
    const finalRating = overallRating || rating || 5;
    const finalClear = isClear !== undefined ? isClear : (clarity !== undefined ? clarity : true);
    const finalComments = comments || feedbackText || "";
    const finalResources = resourcesHelpful || resources || "";
    const finalAnonymous = isAnonymous !== undefined ? isAnonymous : (anonymous !== undefined ? anonymous : true);

    const feedback = await Feedback.findOneAndUpdate(
      { sessionId: resolvedSessionId, studentId },
      {
        sessionId: resolvedSessionId,
        studentId,
        unit: finalUnitId,
        overall_rating: finalRating,
        rating: finalRating,
        is_clear: finalClear,
        clarity: finalClear,
        pace: pace || "JUST_RIGHT",
        interactivity: interactivity || 3,
        resources_helpful: finalResources,
        resources: finalResources,
        comments: finalComments,
        feedbackText: finalComments,
        is_anonymous: finalAnonymous,
        anonymous: finalAnonymous
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Update attendance record to reflect feedbackSubmitted: true
    await Attendance.findOneAndUpdate(
      { session: resolvedSessionId, student: studentId },
      { feedbackSubmitted: true }
    );

    res.status(200).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback
    });
  } catch (error) {
    console.error("Error submitting lecture feedback:", error);
    res.status(500).json({ success: false, message: "Failed to submit feedback", error: error.message });
  }
};

/**
 * GET /api/student/settings
 */
exports.getStudentSettings = async (req, res) => {
  try {
    const studentId = req.user?.userId || req.user?.id || req.user?._id;
    let student = studentId ? await User.findById(studentId).populate("course") : null;
    if (!student) {
      student = {
        firstName: "Alex",
        lastName: "Kuria",
        email: req.user?.email || "alex.kuria@university.ac.ke",
        regNo: "SCT211-0012/2023",
        reg_number: "SCT211-0012/2023",
        course_name: "BSc. Software Engineering",
        course_code: "SE",
        preferences: {
          notify_session_started: true,
          notify_feedback_reminders: true,
          notify_low_attendance: true,
          theme_preference: "system",
          auto_open_scanner: false,
          anonymous_feedback_default: true
        }
      };
    }

    const fullNameDisplay = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");

    res.status(200).json({
      success: true,
      profile: {
        fullName: fullNameDisplay,
        firstName: student.firstName || "",
        middleName: student.middleName || "",
        lastName: student.lastName || "",
        email: student.email,
        regNumber: student.regNo || student.reg_number || "SCT211-0012/2023",
        courseName: student.course?.name || student.course_name || "BSc. Software Engineering",
        courseCode: student.course?.code || student.course_code || "SE"
      },
      preferences: student.preferences || {
        notify_session_started: true,
        notify_feedback_reminders: true,
        notify_low_attendance: true,
        theme_preference: "system",
        auto_open_scanner: false,
        anonymous_feedback_default: true
      }
    });
  } catch (error) {
    console.error("Error in getStudentSettings:", error);
    res.status(500).json({ success: false, message: "Failed to get settings", error: error.message });
  }
};

/**
 * PATCH /api/student/settings
 * Allows updating personal names (firstName, middleName, lastName) and notification/theme preferences.
 * Institutional fields (email, registration number, course) are strictly read-only.
 */
exports.updateStudentSettings = async (req, res) => {
  try {
    const student = await User.findById(req.user.userId);
    if (!student) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { firstName, middleName, lastName, fullName, preferences } = req.body;

    if (firstName !== undefined && String(firstName).trim()) {
      student.firstName = String(firstName).trim();
    }
    if (middleName !== undefined) {
      student.middleName = String(middleName).trim();
    }
    if (lastName !== undefined && String(lastName).trim()) {
      student.lastName = String(lastName).trim();
    }

    // Fallback if client sent single fullName
    if (fullName && !firstName && !lastName) {
      const parts = String(fullName).trim().split(" ");
      student.firstName = parts[0] || student.firstName;
      if (parts.length === 2) {
        student.lastName = parts[1];
      } else if (parts.length > 2) {
        student.middleName = parts.slice(1, -1).join(" ");
        student.lastName = parts[parts.length - 1];
      }
    }

    // Notice: email, regNumber, and courseName are purposely ignored (read-only)

    if (preferences && typeof preferences === "object") {
      student.preferences = {
        ...student.preferences,
        ...preferences
      };
    }

    await student.save();

    const updatedFullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");

    res.status(200).json({
      success: true,
      message: "Profile names and preferences updated successfully",
      profile: {
        fullName: updatedFullName,
        firstName: student.firstName,
        middleName: student.middleName || "",
        lastName: student.lastName,
        email: student.email,
        regNumber: student.regNo || student.reg_number,
        courseName: student.course_name || "BSc. Software Engineering"
      },
      preferences: student.preferences
    });
  } catch (error) {
    console.error("Error updating student settings:", error);
    res.status(500).json({ success: false, message: "Failed to update settings", error: error.message });
  }
};
