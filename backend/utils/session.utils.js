const QRCode = require('qrcode');

// Fallback for environments without crypto
const generateRandomHex = (bytes) => {
  if (typeof crypto !== 'undefined' && crypto.randomBytes) {
    return crypto.randomBytes(bytes).toString('hex');
  } else {
    console.error("crypto.randomBytes is not available. Using fallback method.");
    // Fallback: Simple random hex generator (less secure, for emergencies)
    return Array.from({ length: bytes }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
};

const generateQRToken = async (session) => {
  try {
    const qrData = {
      s: session._id.toString(),
      u: session.unit.toString(),
      t: Math.floor(Date.now() / 1000),
      r: generateRandomHex(8) // Use fallback if crypto unavailable
    };
    
    const jsonData = JSON.stringify(qrData);
    const base64Data = Buffer.from(jsonData).toString('base64');
    const qrToken = await QRCode.toDataURL(base64Data);
    return qrToken;
  } catch (error) {
    throw new Error("Error generating QR code: " + error.message);
  }
};

module.exports = generateQRToken;
