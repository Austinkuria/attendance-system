const QRCode = require('qrcode');

// NOTE: Although generateQRToken produces a short-lived token,
// it is currently used to generate one static QR code per session.
// To improve security against screenshots, consider calling
// this function periodically (e.g. via a dedicated endpoint or scheduled task)
// so that the UI always presents a fresh QR code.
const generateQRToken = async (session) => {
  try {
    const validForSeconds = 10; // QR code valid for 10 seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime = currentTime + validForSeconds;
    const qrData = {
      s: session._id.toString(), // session ID
      u: session.unit.toString(), // session unit
      t: currentTime,      // creation timestamp
      exp: expiryTime,     // added expiration timestamp
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