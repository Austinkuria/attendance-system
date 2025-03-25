const QRCode = require('qrcode');
const crypto = require('crypto');

const generateQRToken = async (session, expiresInSeconds = 180) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + expiresInSeconds;
    const nonce = crypto.randomBytes(4).toString('hex'); // Even smaller nonce (4 bytes)

    // Create the most compact data structure possible
    const qrData = {
      s: session._id.toString(),
      t: timestamp,
      e: expiresAt,
      n: nonce
    };

    // Generate simpler hash
    qrData.h = crypto.createHash('sha256')
      .update(`${qrData.s}${timestamp}${nonce}`)
      .digest('hex')
      .slice(0, 16); // Only use first 16 chars of hash for smaller size

    const jsonData = JSON.stringify(qrData);
    const qrToken = Buffer.from(jsonData).toString('base64');

    // Generate QR code with highest error correction and optimal size
    const qrCode = await QRCode.toDataURL(qrToken, {
      errorCorrectionLevel: 'H', // Highest error correction
      margin: 2, // Smaller margin
      width: 500, // Larger size for better readability
      scale: 8 // Higher scale for better scanning
    });

    console.log("Generated QR token data:", {
      sessionId: qrData.s,
      tokenLength: qrToken.length,
      timestamp,
      expiresAt
    });

    return { qrToken, qrCode };
  } catch (error) {
    console.error("QR Generation Error:", error);
    throw new Error("Error generating QR code: " + error.message);
  }
};

module.exports = generateQRToken;