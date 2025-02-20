const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require("../models/User");
const mongoose = require('mongoose');


exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, studentId } = req.body;

    // Validate studentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Validate session existence and time validity

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const now = new Date();
    if (now < session.startTime || now > session.endTime) {
      return res.status(400).json({ message: "Session is not active" });
    }

    // Check if student has already marked attendance
    const existingRecord = await Attendance.findOne({ session: sessionId, student: studentId });
    if (existingRecord) {
      return res.status(400).json({ message: "Attendance already marked" });
    }

    // Mark student as present
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

// Function to mark absentees after session ends
const markAbsentees = async (sessionId) => {
  try {
    const session = await Session.findById(sessionId);
    if (!session) return;

    // Get all students who should have attended
    const allStudents = await User.find({ role: "student" });

    for (let student of allStudents) {
      const attendance = await Attendance.findOne({ session: sessionId, student: student._id });

      if (!attendance) {
        // Mark student as absent if they didn't scan
        await Attendance.create({ session: sessionId, student: student._id, status: "Absent" });
      }
    }

    console.log("Absent students marked for session:", sessionId);
  } catch (error) {
    console.error("Error marking absentees:", error.message);
  }
};

// Function to trigger absentee marking when a session ends
exports.handleSessionEnd = async (req, res) => {
  try {
    const { sessionId } = req.body;
    await markAbsentees(sessionId);
    res.status(200).json({ message: "Absent students marked" });
  } catch (error) {
    res.status(500).json({ message: "Error processing absentees", error: error.message });
  }
};

// Get attendance records for a specific student
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate studentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Get all attendance records for the student, populated with session details
    const attendanceRecords = await Attendance.find({ student: studentId })
      .populate('session', 'unit startTime endTime')
      .sort({ 'session.startTime': -1 });

    res.status(200).json({ attendanceRecords });
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance records", error: error.message });
  }
};

// exports.getSessionAttendance = async (req, res) => {
//   try {
//     const { sessionId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(sessionId)) {
//       return res.status(400).json({ message: "Invalid session ID format" });
//     }
//     const attendanceRecords = await Attendance.find({ session: sessionId })
//       .populate('student', 'regNo firstName lastName course year semester')
//       .populate('session', 'unit');
//     res.status(200).json(attendanceRecords);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching session attendance", error: error.message });
//   }
// };

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
        populate: { path: 'course', select: 'name' } // Nested population for course
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