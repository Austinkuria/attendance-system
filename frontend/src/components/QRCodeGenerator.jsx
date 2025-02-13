import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import PropTypes from 'prop-types';

const QRCodeGenerator = ({ sessionId, expiryTime = 30 }) => {
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(expiryTime);

  useEffect(() => {
    const newCode = `${sessionId}-${Date.now()}`;
    setCode(newCode);
    setTimer(expiryTime);

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, expiryTime]);

  return (
    <div style={{ textAlign: 'center' }}>
      <QRCode value={code} size={256} />
      <p>QR Code expires in: {timer} seconds</p>
    </div>
  );
};

QRCodeGenerator.propTypes = {
  sessionId: PropTypes.string.isRequired,
  expiryTime: PropTypes.number,
};

export default QRCodeGenerator;
