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
  const [qrOn, setQrOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scannedResult, setScannedResult] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [compositeFingerprint, setCompositeFingerprint] = useState(null);
  const [componentMounted, setComponentMounted] = useState(false); // Track if component is mounted
  const [errorMessage, setErrorMessage] = useState(null);
  const [scannerActive, setScannerActive] = useState(true); // New state to track if scanner should be active

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
    setScannerActive(false); // Mark scanner as inactive
  };

  // Improved fingerprint generation with cross-browser detection
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

        // Enhanced cross-browser attributes collection
        const attributes = {
          // Hardware-specific attributes that remain consistent across browsers
          screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
          deviceMemory: navigator.deviceMemory || 'unknown',
          platform: navigator.platform || 'unknown',
          connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
          // More reliable hardware identifiers
          gpu: getGPUInfo(),
          pixelRatio: window.devicePixelRatio || 'unknown',
          // Hardware-level canvas fingerprint
          canvas: await generateHardwareCanvasFingerprint(),
          // Audio context fingerprint (hardware dependent)
          audio: await generateAudioFingerprint(),
          // OS-level fonts rather than browser-specific
          systemFonts: detectSystemFonts(),
          // Device-specific rather than browser-specific
          deviceFeatures: getDeviceFeatures(),
          // Add IP-based identification (handled server-side)
          networkSignature: 'server-check',
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

  // Hardware-specific canvas fingerprinting that remains consistent across browsers
  const generateHardwareCanvasFingerprint = async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 200;
      canvas.height = 200;

      // Draw hardware-dependent elements
      // Use WebGL operations that depend on the graphics hardware
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        // WebGL operations that test hardware capabilities
        gl.clearColor(0.1, 0.2, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Test various hardware capabilities
        const extensionsString = gl.getSupportedExtensions().join();
        const parameterValues = [
          gl.getParameter(gl.RED_BITS),
          gl.getParameter(gl.GREEN_BITS),
          gl.getParameter(gl.BLUE_BITS),
          gl.getParameter(gl.ALPHA_BITS),
          gl.getParameter(gl.DEPTH_BITS),
          gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
          gl.getParameter(gl.MAX_TEXTURE_SIZE)
        ].join(',');

        return extensionsString + parameterValues;
      }

      // Fallback for browsers without WebGL
      // Text with graphics acceleration testing
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#F72585';
      ctx.fillText('Hardware Test', 10, 50);
      ctx.font = '18px Times New Roman';
      ctx.fillStyle = '#4361EE';
      ctx.fillText('Device Rendering', 10, 70);

      // Draw shapes that depend on hardware rendering
      const gradient = ctx.createLinearGradient(0, 0, 200, 0);
      gradient.addColorStop(0, '#3A0CA3');
      gradient.addColorStop(1, '#4CC9F0');
      ctx.fillStyle = gradient;
      ctx.fillRect(10, 90, 160, 40);

      // Hardware-dependent curves and arcs
      ctx.beginPath();
      ctx.arc(100, 150, 30, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 140, 0, 0.5)';
      ctx.fill();

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

  // Get system-level fonts rather than browser-specific
  const detectSystemFonts = () => {
    // Focus on system fonts that would be common across browsers
    const systemFontFamilies = [
      'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
      'Tahoma', 'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Webdings',
      'Symbol', 'Wingdings', 'MS Sans Serif', 'MS Serif'
    ];

    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const h = document.createElement('span');
    h.style.fontSize = testSize;
    h.innerHTML = testString;
    const body = document.body;
    body.appendChild(h);

    const result = [];

    // Check which system fonts are available
    for (const font of systemFontFamilies) {
      h.style.fontFamily = font;
      const width = h.offsetWidth;
      const height = h.offsetHeight;

      // Store font dimensions which are hardware-dependent regardless of browser
      if (width > 0 && height > 0) {
        result.push(`${font}:${width}x${height}`);
      }
    }

    body.removeChild(h);
    return result.join(',');
  };

  // Get hardware device features that remain consistent across browsers
  const getDeviceFeatures = () => {
    const features = [];

    // Check hardware capabilities
    if ('getBattery' in navigator) {
      features.push('battery-api');
    }

    // Check vibration capability (usually mobile devices)
    if ('vibrate' in navigator) {
      features.push('vibration');
    }

    // Check device orientation capability
    if ('DeviceOrientationEvent' in window) {
      features.push('orientation');
    }

    // Check touch capability
    if ('ontouchstart' in window) {
      features.push(`touch:${navigator.maxTouchPoints || 0}`);
    }

    // Check bluetooth capability
    if ('bluetooth' in navigator) {
      features.push('bluetooth');
    }

    // Check USB capability
    if ('usb' in navigator) {
      features.push('usb');
    }

    // Check for specific hardware-level APIs
    if ('gpu' in navigator) {
      features.push('gpu-api');
    }

    return features.join(',');
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
    if (!sessionId || sessionEnded) {
      setErrorMessage("Session has ended. Attendance cannot be marked.");
      stopScanner(); // Stop scanner when session has ended
      return;
    }
    stopScanner();
    setScannedResult(result?.data);
    setLoading(true);
    clearTimeout(scanTimeoutRef.current);

    try {
      // Get authentication token first and verify it's available
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Authentication failed. Please log in again.");
        return;
      }

      // First check if session is still active
      const sessionStatus = await checkSessionStatus(sessionId);
      if (!sessionStatus || !sessionStatus.active || sessionStatus.ended) {
        setErrorMessage("Session has ended. Attendance cannot be marked.");
        setSessionEnded(true);
        return;
      }

      // Decode the token to get student ID
      const decoded = jwtDecode(token);
      const studentId = decoded.userId;
      if (!studentId) {
        setErrorMessage("Invalid user information. Please log in again.");
        return;
      }

      const base64Data = result.data;

      console.log("Marking attendance with params:", {
        sessionId,
        studentId,
        hasDeviceId: !!deviceId,
        deviceIdLength: deviceId ? deviceId.length : 0,
        compositeFingerprintLength: compositeFingerprint ? compositeFingerprint.length : 0,
        qrDataLength: base64Data ? base64Data.length : 0
      });

      try {
        const response = await markAttendance(sessionId, studentId, token, deviceId, base64Data, compositeFingerprint);

        if (response.success) {
          message.success(response.message || "Attendance marked successfully!");
          navigate("/student-dashboard");
        } else {
          // Improved error message handling with more user-friendly messages
          if (response.code === "QR_CODE_EXPIRED") {
            setErrorMessage("This QR code has expired. Please ask your lecturer to show the current code.");
          } else if (response.code === "SESSION_INACTIVE") {
            setErrorMessage("This attendance session is no longer active.");
          } else if (response.code === "INVALID_QR_CODE" || response.code === "INVALID_QR_HASH" || response.code === "INCOMPLETE_QR_DATA") {
            setErrorMessage("The QR code couldn't be validated. Please ask your lecturer to show a new code.");
          } else if (response.code === "QR_DECODE_ERROR" || response.code === "QR_FORMAT_ERROR") {
            setErrorMessage("The QR code couldn't be read correctly. Please try scanning again with good lighting.");
          } else if (response.code === "ATTENDANCE_ALREADY_MARKED") {
            setErrorMessage("You've already marked attendance for this session.");
          } else if (response.code === "DEVICE_CONFLICT") {
            setErrorMessage("This device has already been used by another student. Please use your own device.");
          } else if (response.code === "DB_ERROR") {
            setErrorMessage("Database error occurred. Please try again in a moment.");
          } else if (response.code === "SERVER_ERROR") {
            setErrorMessage("Server error occurred. Please try again in a moment.");
          } else if (response.code === "PREVIOUS_ATTENDANCE_REJECTED") {
            setErrorMessage("Your previous attendance submission was rejected. Please contact your lecturer.");
          } else {
            setErrorMessage(response.message || "An unexpected error occurred. Please try again.");
          }
        }
      } catch (apiError) {
        console.error("API Error Details:", apiError);
        let errorMsg = "Something went wrong. Please try again.";

        if (apiError.status === 500) {
          errorMsg = "Server error. Please try again in a moment.";
        } else if (apiError.code) {
          // Use custom error codes to provide better error messages
          switch (apiError.code) {
            case "DEVICE_CONFLICT":
              errorMsg = "This device has already been used by another student. Please use your own device.";
              break;
            case "ATTENDANCE_ALREADY_MARKED":
              errorMsg = "You've already marked attendance for this session.";
              break;
            case "PREVIOUS_ATTENDANCE_REJECTED":
              errorMsg = "Your previous attendance submission was rejected. Please contact your lecturer.";
              break;
            // ...other cases...
            default:
              errorMsg = apiError.message || "Error marking attendance. Please try again.";
          }
        }

        setErrorMessage(errorMsg);
      }
    } catch (err) {
      console.error("Attendance marking error:", err);

      // More user-friendly error messages
      if (err.code === "DEVICE_CONFLICT") {
        setErrorMessage("This device has already been used by another student. Please use your own device.");
      } else if (err.code === "ATTENDANCE_ALREADY_MARKED") {
        setErrorMessage("You've already marked attendance for this session.");
      } else if (err.code === "PREVIOUS_ATTENDANCE_REJECTED") {
        setErrorMessage("Your previous attendance submission was rejected. Please contact your lecturer.");
      }
      // ...other error handling...
    } finally {
      setLoading(false);
    }
  }, [sessionId, sessionEnded, navigate, deviceId, compositeFingerprint]);

  const startScanner = useCallback(() => {
    // Don't start scanner if there's an error message
    if (!videoEl.current || sessionEnded || !sessionId || !componentMounted || !scannerActive) {
      console.log("Can't start scanner:", {
        hasVideoEl: !!videoEl.current,
        sessionEnded,
        hasSessionId: !!sessionId,
        componentMounted,
        scannerActive
      });
      return;
    }

    if (scanner.current) scanner.current.destroy();

    scanner.current = new QrScanner(videoEl.current, onScanSuccess, {
      onDecodeError: (err) => console.error("QR Scan Error:", err),
      preferredCamera: "environment",
      highlightScanRegion: true,
      highlightCodeOutline: true,
      overlay: qrBoxEl.current || undefined,
      maxScansPerSecond: 1,
      returnDetailedScanResult: true,
    });

    scanner.current.start().then(() => setQrOn(true)).catch(() => setQrOn(false));
    clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      stopScanner();
      message.error("Scanning timed out. Please try again.");
    }, 30000);

    setScannerActive(true); // Mark scanner as active
  }, [onScanSuccess, sessionEnded, sessionId, componentMounted, scannerActive]);

  useEffect(() => {
    if (!loading && !sessionEnded && sessionId && componentMounted && !errorMessage && scannerActive) {
      startScanner(); // Only start scanner if there's no error message
    }
    return () => {
      clearTimeout(scanTimeoutRef.current);
      if (scanner.current) {
        scanner.current.stop();
        scanner.current.destroy();
      }
    };
  }, [startScanner, loading, sessionEnded, sessionId, componentMounted, errorMessage, scannerActive]);

  useEffect(() => {
    setComponentMounted(true); // Set componentMounted to true when component is mounted
    return () => {
      setComponentMounted(false); // Clean up on unmount
    };
  }, []);

  useEffect(() => {
    // When error message appears, stop the scanner
    if (errorMessage) {
      stopScanner();
    }
  }, [errorMessage]);

  const handleRescan = () => {
    if (sessionEnded) {
      message.error("Session has ended. Cannot rescan.");
      return;
    }
    setScannedResult("");
    setLoading(false);
    setErrorMessage(null);
    setScannerActive(true); // Re-activate scanner
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
              {errorMessage && (
                <div className="qr-error-overlay">
                  <div className="qr-error-content">
                    <div className="qr-error-icon">!</div>
                    <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: '10px' }}>
                      Scanner Stopped
                    </Text>
                  </div>
                </div>
              )}
            </div>
            {errorMessage && (
              <Alert
                message="Error"
                description={
                  <div>
                    <p>{errorMessage}</p>
                    <div style={{ marginTop: '15px' }}>
                      {(errorMessage.includes("already marked") || errorMessage.includes("has ended")) ? (
                        <Button
                          type="primary"
                          onClick={() => navigate("/student-dashboard")}
                          style={{
                            backgroundColor: themeColors.primary,
                            borderColor: themeColors.primary
                          }}
                        >
                          Return to Dashboard
                        </Button>
                      ) : (
                        <Button
                          type="primary"
                          onClick={handleRescan}
                          style={{
                            backgroundColor: themeColors.secondary,
                            borderColor: themeColors.secondary
                          }}
                        >
                          Try Again
                        </Button>
                      )}
                    </div>
                  </div>
                }
                type="error"
                showIcon
                style={{ marginTop: 24, marginBottom: 16 }}
              />
            )}
            {!errorMessage && (
              <div className="scanning-status">
                <Text type={isDarkMode ? undefined : "secondary"} style={{ color: isDarkMode ? '#fff' : undefined }}>
                  Camera active - awaiting QR code
                </Text>
              </div>
            )}
          </>
        )}
        {scannedResult && !sessionEnded && !errorMessage && (
          <Text className="qr-result" strong>QR Code detected and processing...</Text>
        )}
      </Card>
    </div>
  );
};

export default QRScanner;