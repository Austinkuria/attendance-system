import { useState, useEffect, useCallback, useMemo } from "react";
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

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text } = Typography;

const AttendanceManagement = () => {
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

  // Styling constants
  const cardStyle = {
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    marginBottom: "24px",
    background: "#fff",
    overflow: "hidden",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  };

  const primaryColor = "#1d39c4"; // Deep blue for primary elements
  const secondaryColor = "#13c2c2"; // Cyan for accents
  const textColor = "#1d3557"; // Dark blue-gray for text
  const disabledTextColor = "#8c8c8c"; // Gray for disabled states
  const backgroundColor = "#f0f2f5"; // Light gray background

  useEffect(() => {
    if (currentSession) {
      localStorage.setItem("currentSession", JSON.stringify(currentSession));
      console.log("Updated localStorage with currentSession:", currentSession);
    } else {
      localStorage.removeItem("currentSession");
      console.log("Cleared localStorage currentSession");
    }
  }, [currentSession]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (error) {
        if (error.response?.status === 429) {
          message.warning("Too many requests to fetch departments. Please try again later.");
        } else {
          message.error("Failed to fetch departments");
        }
      }
    };
    if (departments.length === 0) fetchDepartments();
  }, [departments]);

  const checkCurrentSession = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, session: true }));
      setLoadingSessionData(true);
      const { data } = await detectCurrentSession(lecturerId);
      console.log("Detected session from backend:", data);

      if (data && !data.ended && new Date(data.endTime) > new Date()) {
        const validStartTime = new Date(data.startTime);
        const validEndTime = new Date(data.endTime);
        if (!validStartTime || !validEndTime || isNaN(validStartTime.getTime()) || isNaN(validEndTime.getTime())) {
          throw new Error("Invalid session times detected");
        }
        setCurrentSession({ ...data, startSession: validStartTime, endSession: validEndTime });
        setQrData(data.qrCode);
        setSelectedUnit(data.unit && data.unit._id ? data.unit._id : data.unit);
      } else {
        setCurrentSession(null);
        setQrData("");
        localStorage.removeItem("currentSession");
      }
    } catch (error) {
      console.error("Error checking current session:", error);
      setCurrentSession(null);
      setQrData("");
      localStorage.removeItem("currentSession");
      if (error.response?.status === 429) {
        message.warning("Too many requests to check session. Please try again later.");
      } else {
        message.error(error.message || "Failed to detect current session");
      }
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
    if (currentSession && currentSession.startSession && currentSession.endSession && !currentSession.ended) {
      intervalId = setInterval(() => {
        const now = new Date();
        if (now > new Date(currentSession.endSession)) {
          setCurrentSession(null);
          setQrData("");
          localStorage.removeItem("currentSession");
          clearInterval(intervalId);
        }
      }, 60000);
      return () => clearInterval(intervalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      } catch (error) {
        if (error.response?.status === 429) {
          message.warning("Too many requests to fetch units. Please try again later.");
        } else {
          message.error("Failed to load unit data");
        }
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
      if (!token) {
        console.error("No authentication token found");
        message.error("Authentication token missing. Please log in again.");
        setLoadingSessionData(false);
        return;
      }

      if (!selectedUnit || selectedUnit === "undefined") {
        console.error("No valid unit selected:", selectedUnit);
        message.error("Please select a unit before fetching the session.");
        setLoadingSessionData(false);
        return;
      }

      try {
        setLoadingSessionData(true);
        console.log("Fetching session for unit:", selectedUnit);
        const response = await axios.get(
          `https://attendance-system-w70n.onrender.com/api/sessions/current/${selectedUnit}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: (status) => status >= 200 && status < 300,
          }
        );
        console.log("Full API response for current session:", response.data);
        if (response.data && response.data._id && !response.data.ended) {
          const validStartTime = response.data.startTime ? new Date(response.data.startTime) : null;
          const validEndTime = response.data.endTime ? new Date(response.data.endTime) : null;
          if (
            !validStartTime ||
            !validEndTime ||
            isNaN(validStartTime.getTime()) ||
            isNaN(validEndTime.getTime())
          ) {
            message.warning("Invalid session times received.");
            setCurrentSession(null);
            setQrData("");
          } else {
            const unitFromResponse = response.data.unit || {};
            const unitName =
              unitFromResponse.name ||
              (units.find((u) => u._id === response.data.unit)?.name) ||
              "Unknown Unit";
            setCurrentSession({
              ...response.data,
              unit: { name: unitName },
              startSession: validStartTime,
              endSession: validEndTime,
            });
            setQrData(response.data.qrCode);
          }
        } else {
          setCurrentSession(null);
          setQrData("");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        if (error.response?.status === 429) {
          message.warning("Too many requests to fetch session. Please try again later.");
        } else if (error.response?.status === 400) {
          message.error("Invalid unit ID provided.");
        } else {
          message.error(error.response?.data?.message || "Failed to fetch session.");
        }
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
    } catch (error) {
      console.error("Error fetching real-time attendance:", error);
      if (error.response?.status === 429) {
        message.warning("Too many requests to fetch attendance data. Please try again later.");
      } else {
        message.error(error.message || "Failed to fetch attendance data");
      }
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
        startDate: pastFilters.date ? new Date(pastFilters.date).toISOString().split("T")[0] : null,
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
          (units.find((u) => u._id.toString() === session.unit.toString())?.name) ||
          "Unknown Unit",
      }));
      console.log("Past sessions fetched:", sessions);
      setPastSessions(sessions);

      if (!pastFilters.sessionId && sessions.length > 0) {
        const sessionsForDate = sessions.filter(
          (session) => moment(session.startTime).format("YYYY-MM-DD") === pastFilters.date
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
      console.error("Error fetching past sessions:", error);
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
      const validStartTime = data.startTime ? new Date(data.startTime) : new Date();
      const validEndTime = data.endTime ? new Date(data.endTime) : new Date(Date.now() + 60 * 60 * 1000);
      if (isNaN(validStartTime.getTime()) || isNaN(validEndTime.getTime())) {
        throw new Error("Invalid session times received from API");
      }
      message.success("Session created successfully");
      setCurrentSession({ ...data, startSession: validStartTime, endSession: validEndTime, ended: false });
      setQrData(data.qrCode);
    } catch (error) {
      console.error("Error creating session:", error);
      if (error.response?.status === 429) {
        message.warning("Too many requests. Please try creating the session again later.");
      } else {
        message.error(error.message || "Failed to create session");
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
      console.log("QR Code API response:", data);
      if (!data || !data.qrCode || data.ended) {
        throw new Error("QR code is missing, invalid, or session has ended!");
      }
      setQrData(data.qrCode);
      setIsQRModalOpen(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
      if (error.response?.status === 429) {
        message.warning("Too many requests. Please try generating the QR code again later.");
      } else {
        message.error(error.message || "Failed to generate QR code");
      }
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
        content: "This will stop the session and mark absent students. The session data will be preserved.",
        okText: "End Session",
        okType: "danger",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            if (!currentSession?._id) throw new Error("Invalid session ID");
            console.log("Ending session with ID:", currentSession._id);
            const response = await axios.post(
              "https://attendance-system-w70n.onrender.com/api/sessions/end",
              { sessionId: currentSession._id },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Session end response:", response.data);
            if (response.data.session.ended) {
              message.success("Session ended successfully");
              setCurrentSession(null);
              setQrData("");
              setAttendance([]);
              localStorage.removeItem("currentSession");
              setSelectedUnit(null);
              await checkCurrentSession();
            } else {
              throw new Error("Session not marked as ended");
            }
          } catch (error) {
            console.error("Error ending session:", error);
            if (error.response?.status === 429) {
              message.warning("Too many requests. Please try again later.");
            } else if (error.response?.status === 400) {
              message.error("Invalid request. Session may already be ended.");
              setCurrentSession(null);
              setQrData("");
              localStorage.removeItem("currentSession");
            } else {
              message.error(error.response?.data?.message || "Failed to end session");
            }
          } finally {
            setLoading((prev) => ({ ...prev, session: false }));
          }
        },
      });
    } catch (error) {
      console.error("Unexpected error in handleEndSession:", error);
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
        } catch (error) {
          console.error("Error updating status:", error);
          if (error.response?.status === 429) {
            message.warning("Too many requests. Please try again later.");
          } else {
            message.error("Failed to update attendance status");
          }
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
      const absentStudents = enrolledStudents.filter((id) => !presentIds.has(id.toString()));

      const response = await axios.get(
        `https://attendance-system-w70n.onrender.com/api/attendance/realtime-lecturer/${currentSession._id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const allAttendance = response.data;
      const absentRecords = allAttendance.filter(
        (a) => absentStudents.includes(a.student._id.toString()) || a.status === "Absent"
      );
      setAttendance(absentRecords);
      message.success("Showing absent students");
    } catch (error) {
      console.error("Error fetching absent students:", error);
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
    },
    {
      title: "First Name",
      dataIndex: ["student", "firstName"],
      key: "firstName",
      sorter: (a, b) => a.student.firstName.localeCompare(b.student.firstName),
    },
    {
      title: "Last Name",
      dataIndex: ["student", "lastName"],
      key: "lastName",
      sorter: (a, b) => a.student.lastName.localeCompare(b.student.lastName),
    },
    {
      title: "Scan Time",
      dataIndex: "attendedAt",
      key: "attendedAt",
      render: (attendedAt) =>
        attendedAt ? (
          <Tag color={secondaryColor}>{new Date(attendedAt).toLocaleTimeString()}</Tag>
        ) : (
          "N/A"
        ),
      sorter: (a, b) => new Date(a.attendedAt || 0) - new Date(b.attendedAt || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Present" ? "#52c41a" : "#f5222d"}>{status.toUpperCase()}</Tag>
      ),
      filters: [
        { text: "Present", value: "Present" },
        { text: "Absent/Not Scanned", value: "Absent", onFilter: () => fetchAbsentStudents() },
      ],
      onFilter: (value, record) => (value === "Present" ? record.status === "Present" : false),
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
          style={{ color: primaryColor }}
        >
          Toggle Status
        </Button>
      ),
    },
  ];

  const pastColumns = [
    {
      title: "Reg Number",
      dataIndex: ["student", "regNo"],
      key: "regNo",
      sorter: (a, b) => a.student.regNo.localeCompare(b.student.regNo),
    },
    {
      title: "First Name",
      dataIndex: ["student", "firstName"],
      key: "firstName",
      sorter: (a, b) => a.student.firstName.localeCompare(b.student.firstName),
    },
    {
      title: "Last Name",
      dataIndex: ["student", "lastName"],
      key: "lastName",
      sorter: (a, b) => a.student.lastName.localeCompare(b.student.lastName),
    },
    {
      title: "Scan Time",
      dataIndex: "attendedAt",
      key: "attendedAt",
      render: (attendedAt) =>
        attendedAt ? (
          <Tag color={secondaryColor}>{new Date(attendedAt).toLocaleTimeString()}</Tag>
        ) : (
          "N/A"
        ),
      sorter: (a, b) => new Date(a.attendedAt || 0) - new Date(b.attendedAt || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Present" ? "#52c41a" : "#f5222d"}>{status.toUpperCase()}</Tag>
      ),
      filters: [
        { text: "Present", value: "Present" },
        { text: "Absent", value: "Absent" },
      ],
      onFilter: (value, record) => record.status === value,
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
    return enrolledStudents > 0 ? Number(((presentCount / enrolledStudents) * 100).toFixed(1)) : 0;
  }, [attendance, enrolledStudents]);

  const summaryCards = (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Card
          style={{
            ...cardStyle,
            background: "linear-gradient(135deg, #e6f7ff, #bae7ff)",
            borderLeft: `4px solid ${primaryColor}`,
          }}
          hoverable
        >
          <Statistic
            title={<Text style={{ color: textColor }}>Assigned Units</Text>}
            value={totalAssignedUnits}
            prefix={<TeamOutlined style={{ color: primaryColor }} />}
            loading={loading.units}
            valueStyle={{ color: textColor }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card
          style={{
            ...cardStyle,
            background: "linear-gradient(135deg, #f6ffed, #d9f7be)",
            borderLeft: "4px solid #52c41a",
          }}
          hoverable
        >
          <Statistic
            title={<Text style={{ color: textColor }}>Attendance Rate</Text>}
            value={attendanceRate}
            suffix="%"
            prefix={<PercentageOutlined style={{ color: "#52c41a" }} />}
            loading={loading.realTimeAttendance}
            valueStyle={{ color: textColor }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card
          style={{
            ...cardStyle,
            background: "linear-gradient(135deg, #fff7e6, #ffd8bf)",
            borderLeft: "4px solid #fa8c16",
          }}
          hoverable
        >
          <Statistic
            title={<Text style={{ color: textColor }}>Total Enrolled Students</Text>}
            value={enrolledStudents}
            prefix={<ScheduleOutlined style={{ color: "#fa8c16" }} />}
            loading={loading.units}
            valueStyle={{ color: textColor }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card
          style={{
            ...cardStyle,
            background: "linear-gradient(135deg, #e6fffb, #b5f5ec)",
            borderLeft: `4px solid ${secondaryColor}`,
          }}
          hoverable
        >
          <Statistic
            title={<Text style={{ color: textColor }}>Total Scans</Text>}
            value={totalScans}
            prefix={<ScheduleOutlined style={{ color: secondaryColor }} />}
            loading={loading.realTimeAttendance}
            valueStyle={{ color: textColor }}
          />
        </Card>
      </Col>
    </Row>
  );

  const formatSessionTime = (session) => {
    if (!session || !session.startSession || !session.endSession) return "No session time available";
    try {
      const startTime = new Date(session.startSession);
      const endTime = new Date(session.endSession);
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return "Invalid session time";
      const options = { hour: "numeric", minute: "2-digit", hour12: true };
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
      <div style={{ marginTop: 16 }}>
        <Tag icon={<ClockCircleOutlined />} color={primaryColor}>
          Time Remaining: {formatTime(timeLeft)}
        </Tag>
      </div>
    );
  };

  SessionTimer.propTypes = {
    end: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
  };

  return (
    <div style={{ padding: screens.md ? 24 : 16, background: backgroundColor }}>
      {loadingSessionData ? (
        <Card style={cardStyle} loading>
          <Skeleton active />
        </Card>
      ) : currentSession && currentSession.startSession && currentSession.endSession && !currentSession.ended ? (
        <Card
          title={
            <Space>
              <ClockCircleOutlined style={{ color: primaryColor }} />
              <Text strong style={{ color: textColor }}>
                Active Session: {currentSession.unit?.name || "Unknown Unit"}
              </Text>
            </Space>
          }
          style={{
            ...cardStyle,
            background: "linear-gradient(135deg, #e6f7ff, #bae7ff)",
            borderLeft: `4px solid ${primaryColor}`,
          }}
          hoverable
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Text strong style={{ color: textColor }}>Time: </Text>
              {formatSessionTime(currentSession)}
            </Col>
            <Col span={24}>
              <SessionTimer end={currentSession.endSession} />
            </Col>
            <Col span={24}>
              <Button
                danger
                onClick={handleEndSession}
                loading={loading.session}
                style={{ background: "#ff4d4f", borderColor: "#ff4d4f", color: "#fff" }}
              >
                End Session Early
              </Button>
            </Col>
          </Row>
        </Card>
      ) : null}

      <Card
        extra={
          <Space wrap>
            <Select
                placeholder="Select Unit"
                style={{ width: 300 }}
                onChange={setSelectedUnit}
                value={selectedUnit}
                loading={loading.units}
              >
                {units.map((unit) => (
                  <Option key={unit._id} value={unit._id}>
                    <Space>
                      <BookOutlined style={{ color: primaryColor }} />
                      {unit.name}
                      <Tag color={secondaryColor}>{unit.code}</Tag>
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
              style={{ background: primaryColor, borderColor: primaryColor }}
            >
              {screens.md ? "Generate QR Code" : "QR Code"}
            </Button>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={handleCreateSession}
              disabled={loading.session || (currentSession && !currentSession.ended)}
              style={{ background: primaryColor, borderColor: primaryColor }}
            >
              {loading.session ? "Creating..." : "Create Attendance Session"}
            </Button>
          </Space>
        }
        style={cardStyle}
        hoverable
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Card
            title={<Text strong style={{ color: primaryColor }}>Real-time Unit Attendance</Text>}
            size="small"
            extra={
              <Button
                type="link"
                onClick={clearFilters}
                disabled={!Object.values(unitFilters).some(Boolean)}
                style={{ color: secondaryColor }}
              >
                Clear Filters
              </Button>
            }
            style={{ ...cardStyle, borderTop: `3px solid ${primaryColor}` }}
            hoverable
          >
           
            <Space wrap style={{ marginTop: 16 }}>
              
              <Button
                onClick={handleViewAttendance}
                loading={loading.realTimeAttendance}
                disabled={!selectedUnit || !currentSession || currentSession?.ended}
                type="primary"
                style={{ background: primaryColor, borderColor: primaryColor }}
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
                  pageSize: 8,
                  responsive: true,
                  showSizeChanger: false,
                  showTotal: (total) => `Total ${total} students`,
                }}
                locale={{ emptyText: "No active session attendance records found" }}
                bordered
                size="middle"
                rowClassName={(record, index) => (index % 2 === 0 ? "table-row-light" : "table-row-dark")}
              />
            </Skeleton>
          </Card>

          {summaryCards}

          <Card
            title={<Space><Text strong style={{ color: primaryColor }}>Attendance Records for Past Sessions</Text></Space>}
            size="small"
            style={{ ...cardStyle, borderTop: `3px solid ${primaryColor}` }}
            hoverable
            >
            <Button
              icon={<DownloadOutlined />}
              onClick={() => downloadAttendanceReport(selectedUnit)}
              disabled={!selectedUnit}
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              {screens.md ? "Download Report" : "Export"}
            </Button>
            <Space wrap style={{ width: "100%" }}>
              <Select
                placeholder="Select Unit"
                style={{ width: 240 }}
                onChange={(value) => setPastFilters((prev) => ({ ...prev, unit: value, sessionId: null }))}
                allowClear
                value={pastFilters.unit}
              >
                {units.map((unit) => (
                  <Option key={unit._id} value={unit._id}>{unit.name}</Option>
                ))}
              </Select>
              <DatePicker
                defaultValue={moment()}
                placeholder="Select Date"
                style={{ width: 150 }}
                onChange={(_, dateString) =>
                  setPastFilters((prev) => ({ ...prev, date: dateString, sessionId: null }))
                }
                allowClear
              />
              <Select
                placeholder="Select Session"
                style={{ width: 300 }}
                onChange={(value) => setPastFilters((prev) => ({ ...prev, sessionId: value }))}
                allowClear
                value={pastFilters.sessionId}
              >
                {pastSessions
                  .filter(
                    (session) => moment(session.startTime).format("YYYY-MM-DD") === pastFilters.date
                  )
                  .map((session) => (
                    <Option key={session.sessionId} value={session.sessionId}>
                      {`${session.unitName} - ${moment(session.startTime).format("hh:mm A")} - ${moment(session.endTime).format("hh:mm A")} (${moment(session.startTime).format("DD/MM/YYYY")})`}
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
                  pageSize: 8,
                  responsive: true,
                  showSizeChanger: false,
                  showTotal: (total) => `Total ${total} students`,
                }}
                locale={{ emptyText: "No past attendance records found" }}
                bordered
                size="middle"
                rowClassName={(record, index) => (index % 2 === 0 ? "table-row-light" : "table-row-dark")}
              />
            </Skeleton>
          </Card>
        </Space>
      </Card>

      <Modal
        title={<Text strong style={{ color: primaryColor }}>Class QR Code</Text>}
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
            style={{ color: primaryColor, borderColor: primaryColor }}
          >
            Close
          </Button>,
        ]}
        destroyOnClose
        maskClosable={false}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          {qrData ? (
            <>
              <img
                src={qrData}
                alt="Attendance QR Code"
                style={{
                  width: "100%",
                  maxWidth: 300,
                  margin: "0 auto",
                  display: "block",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              {currentSession && !currentSession.ended && <SessionTimer end={currentSession.endSession} />}
              <Typography.Text type="secondary" style={{ marginTop: 16, display: "block", fontSize: 16 }}>
                Scan this QR code to mark attendance.
              </Typography.Text>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 24 }}>
              <Typography.Text type="danger">Failed to generate QR Code</Typography.Text>
              <Skeleton.Image style={{ width: 300, height: 300 }} />
            </div>
          )}
        </div>
      </Modal>

      <style >{`
        .ant-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }
        .table-row-light {
          background: #fafafa;
        }
        .table-row-dark {
          background: #fff;
        }
        .ant-table-thead > tr > th {
          background: #e6f7ff;
          color: ${textColor};
          font-weight: 600;
        }
        .ant-btn-primary {
          background: ${primaryColor};
          border-color: ${primaryColor};
          color: #fff;
        }
        .ant-btn-primary:hover, .ant-btn-primary:focus {
          background: #102a9a;
          border-color: #102a9a;
          color: #fff;
        }
        .ant-btn-danger:hover, .ant-btn-danger:focus {
          background: #d9363e;
          border-color: #d9363e;
          color: #fff;
        }
        .ant-btn[disabled], .ant-btn[disabled]:hover {
          background: #f5f5f5;
          border-color: #d9d9d9;
          color: ${disabledTextColor};
        }
      `}</style>
    </div>
  );
};

export default AttendanceManagement;