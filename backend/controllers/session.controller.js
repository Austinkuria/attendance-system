const Session = require('../models/AttendanceSession');
const generateQRToken = require('../utils/session.utils');

exports.detectCurrentSession = async (req, res) => {
  try {
    const currentTime = new Date();
    const currentSession = await Session.findOne({
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime }
    });
    if (!currentSession) {
      return res.status(404).json({ message: 'No current session found' });
    }
    res.json(currentSession);
  } catch (error) {
    res.status(500).json({ message: 'Error detecting current session', error: error.message });
  }
};

// exports.createAttendanceSession = async (req, res) => {
//   try {
//     const { unitId, lecturerId, startTime, endTime } = req.body;

//     // Ensure startTime and endTime are valid dates
//     const start = new Date(startTime);
//     const end = new Date(endTime);

//     if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//       return res.status(400).json({ message: 'Invalid startTime or endTime' });
//     }

//     // Create a new session in the database
//     const session = new Session({
//       unit: unitId,
//       lecturer: lecturerId,
//       startTime: start,
//       endTime: end,
//       qrCode: generateQRToken(), // Generate the QR token
//     });

//     await session.save();

//     res.status(201).json({ message: 'Session created successfully', session });
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating session', error: error.message });
//   }
// };

exports.createAttendanceSession = async (req, res) => {
  try {
    const { unitId, lecturerId, startTime, endTime } = req.body;

    // Ensure startTime and endTime are valid dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid startTime or endTime' });
    }

    // Create a new session in the database
    const session = new Session({
      unit: unitId,
      lecturer: lecturerId,
      startTime: start,
      endTime: end,
      qrCode: await generateQRToken(), // Generate the QR token

    });

    await session.save();

    // Generate a base64-encoded QR code image
    const qrImage = await QRCode.toDataURL(session.qrCode);

    res.status(201).json({ message: 'Session created successfully', session, qrCode: qrImage });
  } catch (error) {
    res.status(500).json({ message: 'Error creating session', error: error.message });
  }
};

// exports.createAttendanceSession = async (req, res) => {
//   try {
//     const { unitId, duration } = req.body;
//     const lecturerId = req.user.id; // Get the lecturer's ID from the authenticated user

//     const startTime = new Date();
//     const endTime = new Date(startTime.getTime() + duration * 60000); // Calculate end time based on duration

//     // Create a new session in the database
//     const session = new Session({
//       unit: unitId,
//       lecturer: lecturerId,
//       startTime,
//       endTime,
//       qrToken: generateQRToken(), // Generate the QR token
//     });

//     await session.save();

//     res.status(201).json({ message: 'Session created successfully', session });
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating session', error: error.message });
//   }
// };
