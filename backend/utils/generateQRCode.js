const QRCode = require("qrcode");

const generateQRCode = async (data) => {
    try {
        const qrCodeUrl = await QRCode.toDataURL(data); // Generate QR code as data URL
        return qrCodeUrl;
    } catch (error) {
        console.error("Error generating QR code:", error);
        throw error;
    }
};

module.exports = generateQRCode;
