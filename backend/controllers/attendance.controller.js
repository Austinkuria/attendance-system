const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require("../models/User");

exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, studentId } = req.body;

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
