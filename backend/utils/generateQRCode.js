const QRCode = require("qrcode");

const generateQRCode = async (data) => {
    try {
        if (!data) {
            throw new Error("QR data is empty or undefined");
        }
        console.log("Generating QR Code for data:", data);
        const qrCodeUrl = await QRCode.toDataURL(data); // Generate QR code as data URL
        return qrCodeUrl;
    } catch (error) {
        console.error("Error generating QR code:", error);
        throw error;
    }
};

module.exports = generateQRCode;
