import { useState, useEffect, useMemo, useCallback } from 'react';

import {
  Button, Table, Modal, Select, Input, Space, Card, Tag, Skeleton, message, Grid, Typography, Statistic, Row, Col
} from 'antd';

import {
  QrcodeOutlined, DownloadOutlined, SearchOutlined, FilterOutlined, CalendarOutlined, BookOutlined, TeamOutlined, PercentageOutlined, ScheduleOutlined, SyncOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  getAttendanceData, downloadAttendanceReport, getLecturerUnits, getDepartments, detectCurrentSession, createSession
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
  const [currentSession, setCurrentSession] = useState(null);
  const [anomalies] = useState([]);
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

  // Fetch departments
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

  // Manual session detection
  const checkCurrentSession = useCallback(async () => {
    try {
      setLoading(prevState => ({ ...prevState, session: true }));
      setLoadingSessionData(true);
      const { data } = await detectCurrentSession(lecturerId);

      if (data) {
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
        setQrData(data.qrToken);
      }
    } catch (error) {
      console.error("Error checking current session:", error);
      message.error(error.message || 'Failed to detect current session');
    } finally {
      setLoading(prevState => ({ ...prevState, session: false }));
      setLoadingSessionData(false);
    }
  }, [lecturerId]);

  // Check session on component mount
  useEffect(() => {
    checkCurrentSession();
  }, [lecturerId, checkCurrentSession]);

  // Continuously update session time
  useEffect(() => {
    let intervalId;

    if (currentSession && currentSession.startSession && currentSession.endSession) {
      intervalId = setInterval(() => {
        setCurrentSession(prevState => ({
          ...prevState,
          startSession: new Date(prevState.startSession),
          endSession: new Date(prevState.endSession)
        }));
      }, 60000); // Check every minute

      return () => clearInterval(intervalId);
    }
  }, [currentSession]);

  // Existing filter options calculation
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

  // Preserved unit filtering logic
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      const departmentMatch = !unitFilters.department ||
        unit.department?.name === unitFilters.department;
      const courseMatch = !unitFilters.course ||
        unit.course?.name === unitFilters.course;
      const yearMatch = !unitFilters.year || unit.year === unitFilters.year;
      const semesterMatch = !unitFilters.semester ||
        unit.semester === unitFilters.semester;

      return departmentMatch && courseMatch && yearMatch && semesterMatch;
    });
  }, [units, unitFilters]);

  // Original data fetching useEffect
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!lecturerId) {
          message.error("User session expired");
          return;
        }

        setLoading(prevState => ({ ...prevState, units: true }));
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
        setLoading(prevState => ({ ...prevState, units: false }));
      }
    };

    if (lecturerId) fetchData();
  }, [lecturerId]);

  useEffect(() => {
    setLoadingSessionData(true);
    const fetchCurrentSession = async () => {
      if (!selectedUnit || typeof selectedUnit !== 'string') {
        console.log("Invalid or no selected unit:", selectedUnit);
        setLoadingSessionData(false);
        setCurrentSession(null);
        return;
      }
  
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found in localStorage");
        message.error("Authentication token missing. Please log in again.");
        setLoadingSessionData(false);
        return;
      }
  
      try {
        console.log("Fetching session for unit:", selectedUnit);
        const response = await axios.get(`https://attendance-system-w70n.onrender.com/api/sessions/current/${selectedUnit}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          validateStatus: function (status) {
            return status >= 200 && status < 300; // Only consider 2xx as success
          }
        });
  
        console.log("Full API response for current session:", response.data);
  
        if (response.data && response.data._id) {
          const validStartTime = response.data.startTime ? new Date(response.data.startTime) : null;
          const validEndTime = response.data.endTime ? new Date(response.data.endTime) : null;
  
          if (!validStartTime || !validEndTime || isNaN(validStartTime.getTime()) || isNaN(validEndTime.getTime())) {
            message.warning("Invalid session times received. Setting defaults.");
            setCurrentSession(null);
            return;
          }
  
          // Handle unit field
          const unitFromResponse = response.data.unit || {};
          const unitName = unitFromResponse.name || (units.find(u => u._id === response.data.unit)?.name) || "Unknown Unit";
  
          setCurrentSession({
            ...response.data,
            unit: { name: unitName },
            startSession: validStartTime,
            endSession: validEndTime
          });
        } else {
          message.warning("No active session found.");
          setCurrentSession(null);
        }
      } catch (error) {
        if (error.response) {
          console.error("Server error:", error.response.status, error.response.data);
          message.error(`Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
        } else if (error.request) {
          console.error("Network error:", error.request);
          message.error("Network error: Unable to connect to the server. Please check your internet connection.");
        } else {
          console.error("Request setup error:", error.message);
          message.error("Request failed: " + error.message);
        }
        setCurrentSession(null);
      } finally {
        setLoadingSessionData(false);
      }
    };
  
    fetchCurrentSession();
  }, [selectedUnit, units]); // Added units as dependency to ensure it’s available
  // Handle department filter change
  const handleDepartmentChange = (value) => {
    setUnitFilters(prevState => {
      const newFilters = { ...prevState, department: value };
      return newFilters;
    });
  };

  // Create session functionality
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

      console.log("Creating session with:", { startTime, endTime });

      const data = await createSession({ unitId: selectedUnit, lecturerId, startTime, endTime });

      const validStartTime = data.startTime ? new Date(data.startTime) : new Date();
      const validEndTime = data.endTime ? new Date(data.endTime) : new Date(Date.now() + 60 * 60 * 1000);

      if (isNaN(validStartTime.getTime()) || isNaN(validEndTime.getTime())) {
        throw new Error('Invalid session times received from API');
      }

      message.success('Session created successfully');

      setCurrentSession({ 
        ...data, 
        startSession: validStartTime, 
        endSession: validEndTime 
      });
      setQrData(data.qrToken);

    } catch (error) {
      console.error("Error creating session:", error);
      message.error(error.message || 'Failed to create session');
    } finally {
      setLoading(prevState => ({ ...prevState, session: false }));
      setLoadingSessionData(false);
    }
  };

  // Preserved selected unit update logic
  useEffect(() => {
    if (filteredUnits.length > 0 && !filteredUnits.some(u => u._id === selectedUnit)) {
      setSelectedUnit(filteredUnits[0]._id);
    }
  }, [filteredUnits, selectedUnit]);

  // Existing statistics calculation
  const totalAssignedUnits = useMemo(() => units.length, [units]);

  const { attendanceRate, totalEnrolledStudents } = useMemo(() => {
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const totalStudents = attendance.length || 1;
    return {
      attendanceRate: totalStudents > 0 ?
        Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0,
      totalEnrolledStudents: attendance.length
    };
  }, [attendance]);

  // Original attendance processing
  const processedAttendance = useMemo(() => {
    if (!selectedUnit || !Array.isArray(attendance)) return [];

    return attendance
      .filter(a => a?.unit === selectedUnit)
      .map(record => ({
        ...record,
        student: `${record.firstName} ${record.lastName}`,
        course: record.course?.name || 'N/A',
        isAnomaly: record.deviceChanges > 2
      }));
  }, [attendance, selectedUnit]);

  // Preserved filtering logic
  const filteredAttendance = useMemo(() => {
    return processedAttendance.filter(record => {
      const searchMatch = record.student.toLowerCase().includes(filters.search.toLowerCase());
      const yearMatch = filters.year ? record.year === filters.year : true;
      const semesterMatch = filters.semester ? record.semester === filters.semester : true;
      const statusMatch = filters.status ? record.status === filters.status : true;

      return searchMatch && yearMatch && semesterMatch && statusMatch;
    });
  }, [processedAttendance, filters]);

  const handleGenerateQR = async () => {
    if (!selectedUnit) {
      message.error('Please select a unit first');
      return;
    }

    try {
      setLoading(prevState => ({ ...prevState, qr: true }));
      const token = localStorage.getItem('token');
      const { data } = await axios.get("https://attendance-system-w70n.onrender.com/api/sessions/current", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("QR Code API Response:", data);

      if (!data || !data.qrCode.startsWith("data:image/png;base64")) {
        throw new Error("QR Code data is missing or invalid!");
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

  // End session functionality
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
            await axios.delete(
              'https://attendance-system-w70n.onrender.com/api/sessions/end',
              {
                data: { sessionId: currentSession._id },
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );

            message.success('Session ended successfully');
            setCurrentSession(prevState => ({ ...prevState, ended: true }));
            setQrData('');

            handleViewAttendance();
          } catch (error) {
            message.error(error.response?.data?.message || 'Failed to end session');
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

  // Preserved attendance data fetching
  const handleViewAttendance = async () => {
    if (!selectedUnit) return;

    try {
      setLoading(prevState => ({ ...prevState, attendance: true, stats: true }));
      const { data } = await getAttendanceData(selectedUnit);
      setAttendance(Array.isArray(data) ? data : []);
    } catch {
      message.error('Failed to fetch attendance data');
    } finally {
      setLoading(prevState => ({ ...prevState, attendance: false, stats: false }));
    }
  };

  // Original status toggle functionality
  const handleToggleStatus = async (recordId) => {
    const record = processedAttendance.find(r => r._id === recordId);
    if (!record) return;

    const newStatus = record.status === 'present' ? 'absent' : 'present';

    try {
      setAttendance(prevState => {
        const index = prevState.findIndex(a => a._id === recordId && a.unit === selectedUnit);
        if (index !== -1) {
          const updatedRecord = { ...prevState[index], status: newStatus };
          return [
            ...prevState.slice(0, index),
            updatedRecord,
            ...prevState.slice(index + 1)
          ];
        }
        return [...prevState, { ...record, status: newStatus }];
      });
      message.success(`Marked student as ${newStatus}`);
    } catch {
      message.error('Failed to update attendance status');
    }
  };

  const formatSessionTime = (session) => {
    if (!session || !session.startSession || !session.endSession) return 'No session time available';

    try {
      const startTime = new Date(session.startSession);
      const endTime = new Date(session.endSession);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return 'Invalid session time';
      }

      const options = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };

      return `
        ${startTime.toLocaleTimeString([], options)} - 
        ${endTime.toLocaleTimeString([], options)}
      `;
    } catch (error) {
      console.error('Error formatting session time:', error);
      return 'Error formatting time';
    }
  };

  // Preserved filter clearing
  const clearFilters = () => {
    setUnitFilters(prevState => {
      const newFilters = {
        department: null,
        course: null,
        year: null,
        semester: null
      };
      return newFilters;
    });
    setFilters(prevState => {
      const newFilters = {
        search: '',
        year: null,
        semester: null,
        status: null
      };
      return newFilters;
    });
  };

  // Existing table columns configuration
  const columns = [
    {
      title: 'Student',
      dataIndex: 'student',
      key: 'student',
      responsive: ['md'],
      sorter: (a, b) => a.student.localeCompare(b.student)
    },
    {
      title: 'Reg Number',
      dataIndex: 'regNo',
      key: 'regNo',
      responsive: ['md'],
      sorter: (a, b) => a.regNo.localeCompare(b.regNo)
    },
    {
      title: 'Course',
      dataIndex: 'course',
      key: 'course',
      responsive: ['lg'],
      sorter: (a, b) => a.course.localeCompare(b.course)
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      render: year => <Tag color="blue">Year {year}</Tag>,
      responsive: ['sm'],
      sorter: (a, b) => a.year - b.year
    },
    {
      title: 'Semester',
      dataIndex: 'semester',
      key: 'semester',
      render: semester => <Tag color="geekblue">Semester {semester}</Tag>,
      sorter: (a, b) => a.semester - b.semester
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag color={status === 'present' ? 'green' : 'volcano'}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Present', value: 'present' },
        { text: 'Absent', value: 'absent' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => handleToggleStatus(record._id)}
          icon={<SyncOutlined />}
        >
          Toggle Status
        </Button>
      )
    }
  ];

  // Summary cards
  const summaryCards = (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Assigned Units"
            value={totalAssignedUnits}
            prefix={<TeamOutlined />}
            loading={loading.stats}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Attendance Rate"
            value={attendanceRate}
            suffix="%"
            prefix={<PercentageOutlined />}
            loading={loading.stats}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Enrolled Students"
            value={totalEnrolledStudents}
            prefix={<ScheduleOutlined />}
            loading={loading.stats}
          />
        </Card>
      </Col>
    </Row>
  );

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
          setTimeLeft(prev => Math.max(0, endTime - Date.now()));
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

    SessionTimer.propTypes = {
      end: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired
    };

    return (
      <div style={{ marginTop: 16 }}>
        <Tag icon={<ClockCircleOutlined />} color="processing">
          Time Remaining: {formatTime(timeLeft)}
        </Tag>
      </div>
    );
  };

  // Anomaly Detection Table
  const AnomalyTable = () => (
    <Card title="Suspicious Activity" style={{ marginTop: 24 }}>
      <Table
        columns={[
          { title: 'Student', dataIndex: 'studentName' },
          { title: 'Device Changes', dataIndex: 'deviceChanges' },
          { title: 'Last Activity', dataIndex: 'lastSeen' }
        ]}
        dataSource={anomalies}
        rowKey="studentId"
        pagination={false}
      />
    </Card>
  );

  return (
    <div style={{ padding: screens.md ? 24 : 16 }}>
      {loadingSessionData ? (
        <Card loading style={{ marginBottom: 24 }}>
          <Skeleton active />
        </Card>
      ) : currentSession && currentSession.startSession && currentSession.endSession && !isNaN(new Date(currentSession.startSession).getTime()) && !isNaN(new Date(currentSession.endSession).getTime()) && !currentSession.ended ? (
        <Card
          title={
            <Space>
              <ClockCircleOutlined />
              Active Session: {currentSession.unit?.name || 'Unknown Unit'}
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Text strong>Time: </Text>
              {formatSessionTime(currentSession) || 'Loading time...'}
            </Col>
            <Col span={24}>
              <SessionTimer
                end={currentSession.endSession}
              />
            </Col>
            <Col span={24}>
              <Button
                danger
                onClick={handleEndSession}
                loading={loading.session}
              >
                End Session Early
              </Button>
            </Col>
          </Row>
        </Card>
      ) : null}

      <Card
        title={<Title level={4} style={{ margin: 0 }}>Attendance Management</Title>}
        extra={
          <Space wrap>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => downloadAttendanceReport(selectedUnit)}
              disabled={!selectedUnit}
            >
              {screens.md ? 'Download Report' : 'Export'}
            </Button>
            <Button
              type="primary"
              icon={<QrcodeOutlined />}
              onClick={handleGenerateQR}
              disabled={!selectedUnit}
              loading={loading.qr}
            >
              {screens.md ? 'Generate QR Code' : 'QR Code'}
            </Button>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={handleCreateSession}
              disabled={loading.session}
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
            extra={
              <Button
                type="link"
                onClick={clearFilters}
                disabled={!Object.values(unitFilters).some(Boolean)}
              >
                Clear Filters
              </Button>
            }
          >
          </Card>
          <Space wrap style={{ width: '100%' }}>
            <Select
              placeholder="Select Department"
              style={{ width: 160 }}
              onChange={handleDepartmentChange}
              allowClear
              value={unitFilters.department}
            >
              {departments.map(department => (
                <Option key={department._id} value={department.name}>
                  {department.name}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Course"
              style={{ width: 180 }}
              onChange={val => setUnitFilters(prevState => {
                const newFilters = { ...prevState, course: val };
                return newFilters;
              })}
              allowClear
              value={unitFilters.course}
            >
              {filterOptions.courses.map(course => (
                <Option key={course} value={course}>{course}</Option>
              ))}
            </Select>

            <Select
              placeholder="Year"
              style={{ width: 120 }}
              onChange={val => setUnitFilters(prevState => {
                const newFilters = { ...prevState, year: val };
                return newFilters;
              })}
              allowClear
              value={unitFilters.year}
            >
              {filterOptions.years.map(year => (
                <Option key={year} value={year}>Year {year}</Option>
              ))}
            </Select>

            <Select
              placeholder="Semester"
              style={{ width: 140 }}
              onChange={val => setUnitFilters(prevState => {
                const newFilters = { ...prevState, semester: val };
                return newFilters;
              })}
              allowClear
              value={unitFilters.semester}
            >
              {filterOptions.semesters.map(sem => (
                <Option key={sem} value={sem}>Sem {sem}</Option>
              ))}
            </Select>
          </Space>
          <Space wrap>
            <Select
              placeholder="Select Unit"
              style={{ width: 240 }}
              onChange={setSelectedUnit}
              value={selectedUnit}
              loading={loading.units}
              optionLabelProp="label"
              options={filteredUnits.map(unit => ({
                label: (
                  <Space>
                    <BookOutlined />
                    {unit.name}
                    <Tag color="blue">{unit.code}</Tag>
                  </Space>
                ),
                value: unit._id
              }))}
            />
            <Button
              onClick={handleViewAttendance}
              loading={loading.attendance}
              disabled={!selectedUnit}
              type="primary"
            >
              Refresh Attendance Data
            </Button>
          </Space>

          {summaryCards}

          <Card title="Attendance Records Filter" size="small">
            <Space wrap style={{ width: '100%' }}>
              <Input
                placeholder="Search students..."
                prefix={<SearchOutlined />}
                style={{ width: 240 }}
                onChange={e => setFilters(prevState => ({
                  ...prevState,
                  search: e.target.value
                }))}
                allowClear
              />

              <Select
                placeholder="Filter by Year"
                allowClear
                suffixIcon={<CalendarOutlined />}
                style={{ width: 150 }}
                onChange={year => setFilters(prevState => ({
                  ...prevState,
                  year
                }))}
                value={filters.year}
              >
                {[1, 2, 3, 4].map(year => (
                  <Option key={year} value={year}>Year {year}</Option>
                ))}
              </Select>

              <Select
                placeholder="Filter by Semester"
                allowClear
                suffixIcon={<BookOutlined />}
                style={{ width: 170 }}
                onChange={semester => setFilters(prevState => ({
                  ...prevState,
                  semester
                }))}
                value={filters.semester}
              >
                {[1, 2, 3].map(sem => (
                  <Option key={sem} value={sem}>Semester {sem}</Option>
                ))}
              </Select>

              <Select
                placeholder="Filter by Status"
                allowClear
                suffixIcon={<FilterOutlined />}
                style={{ width: 150 }}
                onChange={status => setFilters(prevState => ({
                  ...prevState,
                  status
                }))}
                value={filters.status}
              >
                <Option value="present">Present</Option>
                <Option value="absent">Absent</Option>
              </Select>
            </Space>
          </Card>

          <Skeleton active loading={loading.attendance}>
            <Table
              columns={columns}
              dataSource={filteredAttendance}
              rowKey="_id"
              scroll={{ x: true }}
              pagination={{
                pageSize: 8,
                responsive: true,
                showSizeChanger: false,
                showTotal: (total) => `Total ${total} students`
              }}
              locale={{
                emptyText: 'No attendance records found'
              }}
              bordered
              size="middle"
            />
          </Skeleton>

          {anomalies.length > 0 && <AnomalyTable />}
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
            onOk() {
              setIsQRModalOpen(false);
            }
          });
        }}
        footer={[
          <Button
            key="copy"
            type="primary"
            onClick={() => {
              navigator.clipboard.writeText(qrData);
              message.success('QR data copied to clipboard!');
            }}
          >
            Copy QR Data
          </Button>,
          <Button key="close" onClick={() => {
            Modal.confirm({
              title: 'Are you sure you want to close?',
              content: 'The QR code will no longer be accessible.',
              okText: 'Yes',
              cancelText: 'No',
              onOk() {
                setIsQRModalOpen(false);
              }
            });
          }}>
            Close
          </Button>,
        ]}
        destroyOnClose
        maskClosable={false}
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          {qrData ? (
            <>
              <img
                src={qrData.startsWith("data:image/png;base64,") ? qrData : ""}
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
              {currentSession && (
                <SessionTimer
                  end={currentSession.endSession}
                />
              )}
              <Typography.Text
                type="secondary"
                style={{ marginTop: 16, display: "block", fontSize: 16 }}
              >
                Scan this QR code to mark attendance.
              </Typography.Text>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 24 }}>
              <Typography.Text type="danger">
                Failed to generate QR Code
              </Typography.Text>
              <Skeleton.Image style={{ width: 300, height: 300 }} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceManagement;