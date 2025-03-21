import { useState, useEffect, useCallback, useMemo, useContext, useRef } from "react";
import {
  Button,
  Table,
  Modal,
  Select,
  Space,
  Card,
  Tag,
  Skeleton,
  message,
  Grid,
  Typography,
  Statistic,
  Row,
  Col,
  DatePicker,
} from "antd";
import {
  QrcodeOutlined,
  DownloadOutlined,
  CalendarOutlined,
  BookOutlined,
  TeamOutlined,
  PercentageOutlined,
  ScheduleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  UserOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  ScanOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import axios from "axios";
import {
  getLecturerUnits,
  getDepartments,
  detectCurrentSession,
  createSession,
} from "../services/api";
import moment from "moment";
import { ThemeContext } from "../context/ThemeContext";
import { useTableStyles } from './SharedTableStyles';
import { useModalStyles } from './SharedModalStyles';

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

  const cardStyle = {
    borderRadius: screens.xs ? "12px" : "16px",
    boxShadow: isDarkMode
      ? "0 4px 15px rgba(0, 0, 0, 0.2)"
      : "0 4px 15px rgba(0, 0, 0, 0.05)",
    background: themeColors.cardBg,
    border: `1px solid ${themeColors.border}`,
    overflow: "hidden",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    width: "100%",
    margin: 0,
    padding: screens.xs ? "8px" : undefined,
  };

  const summaryCardGradients = {
    assignedUnits: themeColors.cardGradient1,
    attendanceRate: themeColors.cardGradient2,
    totalScans: themeColors.cardGradient3,
    totalEnrolled: themeColors.cardGradient4,
  };

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
      const session = JSON.parse(localStorage.getItem("currentSession"));
      if (session && new Date(session.endSession) < new Date()) {
        setCurrentSession(null);
        setQrData("");
        localStorage.removeItem("currentSession");
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
          `https://attendance-system-w70n.onrender.com/api/sessions/current/${selectedUnit}`,
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
  }, [selectedUnit, units]); // Remove dependencies that cause unnecessary reruns

  useEffect(() => {
    if (!selectedUnit || currentSession?.ended) {
      setLoadingSessionData(false);
      if (!currentSession || currentSession.ended) {
        setCurrentSession(null);
        setQrData("");
      }
    }
  }, [selectedUnit, currentSession?.ended]);

  const [tableContainerHeight, setTableContainerHeight] = useState(400); // Default height
  const tableContainerRef = useRef(null);

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
        `https://attendance-system-w70n.onrender.com/api/attendance/realtime-lecturer/${currentSession._id}`,
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
        `https://attendance-system-w70n.onrender.com/api/attendance/past-lecturer`,
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
          message.error("Session expired. Please log in again");
          // Optionally redirect to login
          window.location.href = '/auth/login';
        } else if (error.code === 'ECONNABORTED') {
          message.error("Request timed out. Please try again");
        } else if (!navigator.onLine) {
          message.error("No internet connection. Please check your network");
        } else {
          message.error("Unable to load past sessions. Please try again later");
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

  const handleGenerateQR = async () => {
    if (!selectedUnit || !currentSession || currentSession.ended) {
      message.error("Please select a unit and ensure an active session exists");
      return;
    }
    try {
      setLoading((prev) => ({ ...prev, qr: true }));
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `https://attendance-system-w70n.onrender.com/api/sessions/current/${selectedUnit}`,
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

  // Add these new functions and state for QR rotation
  const [qrRotationInterval, setQrRotationInterval] = useState(null);
  const [isQrRotating, setIsQrRotating] = useState(false); // New loading state

  const regenerateQrCode = async (sessionId, attempt = 0) => {
    if (!isQRModalOpen) return;

    try {
      setIsQrRotating(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `https://attendance-system-w70n.onrender.com/api/sessions/regenerate-qr`,
        { sessionId, autoRotate: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response?.data?.qrCode) {
        setQrData(response.data.qrCode);
        // Start the next rotation slightly before expiration (170 seconds)
        const nextRotation = 170000; // 170 seconds - rotate before 3-minute expiration
        if (qrRotationInterval) {
          clearInterval(qrRotationInterval);
        }
        const newInterval = setInterval(async () => {
          if (isQRModalOpen && !isQrRotating) {
            await regenerateQrCode(sessionId);
          }
        }, nextRotation);
        setQrRotationInterval(newInterval);
      }
    } catch (error) {
      console.error("Error refreshing QR code:", error);
      if (error.response?.status === 429 && attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        await regenerateQrCode(sessionId, attempt + 1);
      }
    } finally {
      setIsQrRotating(false);
    }
  };

  const startQrRotation = async (sessionId) => {
    if (qrRotationInterval) {
      clearInterval(qrRotationInterval);
    }
    // Initial QR generation
    await regenerateQrCode(sessionId);
  };

  // Add cleanup for the rotation interval
  useEffect(() => {
    return () => {
      if (qrRotationInterval) {
        clearInterval(qrRotationInterval);
      }
    };
  }, [qrRotationInterval]);

  // Modify the modal close handler to clean up the interval
  const handleModalClose = () => {
    if (qrRotationInterval) {
      clearInterval(qrRotationInterval);
      setQrRotationInterval(null);
    }

    Modal.confirm({
      title: "Are you sure you want to close?",
      content: "The QR code will no longer be accessible.",
      okText: "Yes",
      cancelText: "No",
      onOk: () => setIsQRModalOpen(false),
    });
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
              "https://attendance-system-w70n.onrender.com/api/sessions/end",
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
                    `https://attendance-system-w70n.onrender.com/api/sessions/status/${currentSession._id}`,
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
            `https://attendance-system-w70n.onrender.com/api/attendance/${recordId}`,
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
        `https://attendance-system-w70n.onrender.com/api/attendance/realtime-lecturer/${currentSession._id}`,
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
      title: (<><IdcardOutlined style={{ marginRight: 4, color: themeColors.accent }} />Reg Number</>),
      dataIndex: ["student", "regNo"],
      key: "regNo",
      sorter: (a, b) => a.student.regNo.localeCompare(b.student.regNo),
      width: screens.xs ? 90 : undefined,
      render: (text) => <span style={{ color: themeColors.text }}>{text}</span>,
    },
    {
      title: (<><UserOutlined style={{ marginRight: 4, color: themeColors.accent }} />First Name</>),
      dataIndex: ["student", "firstName"],
      key: "firstName",
      sorter: (a, b) => a.student.firstName.localeCompare(b.student.firstName),
      width: screens.xs ? 70 : undefined,
      render: (text) => <span style={{ color: themeColors.text }}>{text}</span>,
    },
    {
      title: (<><UserOutlined style={{ marginRight: 4, color: themeColors.accent }} />Last Name</>),
      dataIndex: ["student", "lastName"],
      key: "lastName",
      sorter: (a, b) => a.student.lastName.localeCompare(b.student.lastName),
      width: screens.xs ? 70 : undefined,
      render: (text) => <span style={{ color: themeColors.text }}>{text}</span>,
    },
    {
      title: (<><ScanOutlined style={{ marginRight: 4, color: themeColors.accent }} />Scan Time</>),
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
      title: (<><CheckCircleOutlined style={{ marginRight: 4, color: themeColors.accent }} />Status</>),
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
      title: (<><IdcardOutlined style={{ marginRight: 4, color: themeColors.accent }} />Reg Number</>),
      dataIndex: ["student", "regNo"],
      key: "regNo",
      sorter: (a, b) => a.student.regNo.localeCompare(b.student.regNo),
      width: screens.xs ? 90 : undefined,
      render: (text) => <span style={{ color: themeColors.text }}>{text}</span>,
    },
    {
      title: (<><UserOutlined style={{ marginRight: 4, color: themeColors.accent }} />First Name</>),
      dataIndex: ["student", "firstName"],
      key: "firstName",
      sorter: (a, b) => a.student.firstName.localeCompare(b.student.firstName),
      width: screens.xs ? 70 : undefined,
      render: (text) => <span style={{ color: themeColors.text }}>{text}</span>,
    },
    {
      title: (<><UserOutlined style={{ marginRight: 4, color: themeColors.accent }} />Last Name</>),
      dataIndex: ["student", "lastName"],
      key: "lastName",
      sorter: (a, b) => a.student.lastName.localeCompare(b.student.lastName),
      width: screens.xs ? 70 : undefined,
      render: (text) => <span style={{ color: themeColors.text }}>{text}</span>,
    },
    {
      title: (<><ScanOutlined style={{ marginRight: 4, color: themeColors.accent }} />Scan Time</>),
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
      title: (<><CheckCircleOutlined style={{ marginRight: 4, color: themeColors.accent }} />Status</>),
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
    <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]} justify="space-between" style={{ margin: 0 }}>
      <Col xs={12} sm={12} md={6} lg={6}>
        <Card
          style={{
            ...cardStyle,
            background: summaryCardGradients.assignedUnits,
            border: 'none', // Explicitly remove all borders
            height: "100%",
            color: "#fff",
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // Add shadow for depth instead of border
            padding: screens.xs ? '8px 4px' : undefined, // Reduce padding on xs screens
          }}
          bodyStyle={{
            padding: screens.xs ? '8px 4px' : '24px 12px', // Responsive padding
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
          hoverable
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <Statistic
            title={<Text style={{ color: "#fff", fontSize: screens.xs ? 10 : 14 }}>Assigned Units</Text>}
            value={totalAssignedUnits}
            prefix={<TeamOutlined style={{ fontSize: screens.xs ? 12 : 16 }} />}
            loading={loading.units}
            valueStyle={{ color: "#fff", fontSize: screens.xs ? 12 : 20, lineHeight: screens.xs ? '1.2' : '1.5' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={12} md={6} lg={6}>
        <Card
          style={{
            ...cardStyle,
            background: summaryCardGradients.attendanceRate,
            border: 'none', // Explicitly remove all borders
            height: "100%",
            color: "#fff",
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // Add shadow for depth instead of border
            padding: screens.xs ? '8px 4px' : undefined, // Reduce padding on xs screens
          }}
          bodyStyle={{
            padding: screens.xs ? '8px 4px' : '24px 12px', // Responsive padding
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
          hoverable
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <Statistic
            title={<Text style={{ color: "#fff", fontSize: screens.xs ? 10 : 14 }}>Attendance Rate</Text>}
            value={attendanceRate}
            suffix="%"
            prefix={<PercentageOutlined style={{ fontSize: screens.xs ? 12 : 16 }} />}
            loading={loading.realTimeAttendance}
            valueStyle={{ color: "#fff", fontSize: screens.xs ? 12 : 20, lineHeight: screens.xs ? '1.2' : '1.5' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={12} md={6} lg={6}>
        <Card
          style={{
            ...cardStyle,
            background: summaryCardGradients.totalScans,
            border: 'none', // Explicitly remove all borders
            height: "100%",
            color: "#fff",
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // Add shadow for depth instead of border
            padding: screens.xs ? '8px 4px' : undefined, // Reduce padding on xs screens
          }}
          bodyStyle={{
            padding: screens.xs ? '8px 4px' : '24px 12px', // Responsive padding
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
          hoverable
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <Statistic
            title={<Text style={{ color: "#fff", fontSize: screens.xs ? 10 : 14 }}>Total Scans</Text>}
            value={totalScans}
            prefix={<ScheduleOutlined style={{ fontSize: screens.xs ? 12 : 16 }} />}
            loading={loading.realTimeAttendance}
            valueStyle={{ color: "#fff", fontSize: screens.xs ? 12 : 20, lineHeight: screens.xs ? '1.2' : '1.5' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={12} md={6} lg={6}>
        <Card
          style={{
            ...cardStyle,
            background: summaryCardGradients.totalEnrolled,
            border: 'none', // Explicitly remove all borders
            height: "100%",
            color: "#fff",
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // Add shadow for depth instead of border
            padding: screens.xs ? '8px 4px' : undefined, // Reduce padding on xs screens
          }}
          bodyStyle={{
            padding: screens.xs ? '8px 4px' : '24px 12px', // Responsive padding
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
          hoverable
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <Statistic
            title={<Text style={{ color: "#fff", fontSize: screens.xs ? 10 : 14 }}>Total Enrolled</Text>}
            value={enrolledStudents}
            prefix={<ScheduleOutlined style={{ fontSize: screens.xs ? 12 : 16 }} />}
            loading={loading.units}
            valueStyle={{ color: "#fff", fontSize: screens.xs ? 12 : 20, lineHeight: screens.xs ? '1.2' : '1.5' }}
          />
        </Card>
      </Col>
    </Row>
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
        url: `https://attendance-system-w70n.onrender.com/api/attendance/export/unit/${unit}`,
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

  return (
    <div style={{
      padding: 0,
      margin: 0,
      background: isDarkMode ? themeColors.background : 'rgb(247, 249, 252)',
      width: '100%',
      overflowX: 'hidden',
      paddingLeft: screens.xs ? '8px' : screens.md ? '16px' : 0,
      paddingRight: screens.xs ? '8px' : screens.md ? '16px' : 0,
      paddingTop: screens.xs ? '8px' : screens.md ? '16px' : 0, // Add top padding
    }}>
      {loadingSessionData ? (
        <Card style={{ ...cardStyle, marginBottom: 24 }} loading>
          <Skeleton active />
        </Card>
      ) : (
        <Card
          title={
            <Space>
              <ClockCircleOutlined style={{ color: currentSession && !currentSession.ended ? themeColors.primary : themeColors.textSecondary }} />
              <Text strong style={{ color: themeColors.text }}>
                {currentSession && !currentSession.ended
                  ? `Active Session: ${currentSession.unit?.name || "Unknown Unit"}`
                  : selectedUnit
                    ? `No Active Session for ${units.find(u => u._id === selectedUnit)?.name || "Selected Unit"}`
                    : "No Active Session"
                }
              </Text>
            </Space>
          }
          style={{
            ...cardStyle,
            background: currentSession && !currentSession.ended
              ? isDarkMode ? `${themeColors.cardGradient1}E6` : themeColors.cardGradient1
              : themeColors.cardBg,
            borderLeft: currentSession && !currentSession.ended
              ? `4px solid ${isDarkMode ? `${themeColors.primary}E6` : themeColors.primary}`
              : `4px solid ${themeColors.border}`,
            marginBottom: 24,
            padding: '16px',
            boxShadow: isDarkMode
              ? "0 4px 15px rgba(0, 0, 0, 0.3)"
              : "0 4px 15px rgba(0, 0, 0, 0.05)",
          }}
          bodyStyle={{
            padding: screens.xs ? '12px' : '16px',  // Responsive padding
          }}
        >
          {currentSession && !currentSession.ended ? (
            <Row gutter={[8, 16]}>  {/* Increase vertical spacing */}
              <Col span={24} style={{ marginBottom: 8 }}>  {/* Add margin bottom */}
                <Text strong style={{ color: themeColors.text, marginRight: 8 }}>  {/* Add margin right */}
                  Time:{" "}
                </Text>
                <span style={{ color: themeColors.text }}>{formatSessionTime(currentSession)}</span>
              </Col>
              <Col span={24} style={{ marginBottom: 16 }}>  {/* Add margin bottom */}
                <SessionTimer end={currentSession.endSession} />
              </Col>
              <Col span={24}>
                <Button
                  danger
                  onClick={handleEndSession}
                  loading={loading.session}
                  style={{
                    background: themeColors.accent,
                    borderColor: themeColors.accent,
                    color: themeColors.text,
                    width: screens.xs ? "100%" : "auto",
                    borderRadius: 8,
                    transition: "all 0.3s",
                    marginTop: 8,  // Add margin top
                  }}
                >
                  {loading.session ? "Ending Session..." : "End Session Early"}
                </Button>
              </Col>
            </Row>
          ) : (
            <Row gutter={[8, 8]}>
              <Col span={24}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  margin: '8px 0',  // Add vertical margins
                  padding: '0 8px',  // Add horizontal padding
                }}>
                  <Text style={{ color: themeColors.text }}>
                    {selectedUnit
                      ? `No active session found for ${units.find(u => u._id === selectedUnit)?.name || "selected unit"}.`
                      : `Please select a unit to check for active sessions.`
                    }
                  </Text>
                  {selectedUnit && (
                    <Button
                      type="primary"
                      icon={<CalendarOutlined />}
                      onClick={handleCreateSession}
                      disabled={loading.session}
                      loading={loading.session}
                      style={{
                        background: themeColors.primary,
                        borderColor: themeColors.primary,
                        color: themeColors.text,
                        borderRadius: 8,
                        transition: "all 0.3s",
                        marginLeft: 8,
                      }}
                    >
                      {loading.session ? "Creating..." : "Create Session"}
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          )}
        </Card>
      )}

      <Card
        extra={
          <Space wrap size={screens.xs ? "small" : "middle"} style={{ justifyContent: screens.xs ? 'center' : 'flex-end' }}>
            <Select
              placeholder="Select Unit"
              style={{ width: screens.xs ? "100%" : 300 }}
              onChange={setSelectedUnit}
              value={selectedUnit}
              loading={loading.units}
              dropdownMatchSelectWidth={false} // Prevents dropdown from being too wide on small screens
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

            {/* Place buttons on same line with responsive space between */}
            <Space size={screens.xs ? "small" : "middle"} style={{ display: 'flex', flexWrap: 'nowrap' }}>
              <Button
                type="primary"
                icon={<QrcodeOutlined />}
                onClick={handleGenerateQR}
                disabled={!selectedUnit || !currentSession || currentSession?.ended}
                loading={loading.qr}
                style={{
                  background: themeColors.primary,
                  borderColor: themeColors.primary,
                  color: isDarkMode ? themeColors.text : "#fff",
                  borderRadius: 8,
                  transition: "all 0.3s ease",
                  padding: screens.xs ? "0 8px" : undefined,
                  minWidth: screens.xs ? 0 : undefined,
                }}
              >
                {loading.qr ? "..." : screens.xs ? "QR" : (screens.md ? "Generate QR Code" : "QR Code")}
              </Button>
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={handleCreateSession}
                disabled={loading.session || (currentSession && !currentSession.ended)}
                loading={loading.session}
                style={{
                  background: themeColors.primary,
                  borderColor: themeColors.primary,
                  color: themeColors.text,
                  borderRadius: 8,
                  transition: "all 0.3s ease",
                  padding: screens.xs ? "0 8px" : undefined,
                  minWidth: screens.xs ? 0 : undefined,
                }}
              >
                {loading.session ? "..." : screens.xs ? "Create" : "Create Session"}
              </Button>
            </Space>
          </Space>
        }
        style={{
          ...cardStyle,
          marginBottom: 24, // Add margin below main card
        }}
      >
        <Space direction="vertical" style={{ width: "100%", margin: 0 }} size={24}>
          {summaryCards}
          {/* Real-time Attendance Card */}
          <Card
            title={<Text strong style={{ color: themeColors.text }}>Real-time Unit Attendance</Text>}
            size="small"
            extra={
              <Space>
                <Button
                  type="link"
                  onClick={clearFilters}
                  disabled={!Object.values(unitFilters).some(Boolean)}
                  style={{ color: themeColors.secondary }}
                >
                  Clear Filters
                </Button>
                <Button
                  onClick={handleViewAttendance}
                  loading={loading.realTimeAttendance}
                  disabled={!selectedUnit || !currentSession || currentSession?.ended}
                  type="primary"
                  icon={<SyncOutlined spin={loading.realTimeAttendance} />}
                  size="small"
                  style={{
                    background: themeColors.primary,
                    borderColor: themeColors.primary,
                    color: themeColors.text,
                    borderRadius: 8,
                    transition: "all 0.3s",
                  }}
                >
                  {loading.realTimeAttendance ? "Refreshing..." : "Refresh"}
                </Button>
              </Space>
            }
            style={{
              ...cardStyle,
              borderTop: `3px solid ${themeColors.primary}`,
              marginTop: 16 // Add margin above real-time attendance card
            }}
            className="no-hover"
          >
            <div
              ref={tableContainerRef}
              style={{
                height: tableContainerHeight,
                overflow: "auto",
                position: "relative",
                transition: "none", // Prevent transition animations
              }}
              className="attendance-table-container"
            >
              {loading.realTimeAttendance && !attendance.length ? (
                <Skeleton active />
              ) : (
                <Table
                  columns={realTimeColumns}
                  dataSource={attendance}
                  rowKey="_id"
                  scroll={{ x: 'max-content' }} // Better mobile scrolling
                  pagination={{
                    pageSize: screens.xs ? 5 : 8,
                    responsive: true,
                    showSizeChanger: false,
                    showTotal: (total) => `Total ${total} students`,
                    size: screens.xs ? "small" : "default",
                    simple: screens.xs, // Use simple pagination on mobile
                  }}
                  locale={{ emptyText: "No active session attendance records found" }}
                  bordered
                  size={screens.xs ? "small" : "middle"}
                  rowClassName={getRowClassName}
                  components={{
                    body: {
                      wrapper: ({ children, ...props }) => (
                        <tbody {...props}>{children}</tbody>
                      ),
                      row: ({ children, className, ...props }) => (
                        <tr {...props} className={className}>{children}</tr>
                      ),
                    },
                  }}
                />
              )}
            </div>
          </Card>

          {/* Report Attendance Card */}
          <Card
            title={<Text strong style={{ color: themeColors.text }}>Attendance Records for Past Sessions</Text>}
            size="small"
            style={{
              ...cardStyle,
              borderTop: `3px solid ${themeColors.primary}`,
              marginTop: 16 // Add margin above past sessions card
            }}
            className="no-hover"
          >
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadReport(selectedUnit)}
              disabled={!selectedUnit}
              loading={loading.stats}
              style={{
                color: themeColors.primary,
                borderColor: themeColors.primary,
                width: screens.xs ? "100%" : "auto",
                marginBottom: screens.xs ? 0 : 4,
                borderRadius: 8,
                transition: "all 0.3s",
              }}
            >
              {loading.stats ? "Exporting..." : screens.md ? "Download Excel Report" : "Export"}
            </Button>
            <Space
              wrap
              style={{ width: "100%", marginTop: screens.xs ? 0 : 4 }}
              size={screens.xs ? "small" : "middle"}
            >
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
            </Space>
            <Skeleton active loading={loading.pastAttendance}>
              <Table
                columns={pastColumns}
                dataSource={pastAttendance}
                rowKey="_id"
                scroll={{ x: true }}
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
          </Card>
        </Space>
      </Card>

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
                }}
              />
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