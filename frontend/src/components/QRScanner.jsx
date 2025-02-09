import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Spin, message } from "antd";
import QrScanner from "qr-scanner";
import { markStudentAttendance } from "../services/api";
import "./QrStyles.css"; // Custom styles for the QR scanner

const QRScanner = () => {
  const scanner = useRef(null);
  const videoEl = useRef(null);
  const qrBoxEl = useRef(null);
  const [qrOn, setQrOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scannedResult, setScannedResult] = useState("");
  const { unitId } = useParams();
  const navigate = useNavigate();

  // Success handler
  const onScanSuccess = useCallback(async (result) => {
    setScannedResult(result?.data);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await markStudentAttendance(unitId, result?.data, token);
      message.success("Attendance marked successfully!");
      navigate("/student-dashboard");
    } catch (err) {
      message.error(err.response?.data?.message || "Error marking attendance");
    } finally {
      setLoading(false);
      stopScanner();
    }
  }, [unitId, navigate]);

  // Fail handler
  const onScanFail = (err) => {
    console.error("QR Scan Error:", err);
  };

  // Start the scanner
  useEffect(() => {
    if (!videoEl.current) return;

    scanner.current = new QrScanner(
      videoEl.current,
      onScanSuccess,
      {
        onDecodeError: onScanFail,
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        overlay: qrBoxEl.current || undefined,
      }
    );

    scanner.current
      .start()
      .then(() => setQrOn(true))
      .catch((err) => {
        if (err) setQrOn(false);
      });

    return () => {
      if (scanner.current) {
        scanner.current.stop();
        scanner.current.destroy();
      }
    };
  }, [onScanSuccess]);

  // Stop the scanner
  const stopScanner = () => {
    if (scanner.current) {
      scanner.current.stop();
      scanner.current.destroy();
    }
    if (videoEl.current?.srcObject) {
      videoEl.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  // Handle camera permission errors
  useEffect(() => {
    if (!qrOn) {
      message.error(
        "Camera access denied. Please allow camera permissions and reload."
      );
    }
  }, [qrOn]);

  return (
    <div className="qr-scanner-container">
      <div className="qr-scanner-header">
        <h2>Scan QR Code to Mark Attendance</h2>
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

      {scannedResult && (
        <div className="qr-result">
          <p>Scanned Result: {scannedResult}</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;