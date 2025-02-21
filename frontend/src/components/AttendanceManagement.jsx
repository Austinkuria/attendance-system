import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Button, Table, Modal, Select, Input, Space, Card, Tag, Skeleton, message, Grid, Typography, Statistic, Row, Col, Form
} from 'antd';
import {
  QrcodeOutlined, DownloadOutlined, SearchOutlined, FilterOutlined, CalendarOutlined, BookOutlined, TeamOutlined, PercentageOutlined, ScheduleOutlined, SyncOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  getSessionAttendance, downloadAttendanceReport, getLecturerUnits, getDepartments, detectCurrentSession, createSession
} from '../services/api';

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const AttendanceManagement = () => {
  const screens = useBreakpoint();
  const [attendance, setAttendance] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrData, setQrData] = useState('');
  const [currentSession, setCurrentSession] = useState(() => {
    const savedSession = localStorage.getItem('currentSession');
    return savedSession ? JSON.parse(savedSession) : null;
  });
  const [departments, setDepartments] = useState([]);
  const lecturerId = localStorage.getItem("userId");
  const [loading, setLoading] = useState({
    units: true,
    attendance: false,
    stats: false,
    qr: false,
    session: false
  });
  const [loadingSessionData, setLoadingSessionData] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    year: null,
    semester: null,
    status: null
  });
  const [unitFilters, setUnitFilters] = useState({
    department: null,
    course: null,
    year: null,
    semester: null
  });

  useEffect(() => {
    if (currentSession) {
      localStorage.setItem('currentSession', JSON.stringify(currentSession));
    } else {
      localStorage.removeItem('currentSession');
    }
  }, [currentSession]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch {
        message.error('Failed to fetch departments');
      }
    };
    fetchDepartments();
  }, []);

  const checkCurrentSession = useCallback(async () => {
    try {
      setLoading(prevState => ({ ...prevState, session: true }));
      setLoadingSessionData(true);
      const { data } = await detectCurrentSession(lecturerId);
      if (data && !data.ended) {
        const validStartTime = data.startTime ? new Date(data.startTime) : null;
        const validEndTime = data.endTime ? new Date(data.endTime) : null;
        if (!validStartTime || !validEndTime || isNaN(validStartTime.getTime()) || isNaN(validEndTime.getTime())) {
          throw new Error('Invalid session times detected');
        }
        setCurrentSession({
          ...data,
          startSession: validStartTime,
          endSession: validEndTime
        });
        setQrData(data.qrCode);
      } else {
        setCurrentSession(null);
      }
    } catch (error) {
      console.error("Error checking current session:", error);
      message.error(error.message || 'Failed to detect current session');
      setCurrentSession(null);
    } finally {
      setLoading(prevState => ({ ...prevState, session: false }));
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
          setCurrentSession(prev => ({ ...prev, ended: true }));
          localStorage.removeItem('currentSession');
          clearInterval(intervalId);
        }
      }, 60000);
      return () => clearInterval(intervalId);
    }
  }, [currentSession]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!lecturerId) {
          message.error("User session expired");
          return;
        }
        setLoading(prev => ({ ...prev, units: true }));
        const unitsData = await getLecturerUnits(lecturerId);
        if (unitsData?.length > 0) {
          setUnits(unitsData);
          setSelectedUnit(unitsData[0]._id);
        } else {
          message.info("No units assigned to your account");
        }
      } catch {
        message.error("Failed to load unit data");
      } finally {
        setLoading(prev => ({ ...prev, units: false }));
      }
    };
    if (lecturerId) fetchData();
  }, [lecturerId]);

  useEffect(() => {
    if (!selectedUnit) {
      setLoadingSessionData(false);
      setCurrentSession(null);
      return;
    }

    setLoadingSessionData(true);
    const fetchCurrentSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found");
        message.error("Authentication token missing. Please log in again.");
        setLoadingSessionData(false);
        return;
      }
      try {
        console.log("Fetching session for unit:", selectedUnit);
        const response = await axios.get(`https://attendance-system-w70n.onrender.com/api/sessions/current/${selectedUnit}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          validateStatus: status => status >= 200 && status < 300
        });
        console.log("Full API response for current session:", response.data);
        if (response.data && response.data._id && !response.data.ended) {
          const validStartTime = response.data.startTime ? new Date(response.data.startTime) : null;
          const validEndTime = response.data.endTime ? new Date(response.data.endTime) : null;
          if (!validStartTime || !validEndTime || isNaN(validStartTime.getTime()) || isNaN(validEndTime.getTime())) {
            message.warning("Invalid session times received.");
            setCurrentSession(null);
          } else {
            const unitFromResponse = response.data.unit || {};
            const unitName = unitFromResponse.name || (units.find(u => u._id === response.data.unit)?.name) || "Unknown Unit";
            setCurrentSession({
              ...response.data,
              unit: { name: unitName },
              startSession: validStartTime,
              endSession: validEndTime
            });
            setQrData(response.data.qrCode);
          }
        } else {
          setCurrentSession(null);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        message.error(error.response?.data?.message || "Failed to fetch session.");
        setCurrentSession(null);
      } finally {
        setLoadingSessionData(false);
      }
    };
    fetchCurrentSession();
  }, [selectedUnit, units]);

  const handleViewAttendance = useCallback(async () => {
    if (!selectedUnit || !currentSession || currentSession.ended) return;
    try {
      setLoading(prev => ({ ...prev, attendance: true, stats: true }));
      const data = await getSessionAttendance(currentSession._id);
      setAttendance(data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      message.error(error.message || 'Failed to fetch attendance data');
      setAttendance([]);
    } finally {
      setLoading(prev => ({ ...prev, attendance: false, stats: false }));
    }
  }, [selectedUnit, currentSession]);

  useEffect(() => {
    if (currentSession && selectedUnit && !currentSession.ended) {
      handleViewAttendance();
    }
  }, [currentSession, selectedUnit, handleViewAttendance]);

  const filterOptions = useMemo(() => {
    const departments = new Set();
    const courses = new Set();
    const years = new Set();
    const semesters = new Set();
    units.forEach(unit => {
      if (unit.department?.name) departments.add(unit.department.name);
      if (unit.course?.name) courses.add(unit.course.name);
      if (unit.year) years.add(unit.year);
      if (unit.semester) semesters.add(unit.semester);
    });
    return {
      departments: Array.from(departments).sort(),
      courses: Array.from(courses).sort(),
      years: Array.from(years).sort((a, b) => a - b),
      semesters: Array.from(semesters).sort((a, b) => a - b)
    };
  }, [units]);

  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      const departmentMatch = !unitFilters.department || unit.department?.name === unitFilters.department;
      const courseMatch = !unitFilters.course || unit.course?.name === unitFilters.course;
      const yearMatch = !unitFilters.year || unit.year === unitFilters.year;
      const semesterMatch = !unitFilters.semester || unit.semester === unitFilters.semester;
      return departmentMatch && courseMatch && yearMatch && semesterMatch;
    });
  }, [units, unitFilters]);

  const processedAttendance = useMemo(() => {
    if (!selectedUnit || !Array.isArray(attendance)) return [];
    return attendance.filter(a => a.unit === selectedUnit);
  }, [attendance, selectedUnit]);

  const filteredAttendance = useMemo(() => {
    return processedAttendance.filter(record => {
      const searchMatch = record.regNo.toLowerCase().includes(filters.search.toLowerCase());
      const yearMatch = filters.year ? record.year === filters.year : true;
      const semesterMatch = filters.semester ? record.semester === filters.semester : true;
      const statusMatch = filters.status ? record.status === filters.status : true;
      return searchMatch && yearMatch && semesterMatch && statusMatch;
    });
  }, [processedAttendance, filters]);

  const handleDepartmentChange = (value) => {
    setUnitFilters(prevState => ({ ...prevState, department: value }));
  };

  const handleCreateSession = async () => {
    if (!selectedUnit) {
      message.error('Please select a unit first');
      return;
    }
    try {
      setLoading(prevState => ({ ...prevState, session: true }));
      setLoadingSessionData(true);
      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const data = await createSession({ unitId: selectedUnit, lecturerId, startTime, endTime });
      const validStartTime = data.startTime ? new Date(data.startTime) : new Date();
      const validEndTime = data.endTime ? new Date(data.endTime) : new Date(Date.now() + 60 * 60 * 1000);
      if (isNaN(validStartTime.getTime()) || isNaN(validEndTime.getTime())) {
        throw new Error('Invalid session times received from API');
      }
      message.success('Session created successfully');
      setCurrentSession({ ...data, startSession: validStartTime, endSession: validEndTime, ended: false });
      setQrData(data.qrCode);
    } catch (error) {
      console.error("Error creating session:", error);
      message.error(error.message || 'Failed to create session');
    } finally {
      setLoading(prevState => ({ ...prevState, session: false }));
      setLoadingSessionData(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!selectedUnit || !currentSession || currentSession.ended) {
      message.error('Please select a unit and ensure an active session exists');
      return;
    }
    try {
      setLoading(prevState => ({ ...prevState, qr: true }));
      const token = localStorage.getItem('token');
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
      message.error(error.message || "Failed to generate QR code");
    } finally {
      setLoading(prevState => ({ ...prevState, qr: false }));
    }
  };

  const handleEndSession = async () => {
    if (!currentSession) return;
    try {
      setLoading(prevState => ({ ...prevState, session: true }));
      const token = localStorage.getItem('token');
      Modal.confirm({
        title: 'Are you sure you want to end this session?',
        content: 'This action cannot be undone.',
        okText: 'End Session',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: async () => {
          try {
            if (!currentSession?._id) {
              throw new Error('Invalid session ID');
            }
            console.log('Ending session with ID:', currentSession._id);
            const response = await axios.delete(
              'https://attendance-system-w70n.onrender.com/api/sessions/end',
              {
                data: { sessionId: currentSession._id },
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );
            console.log('Session end response:', response.data);
            message.success('Session ended successfully');
            setCurrentSession(prev => ({ ...prev, ended: true }));
            setQrData('');
            setAttendance([]);
            localStorage.removeItem('currentSession');
          } catch (error) {
            console.error('Error ending session:', {
              message: error.message,
              response: error.response?.data,
              sessionId: currentSession?._id
            });
            message.error(error.response?.data?.message || 'Failed to end session. Please check console for details.');
          } finally {
            setLoading(prevState => ({ ...prevState, session: false }));
          }
        }
      });
    } catch {
      message.error('An unexpected error occurred');
      setLoading(prevState => ({ ...prevState, session: false }));
    }
  };

  const handleToggleStatus = async (recordId) => {
    const record = processedAttendance.find(r => r._id === recordId);
    if (!record) return;
    const newStatus = record.status === 'present' ? 'absent' : 'present';
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://attendance-system-w70n.onrender.com/api/attendance/${recordId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttendance(prevState =>
        prevState.map(a =>
          a._id === recordId && a.unit === selectedUnit ? { ...a, status: newStatus } : a
        )
      );
      message.success(`Marked student as ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      message.error('Failed to update attendance status');
    }
  };

  const columns = [
    { title: 'Reg Number', dataIndex: 'regNo', key: 'regNo', sorter: (a, b) => a.regNo.localeCompare(b.regNo) },
    { title: 'Course', dataIndex: 'course', key: 'course', sorter: (a, b) => a.course.localeCompare(b.course) },
    { title: 'Year', dataIndex: 'year', key: 'year', render: year => <Tag color="blue">Year {year}</Tag>, sorter: (a, b) => a.year - b.year },
    { title: 'Semester', dataIndex: 'semester', key: 'semester', render: semester => <Tag color="geekblue">Semester {semester}</Tag>, sorter: (a, b) => a.semester - b.semester },
    { title: 'Status', dataIndex: 'status', key: 'status', render: status => <Tag color={status === 'present' ? 'green' : 'volcano'}>{status.toUpperCase()}</Tag>, filters: [{ text: 'Present', value: 'present' }, { text: 'Absent', value: 'absent' }], onFilter: (value, record) => record.status === value },
    { title: 'Action', key: 'action', render: (_, record) => (
      <Button type="link" onClick={() => handleToggleStatus(record._id)} icon={<SyncOutlined />} disabled={currentSession?.ended}>
        Toggle Status
      </Button>
    )}
  ];

  const totalAssignedUnits = useMemo(() => units.length, [units]);
  const { attendanceRate, totalEnrolledStudents } = useMemo(() => {
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const totalStudents = attendance.length || 1;
    return {
      attendanceRate: totalStudents > 0 ? Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0,
      totalEnrolledStudents: attendance.length
    };
  }, [attendance]);

  const summaryCards = (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={8}>
        <Card hoverable>
          <Statistic
            title="Assigned Units"
            value={totalAssignedUnits}
            prefix={<TeamOutlined />}
            loading={loading.stats}
            valueStyle={{ color: '#3f8600', fontSize: '24px' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card hoverable>
          <Statistic
            title="Attendance Rate"
            value={attendanceRate}
            suffix="%"
            prefix={<PercentageOutlined />}
            loading={loading.stats}
            valueStyle={{ color: '#cf1322', fontSize: '24px' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card hoverable>
          <Statistic
            title="Total no of scans"
            value={totalEnrolledStudents}
            prefix={<ScheduleOutlined />}
            loading={loading.stats}
            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
          />
        </Card>
      </Col>
    </Row>
  );

  const formatSessionTime = (session) => {
    if (!session || !session.startSession || !session.endSession) return 'No session time available';
    try {
      const startTime = new Date(session.startSession);
      const endTime = new Date(session.endSession);
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return 'Invalid session time';
      const options = { hour: 'numeric', minute: '2-digit', hour12: true };
      return `${startTime.toLocaleTimeString([], options)} - ${endTime.toLocaleTimeString([], options)}`;
    } catch (error) {
      console.error('Error formatting session time:', error);
      return 'Error formatting time';
    }
  };

  const clearFilters = () => {
    setUnitFilters({ department: null, course: null, year: null, semester: null });
    setFilters({ search: '', year: null, semester: null, status: null });
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
        if (!isNaN(endTime)) {
          setTimeLeft(Math.max(0, endTime - Date.now()));
        }
      }, 1000);
      return () => clearInterval(timer);
    }, [end]);
    const formatTime = (ms) => {
      if (isNaN(ms) || ms < 0) return '0m 0s';
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    };
    return (
      <div style={{ marginTop: 16 }}>
        <Tag icon={<ClockCircleOutlined />} color="processing">
          Time Remaining: {formatTime(timeLeft)}
        </Tag>
      </div>
    );
  };

  SessionTimer.propTypes = {
    end: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired
  };

  return (
    <div style={{ padding: screens.md ? 24 : 16 }}>
      {loadingSessionData ? (
        <Card loading style={{ marginBottom: 24 }}><Skeleton active /></Card>
      ) : currentSession && currentSession.startSession && currentSession.endSession && !currentSession.ended ? (
        <Card
          title={<Space><ClockCircleOutlined /> Active Session: {currentSession.unit?.name || 'Unknown Unit'}</Space>}
          style={{ marginBottom: 24, backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={24}><Text strong>Time: </Text>{formatSessionTime(currentSession)}</Col>
            <Col span={24}><SessionTimer end={currentSession.endSession} /></Col>
            <Col span={24}><Button danger onClick={handleEndSession} loading={loading.session}>End Session Early</Button></Col>
          </Row>
        </Card>
      ) : null}

      <Card
        title={<Title level={4} style={{ margin: 0 }}>Attendance Management</Title>}
        extra={
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={() => downloadAttendanceReport(selectedUnit)} disabled={!selectedUnit}>
              {screens.md ? 'Download Report' : 'Export'}
            </Button>
            <Button
              type="primary"
              icon={<QrcodeOutlined />}
              onClick={handleGenerateQR}
              disabled={!selectedUnit || !currentSession || currentSession?.ended}
              loading={loading.qr}
            >
              {screens.md ? 'Generate QR Code' : 'QR Code'}
            </Button>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={handleCreateSession}
              disabled={loading.session || (currentSession && !currentSession.ended)}
            >
              {loading.session ? 'Creating...' : 'Create Attendance Session'}
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card
            title="Real-time Unit Filters"
            size="small"
            extra={<Button type="link" onClick={clearFilters} disabled={!Object.values(unitFilters).some(Boolean)}>Clear Filters</Button>}
          >
            <Form layout={screens.md ? 'inline' : 'vertical'}>
              <Form.Item label="Department">
                <Select
                  placeholder="Select Department"
                  style={{ width: 160 }}
                  onChange={handleDepartmentChange}
                  allowClear
                  value={unitFilters.department}
                >
                  {departments.map(department => (
                    <Option key={department._id} value={department.name}>{department.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Course">
                <Select
                  placeholder="Course"
                  style={{ width: 180 }}
                  onChange={val => setUnitFilters(prev => ({ ...prev, course: val }))}
                  allowClear
                  value={unitFilters.course}
                >
                  {filterOptions.courses.map(course => (
                    <Option key={course} value={course}>{course}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Year">
                <Select
                  placeholder="Year"
                  style={{ width: 120 }}
                  onChange={val => setUnitFilters(prev => ({ ...prev, year: val }))}
                  allowClear
                  value={unitFilters.year}
                >
                  {filterOptions.years.map(year => (
                    <Option key={year} value={year}>Year {year}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Semester">
                <Select
                  placeholder="Semester"
                  style={{ width: 140 }}
                  onChange={val => setUnitFilters(prev => ({ ...prev, semester: val }))}
                  allowClear
                  value={unitFilters.semester}
                >
                  {filterOptions.semesters.map(sem => (
                    <Option key={sem} value={sem}>Sem {sem}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Card>

          <Space wrap>
            <Select
              placeholder="Select Unit"
              style={{ width: 240 }}
              onChange={setSelectedUnit}
              value={selectedUnit}
              loading={loading.units}
            >
              {filteredUnits.map(unit => (
                <Option key={unit._id} value={unit._id}>
                  <Space>
                    <BookOutlined />
                    {unit.name}
                    <Tag color="blue">{unit.code}</Tag>
                  </Space>
                </Option>
              ))}
            </Select>
            <Button
              onClick={handleViewAttendance}
              loading={loading.attendance}
              disabled={!selectedUnit || !currentSession || currentSession?.ended}
              type="primary"
            >
              Refresh Attendance Data
            </Button>
          </Space>

          {summaryCards}

          <Card
            title={
              <Space>
                Attendance Records Filter
                {currentSession && !currentSession.ended && <Tag color="green">Active Session</Tag>}
              </Space>
            }
            size="small"
          >
            <Form layout={screens.md ? 'inline' : 'vertical'}>
              <Form.Item label="Search Reg Number">
                <Input
                  placeholder="Search by Reg Number"
                  prefix={<SearchOutlined />}
                  style={{ width: 240 }}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  allowClear
                />
              </Form.Item>
              <Form.Item label="Year">
                <Select
                  placeholder="Filter by Year"
                  allowClear
                  suffixIcon={<CalendarOutlined />}
                  style={{ width: 150 }}
                  onChange={year => setFilters(prev => ({ ...prev, year }))}
                  value={filters.year}
                >
                  {[1, 2, 3, 4].map(year => (
                    <Option key={year} value={year}>Year {year}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Semester">
                <Select
                  placeholder="Filter by Semester"
                  allowClear
                  suffixIcon={<BookOutlined />}
                  style={{ width: 170 }}
                  onChange={semester => setFilters(prev => ({ ...prev, semester }))}
                  value={filters.semester}
                >
                  {[1, 2, 3].map(sem => (
                    <Option key={sem} value={sem}>Semester {sem}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Status">
                <Select
                  placeholder="Filter by Status"
                  allowClear
                  suffixIcon={<FilterOutlined />}
                  style={{ width: 150 }}
                  onChange={status => setFilters(prev => ({ ...prev, status }))}
                  value={filters.status}
                >
                  <Option value="present">Present</Option>
                  <Option value="absent">Absent</Option>
                </Select>
              </Form.Item>
            </Form>
          </Card>

          <Skeleton active loading={loading.attendance}>
            <Table
              columns={columns}
              dataSource={filteredAttendance}
              rowKey="_id"
              scroll={{ x: true }}
              pagination={{ pageSize: 8, responsive: true, showSizeChanger: false, showTotal: total => `Total ${total} students` }}
              locale={{ emptyText: 'No attendance records found' }}
              bordered
              size="middle"
              rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
            />
          </Skeleton>
        </Space>
      </Card>

      <Modal
        title="Class QR Code"
        open={isQRModalOpen}
        centered
        onCancel={() => {
          Modal.confirm({
            title: 'Are you sure you want to close?',
            content: 'The QR code will no longer be accessible.',
            okText: 'Yes',
            cancelText: 'No',
            onOk() { setIsQRModalOpen(false); }
          });
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              Modal.confirm({
                title: 'Are you sure you want to close?',
                content: 'The QR code will no longer be accessible.',
                okText: 'Yes',
                cancelText: 'No',
                onOk() { setIsQRModalOpen(false); }
              });
            }}
          >
            Close
          </Button>
        ]}
        destroyOnClose
        maskClosable={false}
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          {qrData ? (
            <>
              <img
                src={qrData}
                alt="Attendance QR Code"
                style={{ width: "100%", maxWidth: 300, margin: "0 auto", display: "block", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
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
    </div>
  );
};

export default AttendanceManagement;