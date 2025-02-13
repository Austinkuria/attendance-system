const QRCode = require('qrcode');

const generateQRToken = async (data) => {
  try {
    // Generate a QR code as a base64-encoded image
    const qrCode = await QRCode.toDataURL(data);
    return qrCode; // Returns a base64-encoded image string
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

module.exports = generateQRToken;