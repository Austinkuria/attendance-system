import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Button, Spin, Result, message } from "antd";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { CloseOutlined, CameraOutlined } from "@ant-design/icons";

const QRScanner = ({ onScanSuccess, onClose }) => {
  const [cameraError, setCameraError] = useState(false);
  const [activeCamera, setActiveCamera] = useState("environment");
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleScan = async (result) => {
    if (processing || result === lastResult) return;
    
    setProcessing(true);
    setLastResult(result);
    
    try {
      await onScanSuccess(result);
      message.success("Attendance marked successfully!");
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      message.error(error.message);
      setLastResult(null);
    } finally {
      setProcessing(false);
    }
  };

  const toggleCamera = () => {
    setActiveCamera(prev => prev === "environment" ? "user" : "environment");
  };

  useEffect(() => {
    if (cameraError) {
      message.error("Camera access denied. Please enable camera permissions.");
    }
  }, [cameraError]);

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Scan Attendance QR Code</h2>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            style={styles.closeButton}
          />
        </div>

        {cameraError ? (
          <div style={styles.errorContainer}>
            <Result
              status="error"
              title="Camera Access Required"
              subTitle="Please enable camera permissions to continue"
              extra={
                <Button
                  type="primary"
                  onClick={() => window.location.reload()}
                >
                  Reload & Allow Access
                </Button>
              }
            />
          </div>
        ) : (
          <div style={styles.scannerWrapper}>
            <QrScanner
              constraints={{ facingMode: activeCamera }}
              scanDelay={500}
              onResult={handleScan}
              onError={(error) => {
                console.error(error);
                setCameraError(true);
              }}
              containerStyle={styles.scannerContainer}
              videoStyle={styles.video}
            />

            <div style={styles.overlayFrame}>
              <div style={styles.frame}>
                <div style={styles.laser} />
                {[0, 90, 180, 270].map((rotation, i) => (
                  <div 
                    key={i}
                    style={{
                      ...styles.corner,
                      transform: `rotate(${rotation}deg)`,
                      ...cornerPositions[i]
                    }}
                  />
                ))}
              </div>
              <div style={styles.scanLabel}>Align QR code within frame to scan</div>
            </div>

            {processing && (
              <div style={styles.processingOverlay}>
                <Spin size="large" tip="Verifying attendance..." />
              </div>
            )}
          </div>
        )}

        <div style={styles.controls}>
          <Button
            type="primary"
            shape="round"
            icon={<CameraOutlined />}
            onClick={toggleCamera}
            style={styles.cameraButton}
          >
            Switch Camera
          </Button>
        </div>
      </div>
    </div>
  );
};

QRScanner.propTypes = {
  onScanSuccess: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
  },
  container: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '2rem',
    width: '90%',
    maxWidth: '600px',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    color: 'white',
  },
  title: {
    margin: 0,
    fontWeight: 600,
  },
  closeButton: {
    color: 'white',
    fontSize: '1.2rem',
  },
  scannerWrapper: {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  scannerContainer: {
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  },
  video: {
    filter: 'brightness(0.9)',
    objectFit: 'cover',
  },
  overlayFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  frame: {
    position: 'relative',
    width: '70%',
    maxWidth: '300px',
    aspectRatio: '1',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '24px',
    animation: 'pulse 2s infinite',
  },
  laser: {
    position: 'absolute',
    width: '100%',
    height: '2px',
    background: '#ff4757',
    boxShadow: '0 0 8px #ff475744',
    animation: 'scan 2s infinite linear',
  },
  corner: {
    position: 'absolute',
    width: '20px',
    height: '20px',
    borderColor: '#00ff88',
    borderWidth: '4px',
  },
  scanLabel: {
    position: 'absolute',
    bottom: '-40px',
    color: 'white',
    fontSize: '0.9rem',
    textAlign: 'center',
    width: '100%',
    opacity: 0.8,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '16px',
  },
  controls: {
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  cameraButton: {
    background: 'linear-gradient(45deg, #1890ff, #0066ff)',
    border: 'none',
    padding: '0.8rem 1.5rem',
    fontWeight: 500,
    transition: 'transform 0.2s',
  },
};

const cornerPositions = [
  { top: -2, left: -2, borderTop: '4px solid #00ff88', borderLeft: '4px solid #00ff88' },
  { top: -2, right: -2, borderTop: '4px solid #00ff88', borderRight: '4px solid #00ff88' },
  { bottom: -2, left: -2, borderBottom: '4px solid #00ff88', borderLeft: '4px solid #00ff88' },
  { bottom: -2, right: -2, borderBottom: '4px solid #00ff88', borderRight: '4px solid #00ff88' },
];

export default QRScanner;