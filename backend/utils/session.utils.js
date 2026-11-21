const QRCode = require('qrcode');
const crypto = require('crypto');

const getQrSecret = () => process.env.QR_SECRET_KEY || process.env.JWT_SECRET || 'qrollcall_secure_hmac_secret_key';

const computeSignature = (sessionId, timestamp, nonce) => {
  return crypto.createHmac('sha256', getQrSecret())
    .update(`${sessionId}${timestamp}${nonce}`)
    .digest('hex')
    .slice(0, 32);
};

const generateQRToken = async (session, expiresInSeconds = 180) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + expiresInSeconds;
    const nonce = crypto.randomBytes(8).toString('hex'); // 8 bytes random nonce

    // Create compact data structure
    const qrData = {
      s: session._id.toString(),
      t: timestamp,
      e: expiresAt,
      n: nonce,
      h: computeSignature(session._id.toString(), timestamp, nonce)
    };

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

generateQRToken.computeSignature = computeSignature;

module.exports = generateQRToken;