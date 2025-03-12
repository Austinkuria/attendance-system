import { useState, useEffect, useCallback, useMemo, useContext } from "react";
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
} from "@ant-design/icons";
import PropTypes from "prop-types";
import axios from "axios";
import {
  downloadAttendanceReport,
  getLecturerUnits,
  getDepartments,
  detectCurrentSession,
  createSession,
} from "../services/api";
import moment from "moment";
import { ThemeContext } from "../context/ThemeContext";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text } = Typography;

const AttendanceManagement = () => {
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const screens = useBreakpoint();
  const [attendance, setAttendance] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrData, setQrData] = useState("");
  const [currentSession, setCurrentSession] = useState(() => {
    const savedSession = localStorage.getItem("currentSession");
    return savedSession ? JSON.parse(savedSession) : null;
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
    borderRadius: "16px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
    background: themeColors.cardBg,
    border: `1px solid ${themeColors.border}`,
    overflow: "hidden",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    width: "100%",
    margin: 0,
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
      } catch (_) {
        message.error("Failed to fetch departments");
      }
    };
    if (departments.length === 0) fetchDepartments();
  }, [departments]);

  const checkCurrentSession = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, session: true }));
      setLoadingSessionData(true);
      const { data } = await detectCurrentSession(lecturerId);
      if (data && !data.ended && new Date(data.endTime) > new Date()) {
        setCurrentSession({
          ...data,
          startSession: new Date(data.startTime),
          endSession: new Date(data.endTime),
        });
        setQrData(data.qrCode);
        setSelectedUnit(data.unit && data.unit._id ? data.unit._id : data.unit);
      } else {
        setCurrentSession(null);
        setQrData("");
        localStorage.removeItem("currentSession");
      }
    } catch (_) {
      setCurrentSession(null);
      setQrData("");
      localStorage.removeItem("currentSession");
      message.error("Failed to detect current session");
    } finally {
      setLoading((prev) => ({ ...prev, session: false }));
      setLoadingSessionData(false);
    }
  }, [lecturerId]);

  useEffect(() => {
    checkCurrentSession();
  }, [checkCurrentSession]);

  useEffect(() => {
    let intervalId;
    if (
      currentSession &&
      currentSession.startSession &&
      currentSession.endSession &&
      !currentSession.ended
    ) {
      intervalId = setInterval(() => {
        const now = new Date();
        if (now > new Date(currentSession.endSession)) {
          setCurrentSession(null);
          setQrData("");
          localStorage.removeItem("currentSession");
          clearInterval(intervalId);
        }
      }, 60000);
    }
    return () => clearInterval(intervalId);
  }, [currentSession]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!lecturerId) {
          message.error("User session expired");
          return;
        }
        setLoading((prev) => ({ ...prev, units: true }));
        const unitsData = await getLecturerUnits(lecturerId);
        if (unitsData?.length > 0) {
          setUnits(unitsData);
          if (!selectedUnit && !currentSession) setSelectedUnit(unitsData[0]._id);
        } else {
          message.info("No units assigned to your account");
        }
      } catch (_) {
        message.error("Failed to load unit data");
      } finally {
        setLoading((prev) => ({ ...prev, units: false }));
      }
    };
    if (lecturerId && units.length === 0) fetchData();
  }, [lecturerId, selectedUnit, currentSession, units]);

  useEffect(() => {
    if (!selectedUnit || currentSession?.ended) {
      setLoadingSessionData(false);
      if (!currentSession || currentSession.ended) {
        setCurrentSession(null);
        setQrData("");
      }
      return;
    }

    const fetchCurrentSession = async () => {
      const token = localStorage.getItem("token");
      if (!token || !selectedUnit) return;
      try {
        setLoadingSessionData(true);
        const response = await axios.get(
          `https://attendance-system-w70n.onrender.com/api/sessions/current/${selectedUnit}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data && response.data._id && !response.data.ended) {
          const unitName =
            response.data.unit?.name ||
            units.find((u) => u._id === response.data.unit)?.name ||
            "Unknown Unit";
          setCurrentSession({
            ...response.data,
            unit: { name: unitName },
            startSession: new Date(response.data.startTime),
            endSession: new Date(response.data.endTime),
          });
          setQrData(response.data.qrCode);
        } else {
          setCurrentSession(null);
          setQrData("");
        }
      } catch (_) {
        setCurrentSession(null);
        setQrData("");
      } finally {
        setLoadingSessionData(false);
      }
    };
    fetchCurrentSession();
  }, [selectedUnit, units, currentSession?.ended]);

  const handleViewAttendance = useCallback(async () => {
    if (!selectedUnit || !currentSession || currentSession.ended) return;
    try {
      setLoading((prev) => ({ ...prev, realTimeAttendance: true }));
      const response = await axios.get(
        `https://attendance-system-w70n.onrender.com/api/attendance/realtime-lecturer/${currentSession._id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setAttendance(response.data);
    } catch (_) {
      setAttendance([]);
    } finally {
      setLoading((prev) => ({ ...prev, realTimeAttendance: false }));
    }
  }, [selectedUnit, currentSession]);

  useEffect(() => {
    let intervalId;
    if (currentSession && selectedUnit && !currentSession.ended) {
      handleViewAttendance();
      intervalId = setInterval(handleViewAttendance, 10000);
    }
    return () => clearInterval(intervalId);
  }, [currentSession, selectedUnit, handleViewAttendance]);

  const fetchPastSessions = useCallback(async () => {
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
    } catch (_) {
      message.error("Failed to fetch past sessions");
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
      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const data = await createSession({ unitId: selectedUnit, lecturerId, startTime, endTime });
      message.success("Session created successfully");
      setCurrentSession({
        ...data,
        startSession: new Date(data.startTime),
        endSession: new Date(data.endTime),
        ended: false,
      });
      setQrData(data.qrCode);
    } catch (_) {
      message.error("Failed to create session");
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
    } catch (_) {
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
              "https://attendance-system-w70n.onrender.com/api/sessions/end",
              { sessionId: currentSession._id },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.session.ended) {
              message.success("Session ended successfully");
              setCurrentSession(null);
              setQrData("");
              setAttendance([]);
              localStorage.removeItem("currentSession");
              setSelectedUnit(null);
              await checkCurrentSession();
            }
          } catch (_) {
            message.error("Failed to end session");
          } finally {
            setLoading((prev) => ({ ...prev, session: false }));
          }
        },
      });
    } catch (_) {
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
        } catch (_) {
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
    } catch (_) {
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
    <Row gutter={[screens.xs ? 0 : 8, screens.xs ? 0 : 8]} justify="space-between" style={{ margin: 0 }}>
      <Col xs={12} sm={12} md={6} lg={6}>
        <Card
          style={{
            ...cardStyle,
            background: summaryCardGradients.assignedUnits,
            borderLeft: `4px solid ${themeColors.primary}`,
            height: "100%",
            color: "#fff",
          }}
          hoverable
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <Statistic
            title={<Text style={{ color: "#fff", fontSize: screens.xs ? 12 : 14 }}>Assigned Units</Text>}
            value={totalAssignedUnits}
            prefix={<TeamOutlined />}
            loading={loading.units}
            valueStyle={{ color: "#fff", fontSize: screens.xs ? 14 : 20 }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={12} md={6} lg={6}>
        <Card
          style={{
            ...cardStyle,
            background: summaryCardGradients.attendanceRate,
            borderLeft: `4px solid ${themeColors.secondary}`,
            height: "100%",
            color: "#fff",
          }}
          hoverable
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <Statistic
            title={<Text style={{ color: "#fff", fontSize: screens.xs ? 12 : 14 }}>Attendance Rate</Text>}
            value={attendanceRate}
            suffix="%"
            prefix={<PercentageOutlined />}
            loading={loading.realTimeAttendance}
            valueStyle={{ color: "#fff", fontSize: screens.xs ? 14 : 20 }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={12} md={6} lg={6}>
        <Card
          style={{
            ...cardStyle,
            background: summaryCardGradients.totalScans,
            borderLeft: `4px solid ${themeColors.accent}`,
            height: "100%",
            color: "#fff",
          }}
          hoverable
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <Statistic
            title={<Text style={{ color: "#fff", fontSize: screens.xs ? 12 : 14 }}>Total Scans</Text>}
            value={totalScans}
            prefix={<ScheduleOutlined />}
            loading={loading.realTimeAttendance}
            valueStyle={{ color: "#fff", fontSize: screens.xs ? 14 : 20 }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={12} md={6} lg={6}>
        <Card
          style={{
            ...cardStyle,
            background: summaryCardGradients.totalEnrolled,
            borderLeft: `4px solid ${themeColors.primary}`,
            height: "100%",
            color: "#fff",
          }}
          hoverable
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <Statistic
            title={<Text style={{ color: "#fff", fontSize: screens.xs ? 12 : 14 }}>Total Enrolled</Text>}
            value={enrolledStudents}
            prefix={<ScheduleOutlined />}
            loading={loading.units}
            valueStyle={{ color: "#fff", fontSize: screens.xs ? 14 : 20 }}
          />
        </Card>
      </Col>
    </Row>
  );

  const formatSessionTime = (session) => {
    if (!session || !session.startSession || !session.endSession)
      return "No session time available";
    try {
      const startTime = new Date(session.startSession);
      const endTime = new Date(session.endSession);
      const options = { hour: "numeric", minute: "2-digit", hour12: true };
      return `${startTime.toLocaleTimeString([], options)} - ${endTime.toLocaleTimeString([], options)}`;
    } catch (_) {
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
      const endTime = new Date(end).getTime();
      return isNaN(endTime) ? 0 : Math.max(0, endTime - Date.now());
    });

    useEffect(() => {
      if (isNaN(new Date(end).getTime())) {
        setTimeLeft(0);
        return;
      }
      const timer = setInterval(() => {
        const endTime = new Date(end).getTime();
        if (!isNaN(endTime)) setTimeLeft(Math.max(0, endTime - Date.now()));
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

  return (
    <div style={{ padding: screens.xs ? 0 : 4, margin: 0, background: themeColors.background, width: "100%" }}>
      {loadingSessionData ? (
        <Card style={cardStyle} loading>
          <Skeleton active />
        </Card>
      ) : currentSession && !currentSession.ended ? (
        <Card
          title={
            <Space>
              <ClockCircleOutlined style={{ color: themeColors.primary }} />
              <Text strong style={{ color: themeColors.text }}>
                Active Session: {currentSession.unit?.name || "Unknown Unit"}
              </Text>
            </Space>
          }
          style={{
            ...cardStyle,
            background: themeColors.cardGradient1,
            borderLeft: `4px solid ${themeColors.primary}`,
          }}
          hoverable
        >
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <Text strong style={{ color: themeColors.text }}>
                Time:{" "}
              </Text>
              <span style={{ color: themeColors.text }}>{formatSessionTime(currentSession)}</span>
            </Col>
            <Col span={24}>
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
                }}
              >
                End Session Early
              </Button>
            </Col>
          </Row>
        </Card>
      ) : null}

      <Card
        extra={
          <Space wrap size={screens.xs ? "small" : "middle"}>
            <Select
              placeholder="Select Unit"
              style={{ width: screens.xs ? "100%" : 300 }}
              onChange={setSelectedUnit}
              value={selectedUnit}
              loading={loading.units}
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
            <Button
              type="primary"
              icon={<QrcodeOutlined />}
              onClick={handleGenerateQR}
              disabled={!selectedUnit || !currentSession || currentSession?.ended}
              loading={loading.qr}
              style={{
                background: themeColors.primary,
                borderColor: themeColors.primary,
                color: themeColors.text,
                width: screens.xs ? "100%" : "auto",
                borderRadius: 8,
                transition: "all 0.3s",
              }}
            >
              {screens.md ? "Generate QR Code" : "QR Code"}
            </Button>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={handleCreateSession}
              disabled={loading.session || (currentSession && !currentSession.ended)}
              style={{
                background: themeColors.primary,
                borderColor: themeColors.primary,
                color: themeColors.text,
                width: screens.xs ? "100%" : "auto",
                borderRadius: 8,
                transition: "all 0.3s",
              }}
            >
              {loading.session ? "Creating..." : "Create Attendance Session"}
            </Button>
          </Space>
        }
        style={cardStyle}
        hoverable
      >
        <Space direction="vertical" style={{ width: "100%", margin: 0 }}>
          {summaryCards}
          {/* Real-time Attendance Card */}
          <Card
            title={<Text strong style={{ color: themeColors.text }}>Real-time Unit Attendance</Text>}
            size="small"
            extra={
              <Button
                type="link"
                onClick={clearFilters}
                disabled={!Object.values(unitFilters).some(Boolean)}
                style={{ color: themeColors.secondary }}
              >
                Clear Filters
              </Button>
            }
            style={{ ...cardStyle, borderTop: `3px solid ${themeColors.primary}` }}
            hoverable
            className="no-hover"
          >
            <Space wrap style={{ marginTop: screens.xs ? 0 : 8 }}>
              <Button
                onClick={handleViewAttendance}
                loading={loading.realTimeAttendance}
                disabled={!selectedUnit || !currentSession || currentSession?.ended}
                type="primary"
                style={{
                  background: themeColors.primary,
                  borderColor: themeColors.primary,
                  color: themeColors.text,
                  width: screens.xs ? "100%" : "auto",
                  borderRadius: 8,
                  transition: "all 0.3s",
                }}
              >
                Refresh Attendance Data
              </Button>
            </Space>
            <Skeleton active loading={loading.realTimeAttendance}>
              <Table
                columns={realTimeColumns}
                dataSource={attendance}
                rowKey="_id"
                scroll={{ x: true }}
                pagination={{
                  pageSize: screens.xs ? 5 : 8,
                  responsive: true,
                  showSizeChanger: false,
                  showTotal: (total) => `Total ${total} students`,
                }}
                locale={{ emptyText: "No active session attendance records found" }}
                bordered
                size={screens.xs ? "small" : "middle"}
                rowClassName={(record, index) =>
                  index % 2 === 0 ? "table-row-light" : "table-row-dark"
                }
              />
            </Skeleton>
          </Card>

          {/* Report Attendance Card */}
          <Card
            title={<Text strong style={{ color: themeColors.text }}>Attendance Records for Past Sessions</Text>}
            size="small"
            style={{ ...cardStyle, borderTop: `3px solid ${themeColors.primary}` }}
            hoverable
            className="no-hover"
          >
            <Button
              icon={<DownloadOutlined />}
              onClick={() => downloadAttendanceReport(selectedUnit)}
              disabled={!selectedUnit}
              style={{
                color: themeColors.primary,
                borderColor: themeColors.primary,
                width: screens.xs ? "100%" : "auto",
                marginBottom: screens.xs ? 0 : 4,
                borderRadius: 8,
                transition: "all 0.3s",
              }}
            >
              {screens.md ? "Download Report" : "Export"}
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
              />
              <Select
                placeholder="Select Session"
                style={{ width: screens.xs ? "100%" : 300 }}
                onChange={(value) =>
                  setPastFilters((prev) => ({ ...prev, sessionId: value }))
                }
                allowClear
                value={pastFilters.sessionId}
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
        title={<Text strong style={{ color: themeColors.primary }}>Class QR Code</Text>}
        open={isQRModalOpen}
        centered
        onCancel={() =>
          Modal.confirm({
            title: "Are you sure you want to close?",
            content: "The QR code will no longer be accessible.",
            okText: "Yes",
            cancelText: "No",
            onOk: () => setIsQRModalOpen(false),
          })
        }
        footer={[
          <Button
            key="close"
            onClick={() =>
              Modal.confirm({
                title: "Are you sure you want to close?",
                content: "The QR code will no longer be accessible.",
                okText: "Yes",
                cancelText: "No",
                onOk: () => setIsQRModalOpen(false),
              })
            }
            style={{
              color: themeColors.primary,
              borderColor: themeColors.primary,
              width: screens.xs ? "100%" : "auto",
              borderRadius: 8,
              transition: "all 0.3s",
            }}
          >
            Close
          </Button>,
        ]}
        destroyOnClose
        maskClosable={false}
        width={screens.xs ? "100%" : 520}
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
                <SessionTimer end={currentSession.endSession} />
              )}
              <Typography.Text
                type="secondary"
                style={{ marginTop: 8, display: "block", fontSize: screens.xs ? 12 : 16, color: themeColors.text }}
              >
                Scan this QR code to mark attendance.
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
        .ant-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }
        .no-hover:hover {
          transform: none !important;
          box-shadow: none !important;
        }
        .table-row-light {
          background: ${themeColors.cardBg};
        }
        .table-row-dark {
          background: ${themeColors.background};
        }
        .ant-table {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
          border: 1px solid ${themeColors.border} !important;
          border-radius: 8px;
          width: 100%;
        }
        .ant-table-thead > tr > th {
          background: ${themeColors.tableHeaderBg} !important;
          color: ${themeColors.text} !important;
          font-weight: 600;
          border-bottom: 2px solid ${themeColors.border} !important;
          padding: ${screens.xs ? "4px 2px" : "16px 8px"};
          font-size: ${screens.xs ? "11px" : "14px"};
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid ${themeColors.border} !important;
          padding: ${screens.xs ? "2px" : "8px"};
          font-size: ${screens.xs ? "11px" : "14px"};
          color: ${themeColors.text} !important;
        }
        .ant-table-tbody > tr:hover:not(.ant-table-expanded-row) > td {
          background: ${themeColors.tableRowHover} !important;
        }
        .ant-btn-primary {
          background: ${themeColors.primary} !important;
          border-color: ${themeColors.primary} !important;
          color: ${themeColors.text} !important;
        }
        .ant-btn-primary:hover, .ant-btn-primary:focus {
          background: ${themeColors.focus} !important;
          border-color: ${themeColors.focus} !important;
          color: ${themeColors.text} !important;
        }
        .ant-btn-danger {
          background: ${themeColors.accent} !important;
          border-color: ${themeColors.accent} !important;
          color: ${themeColors.text} !important;
        }
        .ant-btn-danger:hover, .ant-btn-danger:focus {
          background: ${themeColors.accent}CC !important;
          border-color: ${themeColors.accent}CC !important;
          color: ${themeColors.text} !important;
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
      `}</style>
    </div>
  );
};

export default AttendanceManagement;