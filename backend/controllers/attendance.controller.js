const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require("../models/User");
const mongoose = require('mongoose');

exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, studentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const now = new Date();
    if (now < session.startTime || now > session.endTime) {
      return res.status(400).json({ message: "Session is not active" });
    }

    const existingRecord = await Attendance.findOne({ session: sessionId, student: studentId });
    if (existingRecord) {
      return res.status(400).json({ message: "Attendance already marked" });
    }

    const attendance = new Attendance({
      session: sessionId,
      student: studentId,
      status: "Present"
    });

    await attendance.save();

    res.status(201).json({ message: "Attendance marked as Present" });
  } catch (error) {
    res.status(500).json({ message: "Error marking attendance", error: error.message });
  }
};

// Mark absentees after session ends (now exported)
const markAbsentees = async (sessionId) => {
  try {
    const session = await Session.findById(sessionId);
    if (!session) return;

    const allStudents = await User.find({ role: "student" });

    for (let student of allStudents) {
      const attendance = await Attendance.findOne({ session: sessionId, student: student._id });

      if (!attendance) {
        await Attendance.create({ session: sessionId, student: student._id, status: "Absent" });
      }
    }

    console.log("Absent students marked for session:", sessionId);
  } catch (error) {
    console.error("Error marking absentees:", error.message);
    throw error; // Re-throw to handle in caller
  }
};

exports.handleSessionEnd = async (req, res) => {
  try {
    const { sessionId } = req.body;
    await markAbsentees(sessionId);
    res.status(200).json({ message: "Absent students marked" });
  } catch (error) {
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
      .populate('session', 'unit startTime endTime')
      .sort({ 'session.startTime': -1 });

    res.status(200).json({ attendanceRecords });
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
      .populate('session', 'unit');
    res.status(200).json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: "Error fetching session attendance", error: error.message });
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
    const { unitId } = req.params; // Assuming unitId comes from route params
    if (!mongoose.Types.ObjectId.isValid(unitId)) {
      return res.status(400).json({ message: "Invalid unit ID format" });
    }

    const sessions = await Session.find({ unit: unitId, ended: true })
      .sort({ startTime: 1 })
      .select('startTime');

    const trends = await Promise.all(sessions.map(async (session) => {
      const attendanceRecords = await Attendance.find({ session: session._id });
      const totalStudents = attendanceRecords.length;
      const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
      const rate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;
      return {
        date: session.startTime.toISOString().split('T')[0], // e.g., "2025-02-20"
        rate: Number(rate.toFixed(1))
      };
    }));

    const response = {
      labels: trends.map(t => t.date),
      data: trends.map(t => t.rate)
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching attendance trends:", error);
    res.status(500).json({ message: "Error fetching attendance trends", error: error.message });
  }
};

module.exports = {
  markAttendance,
  markAbsentees,
  getStudentAttendance,
  getSessionAttendance,
  updateAttendanceStatus
};