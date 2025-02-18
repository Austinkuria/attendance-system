const QRCode = require('qrcode');

const generateQRToken = async (session) => {
  try {
    // Create a simple, compact data structure for the QR code
    const qrData = {
      s: session._id.toString(), // session ID
      u: session.unit.toString(), // unit ID
      t: Math.floor(Date.now() / 1000) // timestamp
    };
    
    // Convert to JSON and encode as base64
    const jsonData = JSON.stringify(qrData);
    const base64Data = Buffer.from(jsonData).toString('base64');
    
    // Generate QR code with the base64 data
    const qrToken = await QRCode.toDataURL(base64Data);
    return qrToken;

  } catch (error) {
    throw new Error("Error generating QR code: " + error.message);
  }
};

module.exports = generateQRToken;


// const QRCode = require('qrcode');

// // Generate the QR token for a session
// const generateQRToken = async (session) => {
//   try {
//     // Create a string to encode as a QR code
//     const qrData = {
//       sessionId: session._id,
//       unitId: session.unit,
//       lecturerId: session.lecturer,
//       startTime: session.startTime,
//       endTime: session.endTime,
//     };

//     // Generate the QR code data
//     const qrToken = await QRCode.toDataURL(JSON.stringify(qrData));

//     return qrToken; // Return the QR token (base64-encoded image)
//   } catch (error) {
//     throw new Error("Error generating QR code: " + error.message);
//   }
// };

// module.exports = { generateQRToken };
