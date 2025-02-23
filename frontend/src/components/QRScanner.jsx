import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Spin, Alert, Typography, Card, message } from "antd";
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
        }
      } catch {
        message.error("Error fetching session details.");
        setSessionEnded(true);
      }
    };
    fetchSession();
  }, [selectedUnit]);

  // Success handler
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

        const decoded = jwtDecode(token); // Decode token to get userId
        const studentId = decoded.userId; // Use token's userId directly
        const base64Data = result.data; // QR code data

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
        const errorMsg = err.response?.data?.message || "Error marking attendance";
        if (errorMsg === "This device has already marked attendance for this unit") {
          message.error("This device cannot mark attendance again for this unit.");
        } else {
          message.error(errorMsg);
          scanner.current?.start(); // Restart scanner for other errors
        }
      } finally {
        setLoading(false);
      }
    },
    [sessionId, sessionEnded, navigate, deviceId]
  );

  // Start scanner
  useEffect(() => {
    if (!videoEl.current || sessionEnded) return;

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

    scanTimeoutRef.current = setTimeout(() => {
      stopScanner();
      message.error("Scanning timed out. Please try again.");
    }, 30000);

    return () => {
      clearTimeout(scanTimeoutRef.current);
      if (scanner.current) {
        scanner.current.stop();
        scanner.current.destroy();
      }
    };
  }, [onScanSuccess, sessionEnded]);

  // Stop scanner
  const stopScanner = () => {
    if (scanner.current) {
      scanner.current.stop();
      scanner.current.destroy();
    }
    if (videoEl.current?.srcObject) {
      videoEl.current.srcObject.getTracks().forEach((track) => track.stop());
    }
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
          <Button type="primary" danger onClick={handleCancel} size="middle">
            Cancel
          </Button>
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