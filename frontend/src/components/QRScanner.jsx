import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Spin, Alert, Typography, Card, message, Space } from "antd";
import QrScanner from "qr-scanner";
import { markAttendance, getCurrentSession } from "../services/api";
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

  const { selectedUnit } = useParams();
  const navigate = useNavigate();
  const scanTimeoutRef = useRef(null);

  // Generate device fingerprint
  useEffect(() => {
    const generateDeviceFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setDeviceId(result.visitorId);
    };
    generateDeviceFingerprint();
  }, []);

  // Fetch the current session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getCurrentSession(selectedUnit);
        if (session && session._id) {
          setSessionId(session._id);
          const now = new Date();
          if (new Date(session.endTime) <= now) {
            setSessionEnded(true);
          }
        } else {
          setSessionEnded(true);
          message.error("No current session found for this unit");
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Error fetching session details";
        message.error(errorMsg);
        setSessionEnded(true);
      }
    };
    fetchSession();
  }, [selectedUnit]);

  // Success handler (defined before startScanner)
  const onScanSuccess = useCallback(
    async (result) => {
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

        console.log("Marking attendance with:", { sessionId, studentId, qrToken: base64Data, deviceId });
        if (!deviceId) throw new Error("Device identification failed.");

        // Parse QR code data (base64 encoded)
        const decodedData = JSON.parse(atob(base64Data));
        if (decodedData.s !== sessionId) {
          throw new Error("Invalid QR code for this session.");
        }

        await markAttendance(sessionId, studentId, token, deviceId, base64Data);
        message.success("Attendance marked successfully!");
        navigate("/student-dashboard");
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Error marking attendance";
        message.error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, sessionEnded, navigate, deviceId]
  );

  // Start or restart the scanner
  const startScanner = useCallback(() => {
    if (!videoEl.current || sessionEnded) return;

    if (scanner.current) {
      scanner.current.destroy(); // Clean up any existing scanner instance
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

    // Reset timeout
    clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      stopScanner();
      message.error("Scanning timed out. Please try again.");
    }, 30000);
  }, [onScanSuccess, sessionEnded]);

  // Initial scanner setup
  useEffect(() => {
    startScanner();
    return () => {
      clearTimeout(scanTimeoutRef.current);
      if (scanner.current) {
        scanner.current.stop();
        scanner.current.destroy();
      }
    };
  }, [startScanner]);

  // Stop scanner
  const stopScanner = () => {
    if (scanner.current) {
      scanner.current.stop();
      scanner.current.destroy();
      scanner.current = null; // Ensure it's fully cleared
    }
    if (videoEl.current?.srcObject) {
      videoEl.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  // Handle rescan button click
  const handleRescan = () => {
    if (sessionEnded) {
      message.error("Session has ended. Cannot rescan.");
      return;
    }
    setScannedResult(""); // Clear previous result
    setLoading(false); // Reset loading state
    startScanner(); // Restart the scanner
  };

  // Handle camera permissions
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
        {sessionEnded ? (
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