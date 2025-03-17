const QRCode = require('qrcode');

const generateQRToken = async (session, expiresInSeconds = 60) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + expiresInSeconds;

    const qrData = {
      s: session._id.toString(),
      u: session.unit.toString(),
      t: timestamp,
      e: expiresAt, // Add expiration time
      r: Math.random().toString(36).substring(2, 10) // Simple random string
    };

    const jsonData = JSON.stringify(qrData);
    const qrToken = Buffer.from(jsonData).toString('base64'); // Raw token
    const qrCode = await QRCode.toDataURL(qrToken); // PNG QR code
    return { qrToken, qrCode };
  } catch (error) {
    throw new Error("Error generating QR code: " + error.message);
  }
};

module.exports = generateQRToken;