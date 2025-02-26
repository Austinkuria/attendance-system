import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Spin, Alert, Typography, Card, message, Space, Modal } from "antd";
import QrScanner from "qr-scanner";
import { markAttendance, getActiveSessionForUnit } from "../services/api";
import { jwtDecode } from "jwt-decode";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import "./QrStyles.css";

const { Title, Text } = Typography;

const QRScanner = () => {
  const scanner = useRef(null);
  const videoEl = useRef(null);
  const qrBoxEl = useRef(null);
  const [qrOn, setQrOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scannedResult, setScannedResult] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [compositeFingerprint, setCompositeFingerprint] = useState(null);

  const { selectedUnit } = useParams();
  const navigate = useNavigate();
  const scanTimeoutRef = useRef(null);

  // Enhanced fingerprint generation
  const generateDeviceFingerprint = async () => {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    setDeviceId(result.visitorId);

    // Cross-browser attributes
    const getStableAttributes = () => {
      const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const hardwareConcurrency = navigator.hardwareConcurrency || 'unknown';
      const platform = navigator.platform;
      
      // WebGL fingerprint
      const gl = document.createElement('canvas').getContext('webgl');
      const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
      const renderer = gl ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unsupported';
      
      return `${screen}|${timezone}|${hardwareConcurrency}|${platform}|${renderer}`;
    };

    // Generate SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(getStableAttributes());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setCompositeFingerprint(fingerprint);
  };

  useEffect(() => {
    generateDeviceFingerprint();

    // Consent dialog
    if (!localStorage.getItem('fingerprintConsent')) {
      Modal.confirm({
        title: 'Device Analysis',
        content: 'We use anonymous device characteristics to prevent attendance fraud. No personal data is collected.',
        onOk: () => localStorage.setItem('fingerprintConsent', 'true')
      });
    }
  }, []);

  useEffect(() => {
    const fetchSession = async () => {
      if (!selectedUnit || selectedUnit === 'undefined') {
        message.error("Invalid unit selected. Please try again from the dashboard.");
        setSessionEnded(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const session = await getActiveSessionForUnit(selectedUnit);
        if (session && session._id && !session.ended) {
          setSessionId(session._id);
          const now = new Date();
          if (new Date(session.endTime) <= now) {
            setSessionEnded(true);
            message.warning("The session has ended.");
          } else {
            setSessionEnded(false);
          }
        } else {
          setSessionEnded(true);
          message.error("No active session found for this unit.");
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Error fetching session details";
        message.error(errorMsg);
        setSessionEnded(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [selectedUnit]);

  const onScanSuccess = useCallback(async (result) => {
    if (!sessionId || sessionEnded) {
      message.error("Session has ended. Attendance cannot be marked.");
      return;
    }
  
    stopScanner();
    setScannedResult(result?.data);
    setLoading(true);
    clearTimeout(scanTimeoutRef.current);
  
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication failed. Please log in again.");
  
      const decoded = jwtDecode(token);
      const studentId = decoded.userId;
      const base64Data = result.data;
  
      const response = await markAttendance(
        sessionId, 
        studentId, 
        token, 
        deviceId, 
        base64Data,
        compositeFingerprint
      );
  
      if (response.success) {
        message.success(response.message || "Attendance marked successfully!");
        navigate("/student-dashboard");
      } else {
        // Handle backend errors
        switch (response.code) {
          case "INVALID_ID_FORMAT":
          case "NO_TOKEN_PROVIDED":
          case "TOKEN_MISMATCH":
          case "SESSION_NOT_FOUND":
          case "SESSION_INACTIVE":
          case "INVALID_QR_CODE":
          case "ATTENDANCE_ALREADY_MARKED":
          case "DEVICE_CONFLICT":
            message.error(response.message);
            break;
          default:
            message.error("An unexpected error occurred. Please try again.");
        }
      }
    } catch (err) {
      // Handle network or unexpected errors
      message.error(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, sessionEnded, navigate, deviceId, compositeFingerprint]);
  
  const startScanner = useCallback(() => {
    if (!videoEl.current || sessionEnded) return;

    if (scanner.current) {
      scanner.current.destroy();
    }

    scanner.current = new QrScanner(videoEl.current, onScanSuccess, {
      onDecodeError: (err) => console.error("QR Scan Error:", err),
      preferredCamera: "environment",
      highlightScanRegion: true,
      highlightCodeOutline: true,
      overlay: qrBoxEl.current || undefined,
      maxScansPerSecond: 1,
      returnDetailedScanResult: true,
    });

    scanner.current
      .start()
      .then(() => setQrOn(true))
      .catch(() => setQrOn(false));

    clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      stopScanner();
      message.error("Scanning timed out. Please try again.");
    }, 30000);
  }, [onScanSuccess, sessionEnded]);

  useEffect(() => {
    if (!sessionEnded) {
      startScanner();
    }
    return () => {
      clearTimeout(scanTimeoutRef.current);
      if (scanner.current) {
        scanner.current.stop();
        scanner.current.destroy();
      }
    };
  }, [startScanner, sessionEnded]);

  const stopScanner = () => {
    if (scanner.current) {
      scanner.current.stop();
      scanner.current.destroy();
      scanner.current = null;
    }
    if (videoEl.current?.srcObject) {
      videoEl.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const handleRescan = () => {
    if (sessionEnded) {
      message.error("Session has ended. Cannot rescan.");
      return;
    }
    setScannedResult("");
    setLoading(false);
    startScanner();
  };

  useEffect(() => {
    if (!qrOn) {
      message.error("Camera access denied. Please allow permissions.");
    }
  }, [qrOn]);

  const handleCancel = () => {
    stopScanner();
    navigate("/student-dashboard");
  };

  return (
    <div className="qr-scanner-container">
      <Card
        className="qr-scanner-card"
        title={
          <Title level={4} style={{ color: "#fff", margin: 0 }}>
            {sessionEnded ? "Session Ended" : "Scan QR Code"}
          </Title>
        }
        extra={
          <Space>
            <Button type="primary" onClick={handleRescan} disabled={loading || sessionEnded}>
              Rescan
            </Button>
            <Button type="primary" danger onClick={handleCancel} size="middle">
              Cancel
            </Button>
          </Space>
        }
      >
        {loading ? (
          <Spin size="large" tip="Loading session..." />
        ) : sessionEnded ? (
          <Alert
            message="Session Ended"
            description="The session has ended, and attendance marking is no longer available."
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        ) : (
          <div className="qr-video-container">
            <video ref={videoEl} className="qr-video" />
            <div ref={qrBoxEl} className="qr-box">
              <img
                src="/static/images/icons/scan_qr1.svg"
                alt="QR Frame"
                className="qr-frame"
              />
            </div>
            {loading && (
              <div className="qr-loading-overlay">
                <Spin size="large" tip="Marking Attendance..." />
              </div>
            )}
          </div>
        )}

        {scannedResult && !sessionEnded && (
          <Text className="qr-result" strong>
            Scanned Result: {scannedResult}
          </Text>
        )}
      </Card>
    </div>
  );
};

export default QRScanner;