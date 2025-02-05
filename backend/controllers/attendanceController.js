// const AttendanceSession = require("../models/AttendanceSession");

// // Function to create a new attendance session
// const createAttendanceSession = async (req, res) => {
//     try {
//         const { unit, lecturer, qrCode, startTime, endTime, attendance } = req.body;

//         // Validate incoming data
//         if (!unit || !lecturer || !startTime || !endTime) {
//             return res.status(400).json({ message: "Missing required fields" });
//         }

//         // Create a new attendance session
//         const newSession = new AttendanceSession({
//             unit,
//             lecturer,
//             qrCode,
//             startTime,
//             endTime,
//             attendance
//         });

//         // Save the session to the database
//         await newSession.save();

//         return res.status(201).json({ message: "Attendance session created successfully", session: newSession });
//     } catch (error) {
//         return res.status(500).json({ message: "Error creating attendance session", error: error.message });
//     }
// };

// module.exports = {
//     createAttendanceSession,
//     // other existing functions...
// };
