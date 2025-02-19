import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Spin, message } from "antd";
import QrScanner from "qr-scanner";
import { markAttendance, getCurrentSession } from "../services/api"; // Updated API imports

import "./QrStyles.css"; // Custom styles for the QR scanner

const QRScanner = () => {
  const scanner = useRef(null);
  const videoEl = useRef(null);
  const qrBoxEl = useRef(null);
  const [qrOn, setQrOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scannedResult, setScannedResult] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  const { selectedUnit } = useParams();
  const navigate = useNavigate();
  const scanTimeoutRef = useRef(null);

  // Fetch the current session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getCurrentSession(selectedUnit);
        if (session && session._id) {
          setSessionId(session._id);
          // Check if the session is already ended
          const now = new Date();
          if (new Date(session.endTime) <= now) {
            setSessionEnded(true);
          }
        } else {
          setSessionEnded(true); // No session found, prevent scanning
        }
      } catch {
        message.error("Error fetching session details.");
        setSessionEnded(true);
      }
    };
    fetchSession();
  }, [selectedUnit]);

  // Success handler
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
      const studentId = localStorage.getItem("userId"); // Get actual student ID from localStorage
      
      if (!studentId) {
        throw new Error("Student ID not found. Please log in again.");
      }

      await markAttendance(sessionId, studentId, token);
      message.success("Attendance marked successfully!");
      navigate("/student-dashboard");
    } catch (err) {
      message.error(err.response?.data?.message || "Error marking attendance");
      scanner.current?.start(); // Re-enable scanner if error occurs
    } finally {
      setLoading(false);
    }
  }, [sessionId, sessionEnded, navigate]);

  
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
      returnDetailedScanResult: true
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

  return (
    <div className="qr-scanner-container">
      <div className="qr-scanner-header">
        <h2>{sessionEnded ? "Session Ended" : "Scan QR Code to Mark Attendance"}</h2>
        <Button
          type="primary"
          danger
          onClick={() => {
            stopScanner();
            navigate("/student-dashboard");
          }}
        >
          Cancel
        </Button>
      </div>

      <div className="qr-video-container">
        {loading && <div className="scanning-indicator">Scanning...</div>}
        {sessionEnded ? (
          <p className="session-ended-text">Attendance is closed. The session has ended.</p>
        ) : (
          <>
            <video ref={videoEl} className="qr-video" />
            <div ref={qrBoxEl} className="qr-box">
              <img
                src="/static/images/icons/scan_qr1.svg"
                alt="QR Frame"
                className="qr-frame"
              />
            </div>
          </>
        )}
        {loading && (
          <div className="qr-loading-overlay">
            <Spin size="large" tip="Marking Attendance..." />
          </div>
        )}
      </div>

      {scannedResult && (
        <div className="qr-result">
          <p>Scanned Result: {scannedResult}</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
