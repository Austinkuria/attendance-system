import { useState, useEffect, useMemo } from 'react';
import {
  Button,Table,Modal,Select,Input,Space,Card,Tag,Skeleton,message,Grid,Typography,Statistic,Row,Col,Badge,
  // Alert
} from 'antd';
import {
  QrcodeOutlined,DownloadOutlined,SearchOutlined,FilterOutlined,CalendarOutlined,BookOutlined,TeamOutlined,PercentageOutlined,ScheduleOutlined,SyncOutlined,ClockCircleOutlined
} from '@ant-design/icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  generateQRCode,getAttendanceData,downloadAttendanceReport,getLecturerUnits,detectCurrentSession,createAttendanceSession,
  // submitAttendance
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
  const lecturerId = localStorage.getItem("userId");
  const [loading, setLoading] = useState({
    units: true,
    attendance: false,
    stats: false,
    qr: false,
    session: false
  });
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

  // Device fingerprint generation
  const getDeviceFingerprint = () => {
    const deviceData = [
      navigator.platform,
      navigator.userAgent,
      `${screen.width}x${screen.height}`,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency
    ].join('|');
    return btoa(unescape(encodeURIComponent(deviceData))).slice(0, 32);
  };

  // Automatic session detection
  useEffect(() => {
    const checkCurrentSession = async () => {
      try {
        setLoading(prev => ({ ...prev, session: true }));
        const { data } = await detectCurrentSession(lecturerId);
        if (data) {
          setCurrentSession(data);
          setQrData(data.qrToken);
        }
      } catch {
        message.error('Failed to detect current session');
      } finally {
        setLoading(prev => ({ ...prev, session: false }));
      }
    };

    const interval = setInterval(checkCurrentSession, 30000);
    checkCurrentSession();
    return () => clearInterval(interval);
  }, [lecturerId]);

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
    const fetchCurrentSession = async () => {
      try {
        const token = localStorage.getItem('token'); // Assuming the token is stored in localStorage
        const response = await axios.get('https://attendance-system-w70n.onrender.com/api/sessions/current', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCurrentSession(response.data);
      } catch (error) {
        console.error('Error fetching current session:', error.response ? error.response.data : error.message);
        message.error('Failed to fetch current session');
      }
    };

    fetchCurrentSession();
  }, []);

  
  // create session functionality
  const handleCreateSession = async () => {
    if (!selectedUnit) {
      message.error('Please select a unit first');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, session: true }));
      const data = await createAttendanceSession({
        unitId: selectedUnit,
        lecturerId,
        startTime: new Date(), // or any desired start time
        endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour session
      });
      message.success('Session created successfully');
      setCurrentSession(data);
      setQrData(data.qrToken); // Optional: you can generate the QR for this session too
    } catch {
      message.error('Failed to create session');
    } finally {
      setLoading(prev => ({ ...prev, session: false }));
    }
  };

  // Preserved selected unit update logic
  useEffect(() => {
    if (filteredUnits.length > 0 && !filteredUnits.some(u => u._id === selectedUnit)) {
      setSelectedUnit(filteredUnits[0]._id);
    }
  }, [filteredUnits, selectedUnit]);

  // Existing statistics calculation
  const { totalAssignedUnits, attendanceRate, totalEnrolledStudents } = useMemo(() => {
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const totalStudents = attendance.length || 1;
    return {
      totalAssignedUnits: units.length,
      attendanceRate: totalStudents > 0 ?
        Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0,
      totalEnrolledStudents: attendance.length
    };
  }, [units, attendance]);

  // Original attendance processing
  const processedAttendance = useMemo(() => {
    if (!selectedUnit) return [];

    return attendance
      .filter(a => a.unit === selectedUnit)
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

  // Enhanced QR generation with device fingerprint
  const handleGenerateQR = async () => {
    if (!selectedUnit) {
      message.error('Please select a unit first');
      return;
    }
  
    try {
      setLoading(prev => ({ ...prev, qr: true }));
      const { data } = await generateQRCode({
        unitId: selectedUnit,
        lecturerId,
        deviceFingerprint: getDeviceFingerprint()
      });
      console.log('QR Code generated:', data); // Add a log here to inspect the data
      setQrData(data.qrCode);
      setIsQRModalOpen(true);
    } catch (error) {
      console.error('Error generating QR code:', error); // Log any errors to console
      message.error('Failed to generate QR code');
    } finally {
      setLoading(prev => ({ ...prev, qr: false }));
    }
  };
  
  // End session functionality
  const handleEndSession = async () => {
    if (!currentSession) return;

    try {
      setLoading(prev => ({ ...prev, session: true }));
      const token = localStorage.getItem('token');
      await axios.post('https://attendance-system-w70n.onrender.com/api/sessions/end', {
        sessionId: currentSession._id
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setCurrentSession(null);
      setQrData('');
      message.success('Session ended successfully');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to end session');
    } finally {
      setLoading(prev => ({ ...prev, session: false }));
    }
  };

  // Preserved attendance data fetching
  const handleViewAttendance = async () => {
    if (!selectedUnit) return;

    try {
      setLoading(prev => ({ ...prev, attendance: true, stats: true }));
      const data = await getAttendanceData(selectedUnit);
      setAttendance(data);
    } catch {
      message.error('Failed to fetch attendance data');
    } finally {
      setLoading(prev => ({ ...prev, attendance: false, stats: false }));
    }
  };

  // Original status toggle functionality
  const handleToggleStatus = async (recordId) => {
    const record = processedAttendance.find(r => r._id === recordId);
    if (!record) return;

    const newStatus = record.status === 'present' ? 'absent' : 'present';

    try {
      setAttendance(prev => {
        const index = prev.findIndex(a => a._id === recordId && a.unit === selectedUnit);
        if (index !== -1) {
          const updatedRecord = { ...prev[index], status: newStatus };
          return [
            ...prev.slice(0, index),
            updatedRecord,
            ...prev.slice(index + 1)
          ];
        }
        return [...prev, { ...record, status: newStatus }];
      });
      message.success(`Marked student as ${newStatus}`);
    } catch {
      message.error('Failed to update attendance status');
    }
  };

// Add these validation helpers near the top of your component
const isSessionActive = (session) => {
  if (!session) return false;
  const now = new Date();
  return new Date(session.startTime) < now && now < new Date(session.endTime);
};

const formatSessionTime = (session) => {
  if (!session) return '';
  const options = { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  };
  return `
    ${new Date(session.startTime).toLocaleTimeString([], options)} - 
    ${new Date(session.endTime).toLocaleTimeString([], options)}
  `;
};

  // Preserved filter clearing
  const clearFilters = () => {
    setUnitFilters({
      department: null,
      course: null,
      year: null,
      semester: null
    });
    setFilters({
      search: '',
      year: null,
      semester: null,
      status: null
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

  // Session Timer Component
  const SessionTimer = ({ end }) => {
    const [timeLeft, setTimeLeft] = useState(Math.max(0, end - Date.now()));
    
    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    const formatTime = (ms) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    };
    SessionTimer.propTypes = {
      end: PropTypes.number.isRequired
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
      {/* Replace the current session card with this */}
{currentSession && isSessionActive(currentSession) && (
  <Card
    title={
      <Space>
        <ClockCircleOutlined />
        Active Session: {currentSession.unit?.name}
      </Space>
    }
    style={{ marginBottom: 24 }}
  >
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Text strong>Time: </Text>
        {formatSessionTime(currentSession)}
      </Col>
      <Col span={24}>
        <SessionTimer 
          end={new Date(currentSession.endTime).getTime()}
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
)}


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
             <Card
          title="Real-time Unit Filters"
          size="small"
          extra={
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={handleCreateSession}
              disabled={loading.session}
            >
              {loading.session ? 'Creating...' : 'Create Attendance Session'}
            </Button>
          }
        ></Card>
            <Space wrap style={{ width: '100%' }}>
              <Select
                placeholder="Department"
                style={{ width: 160 }}
                onChange={val => setUnitFilters(prev => ({ ...prev, department: val }))}
                allowClear
                value={unitFilters.department}
              >
                {filterOptions.departments.map(dept => (
                  <Option key={dept} value={dept}>
                    <Badge color="blue" text={dept} />
                  </Option>
                ))}
              </Select>

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
            </Space>
          </Card>

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
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                allowClear
              />

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
        onCancel={() => setIsQRModalOpen(false)}
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
          <Button key="close" onClick={() => setIsQRModalOpen(false)}>
            Close
          </Button>,
        ]}
        centered
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          {qrData ? (
            <>
              <img
                src={`data:image/png;base64,${qrData}`}
                alt="Attendance QR Code"
                style={{
                  width: '100%',
                  maxWidth: 300,
                  margin: '0 auto',
                  display: 'block',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              {currentSession && (
                <SessionTimer
                  start={new Date(currentSession.startTime).getTime()}
                  end={new Date(currentSession.endTime).getTime()}
                />
              )}
              <Typography.Text
                type="secondary"
                style={{ marginTop: 16, display: 'block', fontSize: 16 }}
              >
                Scan this QR code to mark attendance.
              </Typography.Text>
            </>
          ) : (
            <Skeleton.Image style={{ width: 300, height: 300 }} />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceManagement;