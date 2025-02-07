import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Button, Spin, message } from 'antd';
import { markStudentAttendance } from '../services/api';

const QrScanner = () => {
  const videoRef = useRef(null);
  const codeReader = useRef(new BrowserQRCodeReader());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { unitId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const startScanner = async () => {
      try {
        const constraints = {
          video: { facingMode: 'environment' },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        codeReader.current.decodeFromVideoElement(
          videoRef.current,
          async (result, error) => {
            if (result) {
              try {
                setLoading(true);
                const token = localStorage.getItem('token');
                await markStudentAttendance(unitId, result.getText(), token);
                message.success('Attendance marked successfully!');
                navigate('/student/dashboard');
              } catch (err) {
                message.error(err.response?.data?.message || 'Error marking attendance');
              } finally {
                setLoading(false);
                stopScanner();
              }
            }
            if (error) {
              console.error('QR Code Error:', error);
            }
          }
        );
      } catch (err) {
        setError('Camera access denied. Please enable camera permissions.');
        console.error('Camera Error:', err);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [unitId, navigate]);

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    codeReader.current.reset();
  };

  return (
    <div style={{ textAlign: 'center', padding: '24px' }}>
      <h2>Scan QR Code to Mark Attendance</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div style={{ position: 'relative', margin: '20px auto', maxWidth: '600px' }}>
        <video
          ref={videoRef}
          style={{ width: '100%', borderRadius: '8px' }}
          playsInline
        />
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Spin size="large" tip="Processing..." />
          </div>
        )}
      </div>

      <Button
        type="primary"
        danger
        onClick={() => {
          stopScanner();
          navigate('/student/dashboard');
        }}
      >
        Cancel Scanning
      </Button>
    </div>
  );
};

export default QrScanner;