const QRCode = require('qrcode');
const crypto = require('crypto');

const generateQRToken = async (session, expiresInSeconds = 180) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + expiresInSeconds;
    const nonce = crypto.randomBytes(8).toString('hex'); // Reduced from 16 to 8 bytes

    // Create a more compact data structure
    const qrData = {
      s: session._id.toString(),
      t: timestamp,
      e: expiresAt,
      n: nonce
    };

    // Generate hash with fewer components
    qrData.h = crypto.createHash('sha256')
      .update(`${qrData.s}${timestamp}${nonce}`)
      .digest('hex')
      .slice(0, 32); // Only use first 32 chars of hash

    const jsonData = JSON.stringify(qrData);
    const qrToken = Buffer.from(jsonData).toString('base64');
    const qrCode = await QRCode.toDataURL(qrToken, {
      errorCorrectionLevel: 'H', // Highest error correction
      margin: 4,
      width: 400
    });

    return { qrToken, qrCode };
  } catch (error) {
    console.error("QR Generation Error:", error);
    throw new Error("Error generating QR code: " + error.message);
  }
};

module.exports = generateQRToken;