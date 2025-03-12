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

  // Enhanced fingerprint generation with caching and performance improvements
  const generateDeviceFingerprint = async () => {
    try {
      // Check if we already have a cached fingerprint
      const cachedFingerprint = localStorage.getItem('deviceFingerprint');
      const cachedCompositeFingerprint = localStorage.getItem('compositeFingerprint');
      const fingerprintTimestamp = localStorage.getItem('fingerprintTimestamp');

      // Use cached fingerprint if it's less than 24 hours old
      const isValid = fingerprintTimestamp &&
        (Date.now() - parseInt(fingerprintTimestamp) < 24 * 60 * 60 * 1000);

      if (cachedFingerprint && cachedCompositeFingerprint && isValid) {
        setDeviceId(cachedFingerprint);
        setCompositeFingerprint(cachedCompositeFingerprint);
        return;
      }

      // Asynchronously generate fingerprint in the background
      setTimeout(async () => {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const visitorId = result.visitorId;
        setDeviceId(visitorId);
        localStorage.setItem('deviceFingerprint', visitorId);

        // More efficient attributes collection
        const attributes = {
          screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language || 'unknown',
          // Simplified fingerprint collection with fewer resource-intensive checks
        };

        // Generate SHA-256 hash of combined attributes
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(attributes));
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        setCompositeFingerprint(fingerprint);
        localStorage.setItem('compositeFingerprint', fingerprint);
        localStorage.setItem('fingerprintTimestamp', Date.now().toString());
      }, 0);
    } catch (error) {
      console.error('Error generating fingerprint:', error);
      // Use a fallback fingerprint method instead of showing an error
      const fallbackFingerprint = navigator.userAgent + navigator.language + screen.width + screen.height;
      setDeviceId(fallbackFingerprint);
      setCompositeFingerprint(fallbackFingerprint);
    }
  };

  useEffect(() => {
    generateDeviceFingerprint();

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
          setSessionEnded(false);
        } else {
          setSessionEnded(true);
          message.error("No active session found for this unit or the session has ended.");
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
      message.error(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, sessionEnded, navigate, deviceId, compositeFingerprint]);

  const startScanner = useCallback(() => {
    if (!videoEl.current || sessionEnded || !sessionId) return;

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
  }, [onScanSuccess, sessionEnded, sessionId]);

  useEffect(() => {
    if (!loading && !sessionEnded && sessionId) {
      startScanner();
    }
    return () => {
      clearTimeout(scanTimeoutRef.current);
      if (scanner.current) {
        scanner.current.stop();
        scanner.current.destroy();
      }
    };
  }, [startScanner, loading, sessionEnded, sessionId]);

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