const QRCode = require('qrcode');

// Generate the QR token for a session
const generateQRToken = async (session) => {
  try {
    // Create a string to encode as a QR code
    const qrData = {
      sessionId: session._id,
      unitId: session.unit,
      lecturerId: session.lecturer,
      startTime: session.startTime,
      endTime: session.endTime,
    };

    // Generate the QR code data
    const qrToken = await QRCode.toDataURL(JSON.stringify(qrData));

    return qrToken; // Return the QR token (base64-encoded image)
  } catch (error) {
    throw new Error("Error generating QR code: " + error.message);
  }
};

module.exports = { generateQRToken };
