import { useEffect, useRef, useState, useCallback, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Spin, Alert, Typography, Card, message, Space, Modal } from "antd";
import QrScanner from "qr-scanner";
import { markAttendance, getActiveSessionForUnit, checkSessionStatus } from "../services/api";
import { jwtDecode } from "jwt-decode";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import "./QrStyles.css";
import { ThemeContext } from "../context/ThemeContext";

const { Title, Text } = Typography;

const QRScanner = () => {
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const scanner = useRef(null);
  const videoEl = useRef(null);
  const qrBoxEl = useRef(null);
  const [qrOn, setQrOn] = useState(false); // Start with false instead of true
  const [loading, setLoading] = useState(true); // Start with true to show loading state
  const [scannedResult, setScannedResult] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [compositeFingerprint, setCompositeFingerprint] = useState(null);
  const [componentMounted, setComponentMounted] = useState(false); // Track if component is mounted
  const [errorMessage, setErrorMessage] = useState(null);

  const { selectedUnit } = useParams();
  const navigate = useNavigate();
  const scanTimeoutRef = useRef(null);

  // Move stopScanner declaration here, before it's used in onScanSuccess
  const stopScanner = () => {
    if (scanner.current) {
      scanner.current.stop();
      scanner.current.destroy();
      scanner.current = null;
    }
    if (videoEl.current?.srcObject) videoEl.current.srcObject.getTracks().forEach(track => track.stop());
  };

  // Fingerprint generation and other useEffect hooks remain unchanged
  const generateDeviceFingerprint = async () => {
    try {
      const cachedFingerprint = localStorage.getItem('deviceFingerprint');
      const cachedCompositeFingerprint = localStorage.getItem('compositeFingerprint');
      const fingerprintTimestamp = localStorage.getItem('fingerprintTimestamp');
      const isValid = fingerprintTimestamp && (Date.now() - parseInt(fingerprintTimestamp) < 24 * 60 * 60 * 1000);

      if (cachedFingerprint && cachedCompositeFingerprint && isValid) {
        setDeviceId(cachedFingerprint);
        setCompositeFingerprint(cachedCompositeFingerprint);
        return;
      }

      setTimeout(async () => {
        // Using FingerprintJS for the main visitor ID
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const visitorId = result.visitorId;
        setDeviceId(visitorId);
        localStorage.setItem('deviceFingerprint', visitorId);

        // Enhanced device attributes collection
        const attributes = {
          // Basic screen properties
          screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
          // Timezone and language
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language || 'unknown',
          // Hardware info
          hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
          deviceMemory: navigator.deviceMemory || 'unknown',
          platform: navigator.platform || 'unknown',
          // Connection info if available
          connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
          // GPU info if available
          gpu: getGPUInfo(),
          // Canvas fingerprint
          canvas: await generateCanvasFingerprint(),
          // Audio context fingerprint
          audio: await generateAudioFingerprint(),
          // WebGL fingerprint
          webgl: getWebGLFingerprint(),
          // Font detection fingerprint
          fonts: detectCommonFonts(),
          // User agent normalized components
          userAgentData: getUserAgentComponents()
        };

        // Generate a composite fingerprint from all attributes
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
      const fallbackFingerprint = navigator.userAgent + navigator.language + screen.width + screen.height;
      setDeviceId(fallbackFingerprint);
      setCompositeFingerprint(fallbackFingerprint);
    }
  };

  // Canvas fingerprinting to detect same device across browsers
  const generateCanvasFingerprint = async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 200;
      canvas.height = 200;

      // Text with different fonts, colors and transformations
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#F72585';
      ctx.fillText('Canvas Fingerprint', 10, 50);
      ctx.font = '18px Times New Roman';
      ctx.fillStyle = '#4361EE';
      ctx.fillText('Attendance System', 10, 70);

      // Add some shapes with gradients
      const gradient = ctx.createLinearGradient(0, 0, 200, 0);
      gradient.addColorStop(0, '#3A0CA3');
      gradient.addColorStop(1, '#4CC9F0');
      ctx.fillStyle = gradient;
      ctx.fillRect(10, 90, 160, 40);

      // Some arcs and curves that depend on device rendering
      ctx.beginPath();
      ctx.arc(100, 150, 30, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 140, 0, 0.5)';
      ctx.fill();

      // Get the canvas data URL and hash it
      const dataURL = canvas.toDataURL();
      const encoder = new TextEncoder();
      const data = encoder.encode(dataURL);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Canvas fingerprinting error:', error);
      return 'canvas-unavailable';
    }
  };

  // Audio fingerprinting (detects audio processing characteristics)
  const generateAudioFingerprint = async () => {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) {
        return 'audio-unsupported';
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gain = audioContext.createGain();

      analyser.fftSize = 1024;
      gain.gain.value = 0; // Mute the sound

      oscillator.type = 'triangle';
      oscillator.frequency.value = 440; // A4 note

      oscillator.connect(analyser);
      analyser.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(0);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      oscillator.stop();
      audioContext.close();

      // Use first 20 frequency bins as fingerprint
      const limitedArray = Array.from(dataArray.slice(0, 20));
      return limitedArray.join(',');
    } catch (error) {
      console.error('Audio fingerprinting error:', error);
      return 'audio-error';
    }
  };

  // WebGL fingerprinting
  const getWebGLFingerprint = () => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) {
        return 'webgl-unsupported';
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        return 'webgl-no-debug-info';
      }

      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

      return `${vendor}-${renderer}`;
    } catch (error) {
      console.error('WebGL fingerprinting error:', error);
      return 'webgl-error';
    }
  };

  // Get GPU info
  const getGPUInfo = () => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) {
        return 'gpu-info-unavailable';
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        return 'gpu-debug-info-unavailable';
      }

      return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    } catch (error) {
      console.error('GPU info error:', error);
      return 'gpu-error';
    }
  };

  // Font detection
  const detectCommonFonts = () => {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const fontList = [
      'Arial', 'Courier New', 'Georgia', 'Times New Roman',
      'Verdana', 'Tahoma', 'Trebuchet MS'
    ];

    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const h = document.createElement('span');
    h.style.fontSize = testSize;
    h.innerHTML = testString;
    const body = document.body;
    body.appendChild(h);

    const result = [];

    for (const font of fontList) {
      let detected = true;
      for (const baseFont of baseFonts) {
        h.style.fontFamily = `'${font}', ${baseFont}`;
        const defaultWidth = h.offsetWidth;
        const defaultHeight = h.offsetHeight;

        h.style.fontFamily = baseFont;
        const baseWidth = h.offsetWidth;
        const baseHeight = h.offsetHeight;

        if (defaultWidth !== baseWidth || defaultHeight !== baseHeight) {
          detected = true;
          break;
        } else {
          detected = false;
        }
      }

      if (detected) {
        result.push(font);
      }
    }

    body.removeChild(h);
    return result.join(',');
  };

  // Extract consistent user agent components
  const getUserAgentComponents = () => {
    const ua = navigator.userAgent;
    // Extract OS info
    let os = 'unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'Mac';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    // Extract device type
    let deviceType = 'desktop';
    if (ua.includes('Mobile')) deviceType = 'mobile';
    else if (ua.includes('Tablet') || ua.includes('iPad')) deviceType = 'tablet';

    return `${os}-${deviceType}`;
  };

  useEffect(() => {
    generateDeviceFingerprint();
    // Use 'hasConfirmedDeviceAnalysis' instead of 'fingerprintConsent' to be consistent
    if (!localStorage.getItem('hasConfirmedDeviceAnalysis')) {
      Modal.confirm({
        title: 'Device Analysis',
        content: 'We use anonymous device characteristics to prevent attendance fraud. No personal data is collected.',
        onOk: () => localStorage.setItem('hasConfirmedDeviceAnalysis', 'true'),
        className: isDarkMode ? 'dark-mode-modal' : '',
        // Consistent theme styling for modal content
        bodyStyle: isDarkMode ? {
          background: themeColors.cardBg || '#1f1f1f',
          color: '#fff'
        } : {},
        maskStyle: isDarkMode ? {
          backgroundColor: 'rgba(0,0,0,0.7)'
        } : {},
        // Use theme colors for all buttons regardless of mode
        okButtonProps: {
          style: {
            backgroundColor: themeColors.secondary,
            borderColor: themeColors.secondary,
            color: '#fff'
          }
        },
        cancelButtonProps: {
          style: {
            backgroundColor: themeColors.accent,
            borderColor: themeColors.accent,
            color: '#fff'
          }
        }
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
          navigate("/student-dashboard");
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Error fetching session details";
        message.error(errorMsg);
        setSessionEnded(true);
        navigate("/student-dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [selectedUnit, navigate]);

  const onScanSuccess = useCallback(async (result) => {
    // Validate session before proceeding
    if (!sessionId || sessionEnded) {
      setErrorMessage("Session has ended. Attendance cannot be marked.");
      return;
    }

    if (!result || !result.data) {
      setErrorMessage("Invalid QR code. Please try again.");
      return;
    }

    // Update UI state
    setScannedResult(result.data || "");
    setLoading(true);
    clearTimeout(scanTimeoutRef.current);

    try {
      // Validate the token first
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Authentication failed. Please log in again.");
        setLoading(false);
        return;
      }

      // Check if session is still active
      try {
        const sessionStatus = await checkSessionStatus(sessionId);
        if (!sessionStatus || !sessionStatus.active || sessionStatus.ended) {
          setErrorMessage("Session has ended. Attendance cannot be marked.");
          setSessionEnded(true);
          setLoading(false);
          return;
        }
      } catch (sessionErr) {
        console.error("Session check failed:", sessionErr);
        setErrorMessage("Error checking session status. Please try again.");
        setLoading(false);
        return;
      }

      // Decode the token to get student ID with error handling
      let studentId;
      try {
        const decoded = jwtDecode(token);
        studentId = decoded?.userId;
        if (!studentId) {
          throw new Error("Invalid token data");
        }
      } catch (tokenErr) {
        console.error("Token decode error:", tokenErr);
        setErrorMessage("Invalid user information. Please log in again.");
        setLoading(false);
        return;
      }

      // Use a clean QR data
      const base64Data = result.data.trim();

      // Log QR data for debugging (truncated for privacy)
      console.log("Attempting to mark attendance with QR data:", {
        sessionId,
        studentId,
        deviceIdPresent: !!deviceId,
        qrDataLength: base64Data?.length || 0,
        qrDataSample: base64Data ? `${base64Data.substring(0, 20)}...` : "empty"
      });

      // Stop the scanner when proceeding with the API call
      stopScanner();

      try {
        // Validate all parameters before making the API call
        if (!sessionId || !studentId || !token || !deviceId || !base64Data) {
          throw {
            message: "Missing required attendance information",
            code: "MISSING_DATA",
            success: false
          };
        }

        // Make the API call
        const response = await markAttendance(
          sessionId,
          studentId,
          token,
          deviceId,
          base64Data,
          compositeFingerprint || "fallback-fingerprint"
        );

        if (response.success) {
          message.success(response.message || "Attendance marked successfully!");
          navigate("/student-dashboard");
        } else {
          // Handle error responses
          if (response.code === "QR_CODE_EXPIRED") {
            setErrorMessage("QR code has expired. Please ask your lecturer to regenerate it.");
          } else if (["INVALID_QR_CODE", "QR_DECODE_ERROR", "INVALID_QR_FORMAT"].includes(response.code)) {
            setErrorMessage("Could not read QR code properly. Please try scanning again.");
            // Restart scanner after a delay
            setTimeout(() => {
              setLoading(false);
              startScanner();
            }, 1500);
            return;
          } else {
            setErrorMessage(response.message || "An unexpected error occurred. Please try again.");
          }
        }
      } catch (err) {
        // Handle specific API errors
        console.error("Attendance marking error:", err);

        if (err.code === "NETWORK_ERROR") {
          setErrorMessage("Network error. Please check your connection and try again.");
        } else if (["INVALID_QR_CODE", "QR_DECODE_ERROR", "INVALID_QR_FORMAT"].includes(err.code)) {
          setErrorMessage("Could not read QR code. Please try scanning again.");
          setTimeout(() => {
            setLoading(false);
            startScanner();
          }, 1500);
          return;
        } else {
          setErrorMessage(err.message || "Failed to mark attendance. Please try again.");
        }
      }
    } catch (err) {
      console.error("Uncaught error in scan handler:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, sessionEnded, navigate, deviceId, compositeFingerprint, stopScanner, startScanner]);

  // When starting the scanner, configure it with better settings
  const startScanner = useCallback(() => {
    // Check all required elements are available
    if (!videoEl.current || sessionEnded || !sessionId || !componentMounted) {
      console.log("Can't start scanner:", {
        hasVideoEl: !!videoEl.current,
        sessionEnded,
        hasSessionId: !!sessionId,
        componentMounted
      });
      return;
    }

    // Clean up any existing scanner before creating a new one
    if (scanner.current) {
      try {
        scanner.current.destroy();
        scanner.current = null;
      } catch (err) {
        console.error("Error destroying previous scanner:", err);
      }
    }

    try {
      // Create a scanner wrapper function that can handle errors safely
      const safeOnScanSuccess = (result) => {
        try {
          if (result && result.data) {
            // Clean up the QR data
            result.data = result.data.trim();
          }
          onScanSuccess(result);
        } catch (err) {
          console.error("Error in scan success handler:", err);
          setErrorMessage("An error occurred processing the QR code. Please try again.");
          setLoading(false);
        }
      };

      // Initialize with better error catching
      scanner.current = new QrScanner(videoEl.current, safeOnScanSuccess, {
        onDecodeError: (err) => {
          // Only log meaningful errors
          if (err.message && !err.message.includes("not found")) {
            console.error("QR Scan Error:", err);
          }
        },
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 2, // Increase to 2 for better detection
        returnDetailedScanResult: true,
        calculateScanRegion: (videoElement) => {
          const scanRegionSize = Math.min(videoElement.offsetWidth, videoElement.offsetHeight) * 0.8;
          const scanRegionLeft = (videoElement.offsetWidth - scanRegionSize) / 2;
          const scanRegionTop = (videoElement.offsetHeight - scanRegionSize) / 2;
          return {
            x: Math.max(0, scanRegionLeft),
            y: Math.max(0, scanRegionTop),
            width: scanRegionSize,
            height: scanRegionSize
          };
        }
      });

      // Start the scanner with error handling
      scanner.current.start()
        .then(() => {
          console.log("QR scanner started successfully");
          setQrOn(true);
        })
        .catch((error) => {
          console.error("Camera error:", error);
          setQrOn(false);
          setErrorMessage("Failed to access camera. Please check permissions and try again.");
        });

      // Set a timeout to prevent scanning for too long
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = setTimeout(() => {
        stopScanner();
        setErrorMessage("Scanning timed out. Please try again.");
      }, 30000);
    } catch (err) {
      console.error("Error initializing scanner:", err);
      setErrorMessage("Failed to initialize camera. Please try again.");
      setQrOn(false);
    }
  }, [onScanSuccess, sessionEnded, sessionId, componentMounted, stopScanner]);

  useEffect(() => {
    if (!loading && !sessionEnded && sessionId && componentMounted) startScanner(); // Ensure component is mounted
    return () => {
      clearTimeout(scanTimeoutRef.current);
      if (scanner.current) {
        scanner.current.stop();
        scanner.current.destroy();
      }
    };
  }, [startScanner, loading, sessionEnded, sessionId, componentMounted]);

  useEffect(() => {
    setComponentMounted(true); // Set componentMounted to true when component is mounted
    return () => {
      setComponentMounted(false); // Clean up on unmount
    };
  }, []);

  const handleRescan = () => {
    if (sessionEnded) {
      message.error("Session has ended. Cannot rescan.");
      return;
    }
    setScannedResult("");
    setLoading(false);
    setErrorMessage(null); // Clear any error messages
    startScanner();
  };

  useEffect(() => {
    if (!qrOn) message.error("Camera access denied. Please allow permissions.");
  }, [qrOn]);

  const handleCancel = () => {
    stopScanner();
    navigate("/student-dashboard");
  };

  return (
    <div
      className="qr-scanner-container"
      style={{
        '--background': `linear-gradient(135deg, ${themeColors.background}, ${themeColors.border})`,
        '--card-bg': themeColors.cardBg,
        '--card-head-bg': themeColors.primary,
        '--card-head-text': '#fff',
        '--text-color': themeColors.text,
        '--primary': themeColors.primary,
        '--loading-bg': isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
        '--secondary': themeColors.secondary,
      }}
    >
      <Card
        className="qr-scanner-card"
        title={<Title level={4} style={{ color: "#fff", margin: 0 }}>{sessionEnded ? "Session Ended" : "Scan QR Code"}</Title>}
        extra={
          <Space>
            <Button
              type="primary"
              onClick={handleRescan}
              disabled={loading || sessionEnded}
              className="rescan-button"
              style={{
                backgroundColor: themeColors.secondary,
                borderColor: themeColors.secondary,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Rescan
            </Button>
            <Button
              type="primary"
              onClick={handleCancel}
              size="middle"
              style={{
                backgroundColor: themeColors.accent,
                borderColor: themeColors.accent,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Cancel
            </Button>
          </Space>
        }
      >
        {loading ? (
          <Spin size="large" tip="Verifying session status..." />
        ) : sessionEnded ? (
          <Alert
            message="Session Ended"
            description="The session has ended, and attendance marking is no longer available."
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        ) : (
          <>
            <div className="scanning-instructions">
              <Text strong style={{ color: isDarkMode ? '#fff' : themeColors.text }}>
                Position the QR code within the frame to mark attendance
              </Text>
            </div>
            <div className="qr-video-container">
              <video ref={videoEl} className="qr-video" />
              <div ref={qrBoxEl} className="qr-box">
                <div className="corner-indicator top-left"></div>
                <div className="corner-indicator top-right"></div>
                <div className="corner-indicator bottom-left"></div>
                <div className="corner-indicator bottom-right"></div>
                <div className="scanning-line"></div>
                <img src="/static/images/icons/scan_qr1.svg" alt="QR Frame" className="qr-frame" />
              </div>
              {loading && (
                <div className="qr-loading-overlay">
                  <Spin size="large" tip="Processing attendance data..." />
                </div>
              )}
            </div>
            {errorMessage && (
              <Alert
                message="Error"
                description={errorMessage}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <div className="scanning-status">
              <Text type={isDarkMode ? undefined : "secondary"} style={{ color: isDarkMode ? '#fff' : undefined }}>
                Camera active - awaiting QR code
              </Text>
            </div>
          </>
        )}
        {scannedResult && !sessionEnded && (
          <Text className="qr-result" strong>Scanned Result: {scannedResult}</Text>
        )}
      </Card>
    </div>
  );
};

export default QRScanner;