// import { useState } from "react";
// import PropTypes from "prop-types";
// import { Button, Modal } from "antd";
// import * as QRCode from 'qrcode.react';


// const QRCodeGenerator = ({ onGenerate }) => {
//   const [qrCode, setQRCode] = useState("");

//   const handleGenerate = async () => {
//     const qrRes = await onGenerate();
//     setQRCode(qrRes);
//   };

//   return (
//     <>
//       <Button onClick={handleGenerate}>Generate QR Code</Button>
//       {qrCode && (
//         <Modal
//           title="QR Code"
//           visible={!!qrCode}
//           onCancel={() => setQRCode("")}
//           footer={null}
//         >
//           <QRCode value={qrCode} size={256} />
//         </Modal>
//       )}
//     </>
//   );
// };
// QRCodeGenerator.propTypes = {
//   onGenerate: PropTypes.func.isRequired,
// };

// export default QRCodeGenerator;
