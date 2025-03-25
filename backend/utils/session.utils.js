const QRCode = require('qrcode');
const crypto = require('crypto');

const generateQRToken = async (session, expiresInSeconds = 180) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + expiresInSeconds;
    const nonce = crypto.randomBytes(16).toString('hex');

    const qrData = {
      s: session._id.toString(),
      u: session.unit.toString(),
      t: timestamp,
      e: expiresAt,
      n: nonce, // Add nonce for uniqueness
      h: crypto.createHash('sha256')  // Add hash for integrity
        .update(`${session._id}${timestamp}${nonce}${process.env.JWT_SECRET}`)
        .digest('hex')
    };

    const jsonData = JSON.stringify(qrData);
    const qrToken = Buffer.from(jsonData).toString('base64');
    const qrCode = await QRCode.toDataURL(qrToken);
    return { qrToken, qrCode };
  } catch (error) {
    throw new Error("Error generating QR code: " + error.message);
  }
};

module.exports = generateQRToken;