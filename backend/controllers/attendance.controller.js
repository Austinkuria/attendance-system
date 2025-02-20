const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require("../models/User");
const mongoose = require('mongoose');

exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, studentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid ID format" });
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
      status: "Present",
      markedBy: req.user?._id // Add lecturer ID if available from auth middleware
    });

    await attendance.save();

    res.status(201).json({ message: "Attendance marked as Present" });
  } catch (error) {
    res.status(500).json({ message: "Error marking attendance", error: error.message });
  }
};

const markAbsentees = async (sessionId) => {
  try {
    const session = await Session.findById(sessionId);
    if (!session) return;

    const allStudents = await User.find({ role: "student" });
    const existingAttendance = await Attendance.find({ session: sessionId }).select('student');

    const markedStudents = new Set(existingAttendance.map(record => record.student.toString()));
    const absentees = allStudents.filter(student => !markedStudents.has(student._id.toString()));

    await Attendance.insertMany(
      absentees.map(student => ({
        session: sessionId,
        student: student._id,
        status: "Absent"
      }))
    );

    console.log("Absent students marked for session:", sessionId);
  } catch (error) {
    console.error("Error marking absentees:", error.message);
    throw error;
  }
};

// exports.markAttendance = async (req, res) => {
//   try {
//     const { sessionId, studentId } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(studentId)) {
//       return res.status(400).json({ message: "Invalid student ID format" });
//     }

//     const session = await Session.findById(sessionId);
//     if (!session) {
//       return res.status(404).json({ message: "Session not found" });
//     }

//     const now = new Date();
//     if (now < session.startTime || now > session.endTime) {
//       return res.status(400).json({ message: "Session is not active" });
//     }

//     const existingRecord = await Attendance.findOne({ session: sessionId, student: studentId });
//     if (existingRecord) {
//       return res.status(400).json({ message: "Attendance already marked" });
//     }

//     const attendance = new Attendance({
//       session: sessionId,
//       student: studentId,
//       status: "Present"
//     });

//     await attendance.save();

//     res.status(201).json({ message: "Attendance marked as Present" });
//   } catch (error) {
//     res.status(500).json({ message: "Error marking attendance", error: error.message });
//   }
// };

// // Mark absentees after session ends (now exported)
// const markAbsentees = async (sessionId) => {
//   try {
//     const session = await Session.findById(sessionId);
//     if (!session) return;

//     const allStudents = await User.find({ role: "student" });

//     for (let student of allStudents) {
//       const attendance = await Attendance.findOne({ session: sessionId, student: student._id });

//       if (!attendance) {
//         await Attendance.create({ session: sessionId, student: student._id, status: "Absent" });
//       }
//     }

//     console.log("Absent students marked for session:", sessionId);
//   } catch (error) {
//     console.error("Error marking absentees:", error.message);
//     throw error; // Re-throw to handle in caller
//   }
// };

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
    const { unitId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(unitId)) {
      return res.status(400).json({ message: "Invalid unit ID format" });
    }

    const sessions = await Session.find({ unit: unitId, ended: true })
      .sort({ startTime: 1 })
      .select('startTime _id');

    if (!sessions.length) {
      return res.status(200).json({ labels: [], data: [] });
    }

    const trends = await Promise.all(sessions.map(async (session) => {
      const stats = await Attendance.aggregate([
        { $match: { session: session._id } },
        { $group: {
          _id: "$status",
          count: { $sum: 1 }
        }}
      ]);

      const total = stats.reduce((sum, stat) => sum + stat.count, 0);
      const presentCount = stats.find(stat => stat._id === "Present")?.count || 0;
      const rate = total > 0 ? (presentCount / total) * 100 : 0;

      return {
        date: session.startTime.toISOString().split('T')[0],
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