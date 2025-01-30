import { useState } from "react";
import PropTypes from "prop-types";
import { generateQRCode } from "../services/api";

const QRCodeGenerator = ({ unitId }) => {
  const [qrCode, setQrCode] = useState(null);

  const handleGenerateQRCode = () => {
    generateQRCode(unitId)
      .then((response) => setQrCode(response.data.qrCode))
      .catch((error) => console.log("Error generating QR code:", error));
  };

  return (
    <div>
      <h3>Generate QR Code for Attendance</h3>
      <button onClick={handleGenerateQRCode}>Generate QR Code</button>
      {qrCode && <img src={qrCode} alt="QR Code" />}
    </div>
  );
};
QRCodeGenerator.propTypes = {
  unitId: PropTypes.string.isRequired,
};

export default QRCodeGenerator;
