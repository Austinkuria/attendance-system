import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import {
  Button,
  Table,
  Modal,
  Select,
  Space,
  Tag,
  Skeleton,
  message,
  Grid,
  Typography,
  DatePicker,
  Spin,
} from "antd";
import {
  QrcodeOutlined,
  DownloadOutlined,
  CalendarOutlined,
  BookOutlined,
  SyncOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import axios from "axios";
import {
  API_URL,
  getLecturerUnits,
  getDepartments,
  detectCurrentSession,
  createSession,
  regenerateQR,
} from "../services/api";
import moment from "moment";
import { ThemeContext } from "../context/ThemeContext";
import { useTableStyles } from './SharedTableStyles';
import { useModalStyles } from './SharedModalStyles';
import StatCard from './StatCard';
import PageHeader from './PageHeader';

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text } = Typography;

const AttendanceManagement = ({ onLoadingChange }) => {
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const screens = useBreakpoint();
  const [attendance, setAttendance] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrData, setQrData] = useState("");
  const [currentSession, setCurrentSession] = useState(() => {
    const savedSession = localStorage.getItem("currentSession");
    try {
      const parsedSession = savedSession ? JSON.parse(savedSession) : null;
      // Only restore if session hasn't ended and is still valid
      if (parsedSession && !parsedSession.ended && new Date(parsedSession.endSession) > new Date()) {
        return parsedSession;
      }
    } catch {
      localStorage.removeItem("currentSession");
    }
    return null;
  });
  const [departments, setDepartments] = useState([]);
  const lecturerId = localStorage.getItem("userId");
  const [loading, setLoading] = useState({
    units: true,
    realTimeAttendance: false,
    pastAttendance: false,
    stats: false,
    qr: false,
    session: false,
  });
  const [loadingSessionData, setLoadingSessionData] = useState(true);
  const [unitFilters, setUnitFilters] = useState({
    department: null,
    year: null,
    semester: null,
  });
  const [pastSessions, setPastSessions] = useState([]);
  const [pastAttendance, setPastAttendance] = useState([]);
  const [pastFilters, setPastFilters] = useState({
    unit: null,
    date: moment().format("YYYY-MM-DD"),
    sessionId: null,
    year: null,
    semester: null,
  });

  useEffect(() => {
    if (currentSession) {
      localStorage.setItem("currentSession", JSON.stringify(currentSession));
    } else {
      localStorage.removeItem("currentSession");
    }
  }, [currentSession]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch {
        message.error("Failed to fetch departments");
      }
    };
    if (departments.length === 0) fetchDepartments();
  }, [departments]);

  // Modify checkCurrentSession to handle both localStorage and API checks
  const checkCurrentSession = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, session: true }));
      setLoadingSessionData(true);

      // First check localStorage
      const savedSession = localStorage.getItem("currentSession");
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        if (!parsedSession.ended && new Date(parsedSession.endSession) > new Date()) {
          setCurrentSession(parsedSession);
          setQrData(parsedSession.qrCode);
          setSelectedUnit(parsedSession.unit?._id || parsedSession.unit);
          setLoadingSessionData(false);
          setLoading((prev) => ({ ...prev, session: false }));
          return; // Exit early if we have a valid session
        }
      }

      // Only check server if no valid session in localStorage
      const { data } = await detectCurrentSession(lecturerId);
      if (data && !data.ended && new Date(data.endTime) > new Date()) {
        const sessionData = {
          ...data,
          startSession: new Date(data.startTime),
          endSession: new Date(data.endTime),
        };
        setCurrentSession(sessionData);
        setQrData(data.qrCode);
        setSelectedUnit(data.unit?._id || data.unit);
        localStorage.setItem("currentSession", JSON.stringify(sessionData));
      } else {
        setCurrentSession(null);
        setQrData("");
        localStorage.removeItem("currentSession");
      }
    } catch (error) {
      console.error("Session check error:", error);
      setCurrentSession(null);
      setQrData("");
      localStorage.removeItem("currentSession");
    } finally {
      setLoading((prev) => ({ ...prev, session: false }));
      setLoadingSessionData(false);
    }
  }, [lecturerId]);

  // Initial unit load effect
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        if (!lecturerId) {
          message.error("User session expired");
          return;
        }
        setLoading((prev) => ({ ...prev, units: true }));
        const unitsData = await getLecturerUnits(lecturerId);
        if (unitsData?.length > 0) {
          setUnits(unitsData);
        } else {
          message.info("No units assigned to your account");
        }
      } catch {
        message.error("Failed to load unit data");
      } finally {
        setLoading((prev) => ({ ...prev, units: false }));
      }
    };

    if (lecturerId && units.length === 0) fetchUnits();
  }, [lecturerId, units.length]);

  // Consolidate session-related effects into one initial check
  useEffect(() => {
    // Only check for active sessions on initial load
    checkCurrentSession();

    // Set up session expiry check
    const intervalId = setInterval(() => {
      const sessionJSON = localStorage.getItem("currentSession");
      if (sessionJSON) {
        try {
          const session = JSON.parse(sessionJSON);
          if (session && new Date(session.endSession) < new Date()) {
            setCurrentSession(null);
            setQrData("");
            localStorage.removeItem("currentSession");
          }
        } catch (error) {
          console.error("Error checking session expiry:", error);
          localStorage.removeItem("currentSession");
        }
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [checkCurrentSession]);

  // This effect will only run when user manually selects a unit
  useEffect(() => {
    const checkSelectedUnitSession = async () => {
      // Skip unnecessary checks
      if (!selectedUnit || loading.session) return;

      try {
        setLoading((prev) => ({ ...prev, session: true }));
        setLoadingSessionData(true);

        // First check localStorage for this unit
        const savedSession = localStorage.getItem("currentSession");
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          if (parsedSession.unit?._id === selectedUnit &&
            !parsedSession.ended &&
            new Date(parsedSession.endSession) > new Date()) {
            setCurrentSession(parsedSession);
            setQrData(parsedSession.qrCode);
            setLoadingSessionData(false);
            setLoading((prev) => ({ ...prev, session: false }));
            return;
          }
        }

        // Only make API call if no valid session in localStorage
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          `${API_URL}/sessions/current/${selectedUnit}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data && response.data._id && !response.data.ended) {
          const unitName = units.find((u) => u._id === response.data.unit)?.name || "Unknown Unit";
          const sessionData = {
            ...response.data,
            unit: { name: unitName, _id: selectedUnit },
            startSession: new Date(response.data.startTime),
            endSession: new Date(response.data.endTime),
          };
          setCurrentSession(sessionData);
          setQrData(response.data.qrCode);
          localStorage.setItem("currentSession", JSON.stringify(sessionData));
        } else {
          // Clear session state but don't trigger another check
          setCurrentSession(null);
          setQrData("");
          localStorage.removeItem("currentSession");
        }
      } catch (error) {
        console.error("Error checking unit session:", error);
        setCurrentSession(null);
        setQrData("");
        localStorage.removeItem("currentSession");
      } finally {
        setLoading((prev) => ({ ...prev, session: false }));
        setLoadingSessionData(false);
      }
    };

    // Only check for session if unit is manually selected
    checkSelectedUnitSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnit, units]);

  useEffect(() => {
    if (!selectedUnit || currentSession?.ended) {
      setLoadingSessionData(false);
      if (!currentSession || currentSession.ended) {
        setCurrentSession(null);
        setQrData("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnit, currentSession?.ended]);

  const [tableContainerHeight, setTableContainerHeight] = useState(400); // Default height

  // Add this useEffect to set the initial height based on screen size
  useEffect(() => {
    if (screens.xs) {
      setTableContainerHeight(280); // Even smaller on xs screens
    } else if (screens.sm) {
      setTableContainerHeight(350);
    } else {
      setTableContainerHeight(400);
    }
  }, [screens]);

  // Update loading state changes to propagate to parent component
  useEffect(() => {
    const isAnyLoading = Object.values(loading).some(Boolean) || loadingSessionData;
    if (onLoadingChange) {
      onLoadingChange(isAnyLoading);
    }
  }, [loading, loadingSessionData, onLoadingChange]);

  // Modify the handleViewAttendance function for smoother updates
  const handleViewAttendance = useCallback(async (attempt = 0) => {
    if (!selectedUnit || !currentSession || currentSession.ended) return;

    let isMounted = true;

    try {
      setLoading((prev) => ({ ...prev, realTimeAttendance: true }));
      const response = await axios.get(
        `${API_URL}/attendance/realtime-lecturer/${currentSession._id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (isMounted) {
        const existingRecordsMap = new Map(attendance.map(item => [item._id, item]));
        const newOrUpdatedRecords = [];

        if (response.data?.length) {
          response.data.forEach(record => {
            const existingRecord = existingRecordsMap.get(record._id);
            if (!existingRecord || existingRecord.status !== record.status ||
              existingRecord.attendedAt !== record.attendedAt) {
              newOrUpdatedRecords.push(record._id);
            }
          });

          setAttendance(response.data.map(record => ({
            ...record,
            _isUpdated: newOrUpdatedRecords.includes(record._id)
          })));

          if (newOrUpdatedRecords.length > 0) {
            setTimeout(() => {
              if (isMounted) {
                setAttendance(prev => prev.map(record => ({
                  ...record,
                  _isUpdated: false
                })));
              }
            }, 2000);
          }
        }
      }
    } catch (error) {
      if (error.response?.status === 429 && attempt < 3) {
        // Retry with exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Rate limit hit on real-time attendance. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        await handleViewAttendance(attempt + 1); // Recursive call
      } else if (isMounted) {
        // Show appropriate error message based on the error type
        if (error.response?.status === 429) {
          message.error("Too many requests. Please wait a moment before trying again.");
        } else {
          message.error("Failed to refresh attendance data");
        }
      }
    } finally {
      if (isMounted) {
        setLoading((prev) => ({ ...prev, realTimeAttendance: false }));
      }
    }

    return () => {
      isMounted = false;
    };
  }, [selectedUnit, currentSession, attendance]);

  const fetchPastSessions = useCallback(async (attempt = 0) => {
    try {
      setLoading((prev) => ({ ...prev, pastAttendance: true }));
      const params = {
        unitId: pastFilters.unit,
        startDate: pastFilters.date
          ? new Date(pastFilters.date).toISOString().split("T")[0]
          : null,
        endDate: pastFilters.date
          ? new Date(new Date(pastFilters.date).getTime() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
          : null,
        sessionId: pastFilters.sessionId,
        year: pastFilters.year,
        semester: pastFilters.semester,
      };

      const response = await axios.get(
        `${API_URL}/attendance/past-lecturer`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params,
        }
      );

      const sessions = response.data.map((session) => ({
        ...session,
        unitName:
          session.unitName ||
          units.find((u) => u._id.toString() === session.unit.toString())?.name ||
          "Unknown Unit",
      }));
      setPastSessions(sessions);

      if (!pastFilters.sessionId && sessions.length > 0) {
        const sessionsForDate = sessions.filter(
          (session) =>
            moment(session.startTime).format("YYYY-MM-DD") === pastFilters.date
        );
        if (sessionsForDate.length > 0) {
          const latestSession = sessionsForDate.reduce((latest, current) =>
            new Date(current.endTime) > new Date(latest.endTime) ? current : latest
          );
          setPastFilters((prev) => ({ ...prev, sessionId: latestSession.sessionId }));
          setPastAttendance(latestSession.attendance);
        } else {
          setPastAttendance([]);
        }
      } else if (pastFilters.sessionId) {
        const session = sessions.find((s) => s.sessionId === pastFilters.sessionId);
        setPastAttendance(session ? session.attendance : []);
      } else {
        setPastAttendance([]);
      }
    } catch (error) {
      if (error.response?.status === 429 && attempt < 3) {
        // Retry with exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Rate limit hit on past sessions. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        await fetchPastSessions(attempt + 1); // Recursive call
      } else {
        console.error("Error fetching past sessions:", error);
        if (error.response?.status === 404) {
          message.info("No past sessions found for the selected criteria");
        } else if (error.response?.status === 401) {
          // Handle unauthorized error
          message.error("Your session has expired. Please login again.");
          localStorage.clear();
          window.location.href = '/auth/login';
        } else {
          message.error("Failed to fetch past sessions");
        }
      }
    } finally {
      setLoading((prev) => ({ ...prev, pastAttendance: false }));
    }
  }, [pastFilters, units]);

  useEffect(() => {
    if (lecturerId) fetchPastSessions();
  }, [lecturerId, pastFilters, fetchPastSessions]);

  const handleCreateSession = async () => {
    if (!selectedUnit) {
      message.error("Please select a unit first");
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, session: true }));
      setLoadingSessionData(true);

      // Create dates in UTC
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      if (!lecturerId) {
        throw new Error('Lecturer ID is missing');
      }

      console.log('Creating session with:', {
        unitId: selectedUnit,
        lecturerId,
        startTime: now,
        endTime: oneHourLater
      });

      const sessionData = await createSession({
        unitId: selectedUnit,
        lecturerId,
        startTime: now,
        endTime: oneHourLater
      });

      // Validate session data
      if (!sessionData || !sessionData.startTime || !sessionData.endTime) {
        throw new Error('Invalid session data received');
      }

      // Create complete session object
      const completeSessionData = {
        ...sessionData,
        unit: {
          name: units.find(u => u._id === selectedUnit)?.name || "Unknown Unit",
          _id: selectedUnit
        },
        startSession: new Date(sessionData.startTime),
        endSession: new Date(sessionData.endTime)
      };

      // Validate complete session data
      if (!completeSessionData.unit.name ||
        !completeSessionData.startSession ||
        !completeSessionData.endSession) {
        throw new Error('Invalid session data structure');
      }

      setCurrentSession(completeSessionData);
      setQrData(sessionData.qrCode);
      localStorage.setItem("currentSession", JSON.stringify(completeSessionData));
      message.success("Session created successfully");

      // Log successful creation
      console.log('Session created successfully:', completeSessionData);

    } catch (error) {
      console.error("Error creating session:", error);

      if (error.message.includes('Rate limit')) {
        message.error("Too many requests. Please wait a moment before trying again.");
      } else if (error.message.includes('Network error')) {
        message.error("Unable to create session due to network issues. Please check your connection.");
      } else if (error.message.includes('Authentication')) {
        message.error("Session expired. Please log in again.");
        setTimeout(() => window.location.href = '/auth/login', 2000);
      } else {
        message.error(error.message || "Failed to create session. Please try again.");
      }
    } finally {
      setLoading((prev) => ({ ...prev, session: false }));
      setLoadingSessionData(false);
    }
  };

  // Add these new functions and state for QR rotation
  const [qrRotationInterval, setQrRotationInterval] = useState(null);
  const [isQrRotating, setIsQrRotating] = useState(false); // New loading state
  const [qrExpiresAt, setQrExpiresAt] = useState(null); // Track expiration time
  const [qrTimeRemaining, setQrTimeRemaining] = useState(null); // Display countdown

  // Improved regenerateQrCode with better error handling
  const regenerateQrCode = async (sessionId, attempt = 0) => {
    if (!sessionId) return;

    try {
      setIsQrRotating(true);
      const token = localStorage.getItem("token");
      const response = await regenerateQR(sessionId, token);

      if (response && response.qrCode) {
        setQrData(response.qrCode);
        // Also store the expiration time from backend
        if (response.expiresAt) {
          setQrExpiresAt(new Date(response.expiresAt));
        } else {
          // Fallback: Set expiration to 3 minutes from now
          setQrExpiresAt(new Date(Date.now() + 175 * 1000));
        }
      }
      setIsQrRotating(false);
    } catch (error) {
      console.error("Error regenerating QR code:", error);
      // Implement retry logic
      if (attempt < 3) {
        console.log(`Retrying QR regeneration... (attempt ${attempt + 1})`);
        setTimeout(() => regenerateQrCode(sessionId, attempt + 1), 1000 * (attempt + 1));
      } else {
        message.error("Failed to refresh QR code. Please try again.");
        setIsQrRotating(false);
      }
    }
  };

  // Enhanced startQrRotation function with proper interval management
  const startQrRotation = async (sessionId) => {
    if (!sessionId) return;

    // Clear any existing rotation interval first
    if (qrRotationInterval) {
      clearInterval(qrRotationInterval);
    }

    // Generate the initial QR code
    await regenerateQrCode(sessionId);

    // Create a timer to update time remaining display
    const countdownInterval = setInterval(() => {
      if (qrExpiresAt) {
        const remainingMs = qrExpiresAt - Date.now();
        const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
        setQrTimeRemaining(remainingSec);

        // When less than 5 seconds remaining, prepare for refresh
        if (remainingSec <= 5 && !isQrRotating) {
          setIsQrRotating(true);
        }

        // When expired, regenerate QR
        if (remainingSec <= 0) {
          regenerateQrCode(sessionId);
        }
      }
    }, 1000);

    // Regenerate QR code more frequently (every 25 seconds)
    const rotationInterval = setInterval(() => {
      regenerateQrCode(sessionId);
    }, 25000);

    // Store the combined intervals to clear them later
    setQrRotationInterval({
      countdown: countdownInterval,
      rotation: rotationInterval
    });
  };

  // Update the cleanup for the rotation interval
  useEffect(() => {
    return () => {
      if (qrRotationInterval) {
        if (qrRotationInterval.countdown) clearInterval(qrRotationInterval.countdown);
        if (qrRotationInterval.rotation) clearInterval(qrRotationInterval.rotation);
      }
    };
  }, [qrRotationInterval]);

  // Modify the modal close handler to clean up the interval
  const handleModalClose = () => {
    if (qrRotationInterval) {
      if (qrRotationInterval.countdown) clearInterval(qrRotationInterval.countdown);
      if (qrRotationInterval.rotation) clearInterval(qrRotationInterval.rotation);
      setQrRotationInterval(null);
    }
    setIsQRModalOpen(false);
    setQrData("");
    setQrExpiresAt(null);
    setQrTimeRemaining(null);
  };

  const handleGenerateQR = async () => {
    if (!selectedUnit || !currentSession || currentSession.ended) {
      message.error("Please select a unit and ensure an active session exists");
      return;
    }
    try {
      setLoading((prev) => ({ ...prev, qr: true }));
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${API_URL}/sessions/current/${selectedUnit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data || !data.qrCode || data.ended) {
        throw new Error("QR code is missing, invalid, or session has ended!");
      }
      setQrData(data.qrCode);
      setIsQRModalOpen(true);

      // Start QR rotation when modal opens
      startQrRotation(currentSession._id);
    } catch {
      message.error("Failed to generate QR code");
    } finally {
      setLoading((prev) => ({ ...prev, qr: false }));
    }
  };

  const handleEndSession = async () => {
    if (!currentSession) {
      message.warning("No active session to end");
      return;
    }
    try {
      setLoading((prev) => ({ ...prev, session: true }));
      const token = localStorage.getItem("token");
      Modal.confirm({
        title: "End Current Session?",
        content: "This will stop the session and mark absent students.",
        okText: "End Session",
        okType: "danger",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            if (!currentSession?._id) throw new Error("Invalid session ID");
            const response = await axios.post(
              `${API_URL}/sessions/end`,
              { sessionId: currentSession._id },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.session.ended) {
              message.success("Session ended successfully");

              // Properly reset all session-related state
              setCurrentSession(null);
              setQrData("");
              setAttendance([]);
              localStorage.removeItem("currentSession");

              // Clear the selected unit to force UI refresh
              setSelectedUnit(null);

              // Refetch past sessions to update the list
              await fetchPastSessions();

              // Add a small delay before checking for other current sessions
              setTimeout(async () => {
                try {
                  // Check if there are any other active sessions
                  const verifyStatus = await axios.get(
                    `${API_URL}/sessions/status/${currentSession._id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );

                  // Only if session is verified as ended, check for other sessions
                  if (verifyStatus.data.ended) {
                    await checkCurrentSession();
                  }
                } catch (error) {
                  console.error("Error verifying session status:", error);
                }
              }, 500);
            }
          } catch (error) {
            console.error("Error ending session:", error);
            message.error("Failed to end session");
          } finally {
            setLoading((prev) => ({ ...prev, session: false }));
          }
        },
        onCancel: () => {
          // Reset the loading state when the user cancels
          setLoading((prev) => ({ ...prev, session: false }));
        }
      });
    } catch (error) {
      console.error("Error in handleEndSession:", error);
      message.error("An unexpected error occurred");
      setLoading((prev) => ({ ...prev, session: false }));
    }
  };

  const handleToggleStatus = (recordId) => {
    const record = attendance.find((r) => r._id === recordId);
    if (!record) return;
    const newStatus = record.status === "Present" ? "Absent" : "Present";
    Modal.confirm({
      title: `Change Status to ${newStatus}?`,
      content: `Are you sure you want to mark ${record.student.regNo} as ${newStatus}?`,
      okText: "Yes",
      okType: "primary",
      cancelText: "No",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `${API_URL}/attendance/${recordId}`,
            { status: newStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setAttendance((prev) =>
            prev.map((a) => (a._id === recordId ? { ...a, status: newStatus } : a))
          );
          message.success(`Marked ${record.student.regNo} as ${newStatus}`);
        } catch {
          message.error("Failed to update attendance status");
        }
      },
    });
  };

  const fetchAbsentStudents = async () => {
    if (!selectedUnit || !currentSession || currentSession.ended) return;
    try {
      setLoading((prev) => ({ ...prev, realTimeAttendance: true }));
      const unit = units.find((u) => u._id === selectedUnit);
      if (!unit) throw new Error("Unit not found");
      const enrolledStudents = unit.studentsEnrolled || [];
      const presentIds = new Set(attendance.map((a) => a.student._id.toString()));
      const absentStudents = enrolledStudents.filter(
        (id) => !presentIds.has(id.toString())
      );

      const response = await axios.get(
        `${API_URL}/attendance/realtime-lecturer/${currentSession._id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const allAttendance = response.data;
      const absentRecords = allAttendance.filter(
        (a) =>
          absentStudents.includes(a.student._id.toString()) || a.status === "Absent"
      );
      setAttendance(absentRecords);
      message.success("Showing absent students");
    } catch {
      message.error("Failed to fetch absent students");
    } finally {
      setLoading((prev) => ({ ...prev, realTimeAttendance: false }));
    }
  };

  const realTimeColumns = [
    {
      title: "Reg Number",
      dataIndex: ["student", "regNo"],
      key: "regNo",
      sorter: (a, b) => a.student.regNo.localeCompare(b.student.regNo),
      width: screens.xs ? 90 : undefined,
      render: (text) => <span style={{ color: themeColors.text }}>{text}</span>,
    },
    {
      title: "First Name",
      dataIndex: ["student", "firstName"],
      key: "firstName",
      sorter: (a, b) => a.student.firstName.localeCompare(b.student.firstName),
      width: screens.xs ? 70 : undefined,
      render: (text) => <span style={{ color: themeColors.text }}>{text}</span>,
    },
    {
      title: "Last Name",
      dataIndex: ["student", "lastName"],
      key: "lastName",
      sorter: (a, b) => a.student.lastName.localeCompare(b.student.lastName),
      width: screens.xs ? 70 : undefined,
      render: (text) => <span style={{ color: themeColors.text }}>{text}</span>,
    },
    {
      title: "Scan Time",
      dataIndex: "attendedAt",
      key: "attendedAt",
      render: (attendedAt) =>
        attendedAt ? (
          <Tag color={themeColors.secondary} style={{ borderRadius: "12px" }}>
            {new Date(attendedAt).toLocaleTimeString()}
          </Tag>
        ) : (
          <Tag color={`${themeColors.text}80`} style={{ borderRadius: "12px" }}>
            N/A
          </Tag>
        ),
      sorter: (a, b) => new Date(a.attendedAt || 0) - new Date(b.attendedAt || 0),
      width: screens.xs ? 80 : undefined,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={status === "Present" ? themeColors.secondary : themeColors.accent}
          style={{ borderRadius: "12px", color: "#fff" }}
        >
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: "Present", value: "Present" },
        { text: "Absent/Not Scanned", value: "Absent", onFilter: () => fetchAbsentStudents() },
      ],
      onFilter: (value, record) =>
        value === "Present" ? record.status === "Present" : false,
      width: screens.xs ? 70 : undefined,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => handleToggleStatus(record._id)}
          icon={<SyncOutlined />}
          disabled={currentSession?.ended}
          style={{ color: themeColors.primary, padding: 0 }}
        >
          {screens.xs ? "" : "Toggle Status"}
        </Button>
      ),
      width: screens.xs ? 50 : undefined,
    },
  ];

  const pastColumns = [
    {
      title: "Reg Number",
      dataIndex: ["student", "regNo"],
      key: "regNo",
      sorter: (a, b) => a.student.regNo.localeCompare(b.student.regNo),
      width: screens.xs ? 90 : undefined,
      render: (text) => <span style={{ color: themeColors.text }}>{text}</span>,
    },
    {
      title: "First Name",
      dataIndex: ["student", "firstName"],
      key: "firstName",
      sorter: (a, b) => a.student.firstName.localeCompare(b.student.firstName),
      width: screens.xs ? 70 : undefined,
      render: (text) => <span style={{ color: themeColors.text }}>{text}</span>,
    },
    {
      title: "Last Name",
      dataIndex: ["student", "lastName"],
      key: "lastName",
      sorter: (a, b) => a.student.lastName.localeCompare(b.student.lastName),
      width: screens.xs ? 70 : undefined,
      render: (text) => <span style={{ color: themeColors.text }}>{text}</span>,
    },
    {
      title: "Scan Time",
      dataIndex: "attendedAt",
      key: "attendedAt",
      render: (attendedAt) =>
        attendedAt ? (
          <Tag color={themeColors.secondary} style={{ borderRadius: "12px" }}>
            {new Date(attendedAt).toLocaleTimeString()}
          </Tag>
        ) : (
          <Tag color={`${themeColors.text}80`} style={{ borderRadius: "12px" }}>
            N/A
          </Tag>
        ),
      sorter: (a, b) => new Date(a.attendedAt || 0) - new Date(b.attendedAt || 0),
      width: screens.xs ? 80 : undefined,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={status === "Present" ? themeColors.secondary : themeColors.accent}
          style={{ borderRadius: "12px", color: "#fff" }}
        >
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: "Present", value: "Present" },
        { text: "Absent", value: "Absent" },
      ],
      onFilter: (value, record) => record.status === value,
      width: screens.xs ? 70 : undefined,
    },
  ];

  const totalAssignedUnits = useMemo(() => units.length, [units]);
  const enrolledStudents = useMemo(() => {
    if (!selectedUnit) return 0;
    const unit = units.find((u) => u._id === selectedUnit);
    return unit?.studentsEnrolled?.length || 0;
  }, [units, selectedUnit]);
  const totalScans = useMemo(() => attendance.length, [attendance]);
  const attendanceRate = useMemo(() => {
    const presentCount = attendance.filter((a) => a.status === "Present").length;
    return enrolledStudents > 0
      ? Number(((presentCount / enrolledStudents) * 100).toFixed(1))
      : 0;
  }, [attendance, enrolledStudents]);

  const summaryCards = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <StatCard
        title="Assigned Units"
        value={totalAssignedUnits}
        loading={loading.units}
        subtitle="Assigned modules"
      />
      <StatCard
        title="Attendance Rate"
        value={`${attendanceRate}%`}
        loading={loading.realTimeAttendance}
        subtitle="Active attendance"
      />
      <StatCard
        title="Total Scans"
        value={totalScans}
        loading={loading.realTimeAttendance}
        subtitle="Verified check-ins"
      />
      <StatCard
        title="Total Enrolled"
        value={enrolledStudents}
        loading={loading.units}
        subtitle="Enrolled students"
      />
    </div>
  );

  useEffect(() => {
    if (currentSession) {
      localStorage.setItem("currentSession", JSON.stringify(currentSession));
    } else {
      localStorage.removeItem("currentSession");
    }
  }, [currentSession]);

  const formatSessionTime = (session) => {
    if (!session || !session.startTime || !session.endTime) {
      return "No session time available";
    }
    try {
      const startTime = new Date(session.startTime);
      const endTime = new Date(session.endTime);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.error("Invalid date values:", { startTime: session.startTime, endTime: session.endTime });
        return "Invalid session time";
      }

      const options = {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Use local timezone
      };

      return `${startTime.toLocaleTimeString([], options)} - ${endTime.toLocaleTimeString([], options)}`;
    } catch (error) {
      console.error("Error formatting session time:", error);
      return "Error formatting time";
    }
  };

  const clearFilters = () => {
    setUnitFilters({ department: null, year: null, semester: null });
    setPastFilters({
      unit: null,
      date: moment().format("YYYY-MM-DD"),
      sessionId: null,
      year: null,
      semester: null,
    });
  };

  const SessionTimer = ({ end }) => {
    const [timeLeft, setTimeLeft] = useState(() => {
      const endTime = new Date(end);
      return isNaN(endTime.getTime()) ? 0 : Math.max(0, endTime.getTime() - Date.now());
    });

    useEffect(() => {
      const endTime = new Date(end);
      if (isNaN(endTime.getTime())) {
        console.error("Invalid end time provided to SessionTimer:", end);
        setTimeLeft(0);
        return;
      }

      const timer = setInterval(() => {
        const remaining = Math.max(0, endTime.getTime() - Date.now());
        setTimeLeft(remaining);
      }, 1000);

      return () => clearInterval(timer);
    }, [end]);

    const formatTime = (ms) => {
      if (isNaN(ms) || ms < 0) return "0m 0s";
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    };

    return (
      <div style={{ marginTop: screens.xs ? 4 : 8 }}>
        <Tag icon={<ClockCircleOutlined />} color={themeColors.primary}>
          Time Remaining: {formatTime(timeLeft)}
        </Tag>
      </div>
    );
  };

  SessionTimer.propTypes = {
    end: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]).isRequired,
  };

  const tableStyles = useTableStyles();
  const modalStyles = useModalStyles();

  // Add this function to generate row class based on updated status
  const getRowClassName = (record, index) => {
    let classes = index % 2 === 0 ? 'table-row-light' : 'table-row-dark';
    if (record._isUpdated) {
      classes += ' highlight-new-row';
    }
    return classes;
  };

  const handleDownloadReport = async (unit) => {
    try {
      if (!unit) {
        message.error('Please select a unit first');
        return;
      }
      setLoading((prev) => ({ ...prev, stats: true }));

      const token = localStorage.getItem('token');

      // Use the correct endpoint path for unit export
      const response = await axios({
        url: `${API_URL}/attendance/export/unit/${unit}`,
        method: 'GET',
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });

      // ...existing code with blob handling...
      const contentType = response.headers['content-type'];
      let fileExtension = 'csv'; // Default extension
      let fileType = 'text/csv'; // Default type

      // Allow Excel format if available
      if (contentType && (contentType.includes('excel') ||
        contentType.includes('spreadsheetml'))) {
        fileExtension = 'xlsx';
        fileType = contentType;
      }

      // Create a blob from the response with proper MIME type
      const blob = new Blob([response.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get unit name and details for a more informative filename
      const unitObj = units.find(u => u._id === unit);
      const unitName = unitObj?.name || 'unknown';
      const unitCode = unitObj?.code || '';
      const date = new Date().toISOString().split('T')[0];

      // Create a more informative filename
      const fileName = `attendance_${unitName.replace(/\s+/g, '_')}_${unitCode}_${date}.${fileExtension}`;
      link.setAttribute('download', fileName);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success(`Attendance report downloaded successfully as ${fileExtension.toUpperCase()}`);
    } catch (error) {
      console.error('Download error:', error);

      // Provide better error handling based on status codes
      if (error.response?.status === 404) {
        message.error('Export feature is not available. The server endpoint was not found.');
      } else if (error.response?.status === 401) {
        message.error('Your session has expired. Please log in again.');
      } else {
        message.error('Failed to download report. Please try again later.');
      }
    } finally {
      setLoading((prev) => ({ ...prev, stats: false })); // Fixed from true to false
    }
  };

  // Add state for date range modal
  const [isDateRangeModalVisible, setIsDateRangeModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState([moment().subtract(30, 'days'), moment()]);
  const [reportUnitId, setReportUnitId] = useState(null); // New state for unit selection in report

  const handleDownloadFullReport = async () => {
    setReportUnitId(selectedUnit); // Initialize with currently selected unit
    setIsDateRangeModalVisible(true);
  };

  const handleDateRangeOk = async () => {
    try {
      setIsDateRangeModalVisible(false);
      setLoading((prev) => ({ ...prev, stats: true }));

      // Format the dates for the API request
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const token = localStorage.getItem('token');

      try {
        const response = await axios({
          url: `${API_URL}/attendance/export-all-sessions`,
          method: 'GET',
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // Explicitly request Excel format
          },
          params: { startDate, endDate, unitId: reportUnitId } // Use reportUnitId instead of selectedUnit
        });

        // Check content type to determine if it's a normal response or an error
        const contentType = response.headers['content-type'];

        // If it's JSON, it's likely an error message
        if (contentType && contentType.includes('application/json')) {
          try {
            // Convert blob to text to parse JSON
            const errorText = await new Response(response.data).text();
            const errorData = JSON.parse(errorText);

            if (errorData && errorData.code === 'NO_DATA_FOUND') {
              message.warning(errorData.message || 'No data found for the selected date range');
              return;
            } else {
              message.error(errorData.message || 'Error generating report');
              return;
            }
          } catch (e) {
            console.log('Failed to parse error message', e);
          }
        }

        // Check if the response is too small to be a valid file
        if (response.data.size < 100) {
          message.warning("No data found for the selected date range. Please try a different range.");
          return;
        }

        // Determine file extension based on content type
        let fileExtension = 'xlsx';
        let fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (contentType) {
          fileType = contentType;
          if (contentType.includes('csv')) {
            fileExtension = 'csv';
          }
        }

        // Create a blob with the correct MIME type
        const blob = new Blob([response.data], { type: fileType });

        // Use the official File API for better compatibility
        const file = new File([blob], `attendance_report_${startDate}_to_${endDate}.${fileExtension}`, {
          type: fileType
        });

        // Create download URL and link
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 1000);

        message.success(`Attendance report downloaded successfully`);
      } catch (error) {
        if (error.response) {
          if (error.response.status === 404) {
            message.warning('No data found for the selected date range. Please try a different range.');
          } else if (error.response.status === 401) {
            message.error('Your session has expired. Please log in again.');
            // Optionally redirect to login page
          } else {
            message.error(`Failed to download report: ${error.response.data?.message || 'Unknown error'}`);
          }
        } else if (error.request) {
          message.error('Network error. Please check your connection and try again.');
        } else {
          message.error(`Error: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download report. Please try again later.');
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }));
    }
  };

  const handleDateRangeCancel = () => {
    setIsDateRangeModalVisible(false);
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageHeader
        title="Lecturer Dashboard"
        subtitle="Manage active class sessions, live QR code check-ins, and student attendance records."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              placeholder="Select Unit"
              style={{ width: screens.xs ? "100%" : 260 }}
              onChange={setSelectedUnit}
              value={selectedUnit}
              loading={loading.units}
              dropdownMatchSelectWidth={false}
            >
              {units.map((unit) => (
                <Option key={unit._id} value={unit._id}>
                  {unit.name} ({unit.code})
                </Option>
              ))}
            </Select>
            <button
              type="button"
              onClick={handleGenerateQR}
              disabled={!selectedUnit || !currentSession || currentSession?.ended}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <QrcodeOutlined />
              {loading.qr ? "Generating..." : "Generate QR Code"}
            </button>
            <button
              type="button"
              onClick={handleCreateSession}
              disabled={loading.session || (currentSession && !currentSession.ended)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CalendarOutlined />
              {loading.session ? "Creating..." : "Create Session"}
            </button>
          </div>
        }
      />

      {/* Session Status Banner */}
      {loadingSessionData ? (
        <div className="p-4 bg-white border border-slate-200 rounded-lg animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
        </div>
      ) : currentSession && !currentSession.ended ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950">
          <div>
            <div className="flex items-center gap-2 font-medium text-emerald-900">
              <ClockCircleOutlined className="text-emerald-600" />
              <span>Active Session: {currentSession.unit?.name || "Selected Unit"}</span>
            </div>
            <div className="text-xs text-emerald-700 mt-1 flex items-center gap-3">
              <span>Time: {formatSessionTime(currentSession)}</span>
              <SessionTimer end={currentSession.endSession} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.open(`/lecturer/session/${currentSession._id}`, '_blank')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            >
              <QrcodeOutlined />
              Projector Mode
            </button>
            <button
              type="button"
              onClick={handleEndSession}
              disabled={loading.session}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
            >
              {loading.session ? "Ending..." : "End Session Early"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <ClockCircleOutlined className="text-slate-400" />
            <span>
              {selectedUnit
                ? `No active session found for ${units.find((u) => u._id === selectedUnit)?.name || "selected unit"}.`
                : "No active session. Select a unit from the top header to begin."}
            </span>
          </div>
          {selectedUnit && (
            <button
              type="button"
              onClick={handleCreateSession}
              disabled={loading.session}
              className="text-xs font-medium text-slate-900 hover:text-slate-700 underline text-left sm:text-right"
            >
              Start session now
            </button>
          )}
        </div>
      )}

      {/* Metric Cards */}
      {summaryCards}

      {/* Real-time Attendance Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Real-time Unit Attendance</h2>
            <p className="text-xs text-slate-500">Live student check-ins for the active unit</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!Object.values(unitFilters).some(Boolean)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-40"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={handleViewAttendance}
              disabled={!selectedUnit || !currentSession || currentSession?.ended}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors"
            >
              <SyncOutlined spin={loading.realTimeAttendance} />
              {loading.realTimeAttendance ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
        <div className="w-full overflow-x-auto p-4">
          {loading.realTimeAttendance && !attendance.length ? (
            <Skeleton active />
          ) : (
            <Table
              columns={realTimeColumns}
              dataSource={attendance}
              rowKey="_id"
              scroll={{ x: 700 }}
              pagination={{
                pageSize: screens.xs ? 5 : 8,
                responsive: true,
                showSizeChanger: false,
                showTotal: (total) => `Total ${total} students`,
                size: screens.xs ? "small" : "default",
                simple: screens.xs,
              }}
              locale={{ emptyText: "No active session attendance records found" }}
              bordered
              size={screens.xs ? "small" : "middle"}
              rowClassName={getRowClassName}
            />
          )}
        </div>
      </div>

      {/* Past Sessions Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Attendance Records for Past Sessions</h2>
            <p className="text-xs text-slate-500">Historical records and reporting</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadReport(selectedUnit)}
              disabled={!selectedUnit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors"
            >
              <DownloadOutlined />
              {loading.stats ? "Exporting..." : "Download Session Report"}
            </button>
            <button
              type="button"
              onClick={handleDownloadFullReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition-colors"
            >
              <DownloadOutlined />
              Download Full Report
            </button>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              placeholder="Select Unit"
              style={{ width: screens.xs ? "100%" : 240 }}
              onChange={(value) =>
                setPastFilters((prev) => ({ ...prev, unit: value, sessionId: null }))
              }
              allowClear
              value={pastFilters.unit}
              className="themed-select"
            >
              {units.map((unit) => (
                <Option key={unit._id} value={unit._id}>
                  {unit.name}
                </Option>
              ))}
            </Select>
            <DatePicker
              defaultValue={moment()}
              placeholder="Select Date"
              style={{ width: screens.xs ? "100%" : 150 }}
              onChange={(_, dateString) =>
                setPastFilters((prev) => ({
                  ...prev,
                  date: dateString,
                  sessionId: null,
                }))
              }
              allowClear
              className="themed-datepicker"
            />
            <Select
              placeholder="Select Session"
              style={{ width: screens.xs ? "100%" : 300 }}
              onChange={(value) =>
                setPastFilters((prev) => ({ ...prev, sessionId: value }))
              }
              allowClear
              value={pastFilters.sessionId}
              className="themed-select"
            >
              {pastSessions
                .filter(
                  (session) =>
                    moment(session.startTime).format("YYYY-MM-DD") ===
                    pastFilters.date
                )
                .map((session) => (
                  <Option key={session.sessionId} value={session.sessionId}>
                    {`${session.unitName} - ${moment(session.startTime).format(
                      "hh:mm A"
                    )} - ${moment(session.endTime).format("hh:mm A")} (${moment(
                      session.startTime
                    ).format("DD/MM/YYYY")})`}
                  </Option>
                ))}
            </Select>
          </div>
          <div className="w-full overflow-x-auto">
            <Skeleton active loading={loading.pastAttendance}>
              <Table
                columns={pastColumns}
                dataSource={pastAttendance}
                rowKey="_id"
                scroll={{ x: 700 }}
                pagination={{
                  pageSize: screens.xs ? 5 : 8,
                  responsive: true,
                  showSizeChanger: false,
                  showTotal: (total) => `Total ${total} students`,
                }}
                locale={{ emptyText: "No past attendance records found" }}
                bordered
                size={screens.xs ? "small" : "middle"}
                rowClassName={(record, index) =>
                  index % 2 === 0 ? "table-row-light" : "table-row-dark"
                }
              />
            </Skeleton>
          </div>
        </div>
      </div>

      <Modal
        title={
          <div style={modalStyles.modalTitle}>
            <QrcodeOutlined style={{ marginRight: 8 }} />
            Class QR Code
          </div>
        }
        open={isQRModalOpen}
        centered
        onCancel={handleModalClose}
        footer={[
          <Button
            key="close"
            onClick={handleModalClose}
            style={{
              color: themeColors.primary,
              borderColor: themeColors.primary,
              width: screens.xs ? "100%" : "auto",
              borderRadius: 8,
              transition: "all 0.3s ease",
            }}
          >
            Close
          </Button>,
        ]}
        destroyOnClose
        maskClosable={false}
        width={screens.xs ? "95%" : 520} // Use percentage width on mobile
        styles={{
          header: modalStyles.modalHeader,
          body: modalStyles.modalBody,
          footer: modalStyles.modalFooter,
          content: {
            ...modalStyles.modalContainer,
            margin: screens.xs ? '0 auto' : undefined, // Center on mobile
            maxWidth: '100%', // Ensure doesn't overflow
          }
        }}
      >
        <div style={{ textAlign: "center", padding: screens.xs ? 8 : 24 }}>
          {qrData ? (
            <>
              <div style={{ position: 'relative' }}>
                <img
                  src={qrData}
                  alt="Attendance QR Code"
                  style={{
                    width: "100%",
                    maxWidth: screens.xs ? 200 : 300,
                    margin: "0 auto",
                    display: "block",
                    borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    opacity: isQrRotating ? 0.7 : 1,
                    transition: "opacity 0.3s ease"
                  }}
                />
                {isQrRotating && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}>
                    <Spin size="large" />
                  </div>
                )}
              </div>
              {currentSession && !currentSession.ended && (
                <>
                  <SessionTimer end={currentSession.endSession} />
                  <div style={{ marginTop: 8 }}>
                    <Tag color={themeColors.primary} icon={<SyncOutlined spin={isQrRotating} />}>
                      {isQrRotating ? "Refreshing QR Code..." : "QR Code refreshes automatically"}
                    </Tag>
                  </div>
                </>
              )}
              <Typography.Text
                type="secondary"
                style={{ marginTop: 8, display: "block", fontSize: screens.xs ? 12 : 16, color: themeColors.text }}
              >
                Scan this QR code to mark attendance
              </Typography.Text>
              {qrTimeRemaining !== null && (
                <p style={{
                  color: qrTimeRemaining < 30 ? (qrTimeRemaining < 10 ? 'red' : 'orange') : 'green',
                  fontWeight: 'bold'
                }}>
                  QR Code refreshes in: {Math.floor(qrTimeRemaining / 60)}:{String(qrTimeRemaining % 60).padStart(2, '0')}
                </p>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: screens.xs ? 8 : 24 }}>
              <Typography.Text type="danger" style={{ color: themeColors.accent }}>
                Failed to generate QR Code
              </Typography.Text>
              <Skeleton.Image
                style={{ width: screens.xs ? 200 : 300, height: screens.xs ? 200 : 300 }}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Date Range Modal for Full Report */}
      <Modal
        title="Select Date Range for Report"
        open={isDateRangeModalVisible}
        onOk={handleDateRangeOk}
        onCancel={handleDateRangeCancel}
        centered
        okText="Download Report"
        okButtonProps={{
          style: { background: themeColors.primary, borderColor: themeColors.primary },
          loading: loading.stats
        }}
        styles={{
          header: modalStyles.modalHeader,
          body: { ...modalStyles.modalBody, padding: '20px' },
          footer: modalStyles.modalFooter,
          content: modalStyles.modalContainer
        }}
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ marginBottom: '15px', color: themeColors.text }}>
            Please select a date range and unit for the attendance report:
          </p>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              allowClear={false}
              className="themed-datepicker"
            />
            <Select
              placeholder="Select Unit (Optional - All units if empty)"
              style={{ width: '100%' }}
              onChange={(value) => setReportUnitId(value)}
              value={reportUnitId}
              allowClear
              className="themed-select"
            >
              {units.map((unit) => (
                <Option key={unit._id} value={unit._id}>
                  <Space>
                    <BookOutlined style={{ color: themeColors.primary }} />
                    {unit.name}
                    <Tag color={themeColors.secondary}>{unit.code}</Tag>
                  </Space>
                </Option>
              ))}
            </Select>
            <Text type="secondary" style={{ fontSize: '12px', color: themeColors.textSecondary }}>
              Leave unit selection empty to generate a report for all your units
            </Text>
          </Space>
        </div>
      </Modal>

      <style>{`
        .ant-card.ant-card-hoverable:not(.summary-card):hover {
          transform: none !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important;
        }

        .summary-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        .table-row-light {
          background: ${themeColors.cardBg};
        }
        .table-row-dark {
          background: ${themeColors.background};
        }

        ${tableStyles}
        ${modalStyles.styles}

        .ant-btn-primary {
          background: ${themeColors.primary} !important;
          border-color: ${themeColors.primary} !important;
          color: ${isDarkMode ? themeColors.text : "#fff"} !important;
        }
        .ant-btn-primary:hover, .ant-btn-primary:focus {
          background: ${themeColors.focus} !important;
          border-color: ${themeColors.focus} !important;
          color: ${isDarkMode ? themeColors.text : "#fff"} !important;
        }
        .ant-btn-danger {
          background: ${themeColors.accent} !important;
          border-color: ${themeColors.accent} !important;
          color: ${isDarkMode ? themeColors.text : "#fff"} !important;
        }
        .ant-btn-danger:hover, .ant-btn-danger:focus {
          background: ${themeColors.accent}CC !important;
          border-color: ${themeColors.accent}CC !important;
          color: ${isDarkMode ? themeColors.text : "#fff"} !important;
        }
        .ant-btn[disabled], .ant-btn[disabled]:hover {
          background: ${themeColors.disabled} !important;
          border-color: ${themeColors.disabled} !important;
          color: ${themeColors.text}80 !important;
        }
        .ant-select-selector, .ant-picker {
          background: ${themeColors.inputBg} !important;
          border-color: ${themeColors.inputBorder} !important;
          color: ${themeColors.text} !important;
          border-radius: 8px;
        }
        .ant-select-selector:hover, .ant-select-selector:focus,
        .ant-picker:hover, .ant-picker-focused {
          background: ${themeColors.inputHover} !important;
          border-color: ${themeColors.primary} !important;
        }
        .ant-select-dropdown, .ant-picker-panel-container {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
          border-radius: 8px;
        }
        .ant-select-item-option-content {
          color: ${themeColors.text} !important;
        }
        .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
          background: ${themeColors.hover} !important;
        }
        .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner {
          background: ${themeColors.primary} !important;
        }
        .ant-modal-content, .ant-modal-body {
          background: ${themeColors.modalBg} !important;
          color: ${themeColors.text} !important;
          border-radius: 16px;
        }
        .ant-modal-header {
          background: ${themeColors.modalBg} !important;
          border-bottom: 1px solid ${themeColors.border} !important;
          border-radius: 16px 16px 0 0;
        }
        .ant-modal-title {
          color: ${themeColors.text} !important;
        }

        .attendance-table-container {
          transition: none !important;
          min-height: ${tableContainerHeight}px;
        }

        .attendance-table-container .ant-table-wrapper,
        .attendance-table-container .ant-spin-nested-loading,
        .attendance-table-container .ant-spin-container,
        .attendance-table-container .ant-table {
          transition: none !important;
        }

        .attendance-table-container .ant-table-body {
          transition: none !important;
          overflow-y: auto !important;
        }

        @keyframes highlight-fade {
          0% {
            background-color: ${themeColors.primary}30;
          }
          100% {
            background-color: transparent;
          }
        }

        .highlight-new-row {
          animation: highlight-fade 2s ease-out;
        }

        /* Optimize table rendering */
        .attendance-table-container .ant-table-container {
          will-change: transform;
          transform: translateZ(0);
        }

        /* Prevent header jittering on updates */
        .attendance-table-container .ant-table-header {
          position: sticky;
          top: 0;
          z-index: 2;
          background: ${themeColors.tableHeaderBg || themeColors.cardBg};
        }
        
        .attendance-table-container .ant-table-thead > tr > th {
          background: ${themeColors.tableHeaderBg || themeColors.cardBg} !important;
          color: ${themeColors.tableHeaderText || themeColors.text} !important;
          font-weight: 600;
        }

        /* Hardware acceleration for smoother animations */
        .table-row-light, .table-row-dark, .highlight-new-row {
          transform: translateZ(0);
          will-change: background-color;
          transition: background-color 0.3s ease;
        }

        .ant-select-selection-placeholder,
        .ant-picker-input > input::placeholder {
          color: ${themeColors.placeholder || themeColors.textSecondary} !important;
          opacity: 0.8;
        }

        /* Calendar icon in date picker */
        .ant-picker-suffix .anticon-calendar,
        .ant-picker-suffix .anticon-clock-circle {
          color: ${themeColors.primary} !important;
          opacity: 0.8;
        }

        /* Clear icon in date picker and select */
        .ant-picker-clear,
        .ant-select-clear {
          background: ${themeColors.inputBg} !important;
          color: ${themeColors.textSecondary} !important;
        }

        /* Arrow in select dropdown */
        .ant-select-arrow {
          color: ${themeColors.primary} !important;
          opacity: 0.8;
        }

        /* Input color for date picker */
        .ant-picker-input > input {
          color: ${themeColors.text} !important;
        }

        /* Focus states */
        .themed-select .ant-select-selector:focus,
        .themed-datepicker:focus {
          border-color: ${themeColors.primary} !important;
          box-shadow: 0 0 0 2px ${themeColors.primary}33 !important;
        }

        /* Selection background for options */
        .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
          background: ${themeColors.hover} !important;
          font-weight: 600;
        }

        /* Dropdown styling */
        .ant-select-dropdown {
          background: ${themeColors.cardBg} !important;
          box-shadow: 0 3px 6px rgba(0,0,0,0.15) !important;
          border: 1px solid ${themeColors.border} !important;
        }

        .ant-select-dropdown .ant-select-item {
          color: ${themeColors.text} !important;
        }

        /* Additional responsive styles */
        @media (max-width: 575px) {
          .ant-card-head-title {
            font-size: 14px !important;
            padding: 8px 0 !important;
          }
          
          .ant-card-head {
            min-height: 40px !important;
            padding: 0 12px !important;
          }
          
          .ant-card-body {
            padding: 12px !important;
          }
          
          .ant-table-thead > tr > th {
            padding: 8px 4px !important;
            font-size: 12px !important;
          }
          
          .ant-table-tbody > tr > td {
            padding: 8px 4px !important;
            font-size: 12px !important;
          }
          
          .ant-tag {
            margin: 0 !important;
            font-size: 10px !important;
            padding: 0 4px !important;
          }
          
          .ant-btn {
            font-size: 12px !important;
            height: 32px !important;
            padding: 0 8px !important;
          }
          
          .ant-statistic-title {
            font-size: 10px !important;
            margin-bottom: 0 !important;
          }
          
          .ant-statistic-content {
            font-size: 14px !important;
          }
        }
        
        /* Ensure modal fits on small screens */
        @media (max-width: 380px) {
          .ant-modal {
            max-width: 95vw !important;
            margin: 0 auto !important;
          }
          
          .ant-modal-content {
            padding: 12px !important;
          }
          
          .ant-modal-body {
            padding: 8px !important;
          }
          
          .ant-modal-footer {
            padding: 8px !important;
          }
        }
        
        /* Fix horizontal scrolling issues */
        .attendance-table-container .ant-table {
          width: 100% !important;
          overflow-x: auto !important;
        }
        
        /* Ensure button text wrapping on very small screens */
        .ant-btn {
          white-space: normal !important;
          height: auto !important;
          min-height: 32px !important;
        }

        /* Additional responsive styles for summary cards */
        @media (max-width: 359px) {
          .ant-statistic-title {
            font-size: 9px !important;
            margin-bottom: 0 !important;
          }
          
          .ant-statistic-content {
            font-size: 11px !important;
            line-height: 1 !important;
          }
          
          .ant-statistic-content-value {
            font-size: 11px !important;
          }
          
          .ant-statistic-content-prefix,
          .ant-statistic-content-suffix {
            font-size: 10px !important;
          }

          .ant-card-body {
            padding: 6px 4px !important;
          }
        }

        /* Ensure consistent height for summary cards */
        .ant-row .ant-col .ant-card {
          height: 100%;
        }

        /* Fix spacing inside statistic components */
        .ant-statistic-title {
          margin-bottom: 4px !important;
        }

        /* Fix alignment on super small devices */
        @media (max-width: 320px) {
          .ant-row {
            margin-left: -4px !important;
            margin-right: -4px !important;
          }
          .ant-col {
            padding-left: 4px !important;
            padding-right: 4px !important;
          }
        }

        /* Fix vertical margins in cards */
        .ant-card {
          margin-bottom: 16px !important;
        }
        
        .ant-card:first-child {
          margin-top: 0 !important;
        }
        
        /* Fix for body padding in cards */
        .ant-card-body {
          padding: ${screens.xs ? '12px 8px' : '16px'} !important;
        }
        
        /* Properly align with parent container */
        @media (max-width: 767px) {
          .ant-layout-content {
            padding: 0 !important;
            margin-left: 0 !important;
            margin-top: 64px !important;
          }
        }
      `}</style>
    </div>
  );
};

AttendanceManagement.propTypes = {
  onLoadingChange: PropTypes.func,
};

export default AttendanceManagement;