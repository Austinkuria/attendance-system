import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Table, Modal, Select, Input, Space, Card, Tag, Skeleton, message, Grid, Typography, Statistic, Row, Col, Spin, DatePicker } from 'antd';
import { QrcodeOutlined, DownloadOutlined, SearchOutlined, CalendarOutlined, BookOutlined, TeamOutlined, PercentageOutlined, ScheduleOutlined, SyncOutlined, ClockCircleOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import { getLecturerUnitAttendance, downloadAttendanceReport, getLecturerUnits, detectCurrentSession, createSession } from '../services/api';
import moment from 'moment';

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text } = Typography;

const AttendanceManagement = () => {
  const screens = useBreakpoint();
  const [attendance, setAttendance] = useState([]);
  const [realTimeAttendance, setRealTimeAttendance] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrData, setQrData] = useState('');
  const [currentSession, setCurrentSession] = useState(() => {
    const savedSession = localStorage.getItem('currentSession');
    const session = savedSession ? JSON.parse(savedSession) : null;
    console.log('Initial currentSession from localStorage:', session);
    return session;
  });
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
    date: null
  });

  useEffect(() => {
    if (currentSession) {
      localStorage.setItem('currentSession', JSON.stringify(currentSession));
      console.log('Updated localStorage with currentSession:', currentSession);
    } else {
      localStorage.removeItem('currentSession');
      console.log('Cleared localStorage currentSession');
    }
  }, [currentSession]);

  const checkCurrentSession = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, session: true }));
      setLoadingSessionData(true);
      const { data } = await detectCurrentSession(lecturerId);
      console.log('Detected session from backend:', data);
      if (data && !data.ended && new Date(data.endTime) > new Date()) {
        const validStartTime = new Date(data.startTime);
        const validEndTime = new Date(data.endTime);
        if (isNaN(validStartTime.getTime()) || isNaN(validEndTime.getTime())) {
          throw new Error('Invalid session times detected');
        }
        const unitName = data.unit?.name || units.find(u => u._id === (data.unit?._id || data.unit))?.name || 'Unknown Unit';
        setCurrentSession({ ...data, unit: { ...data.unit, name: unitName }, startSession: validStartTime, endSession: validEndTime });
        setQrData(data.qrCode);
        setSelectedUnit(data.unit && data.unit._id ? data.unit._id : data.unit);
      } else {
        setCurrentSession(null);
        setQrData('');
        setRealTimeAttendance([]);
        localStorage.removeItem('currentSession');
      }
    } catch (error) {
      console.error("Error checking current session:", error);
      if (currentSession && new Date(currentSession.endSession) > new Date()) {
        message.warning('Could not verify session with server. Using cached session.');
      } else {
        setCurrentSession(null);
        setQrData('');
        setRealTimeAttendance([]);
        localStorage.removeItem('currentSession');
        message.error('Could not detect current session.');
      }
    } finally {
      setLoading(prev => ({ ...prev, session: false }));
      setLoadingSessionData(false);
    }
  }, [lecturerId, units]);

  useEffect(() => {
    if (currentSession && new Date(currentSession.endSession) > new Date()) {
      console.log('Preserving session from localStorage until backend check:', currentSession);
      setQrData(currentSession.qrCode || '');
      setSelectedUnit(currentSession.unit?._id || currentSession.unit);
    }
    checkCurrentSession();
  }, [checkCurrentSession]);

  useEffect(() => {
    let intervalId;
    if (currentSession && currentSession.startSession && currentSession.endSession && !currentSession.ended) {
      intervalId = setInterval(() => {
        const now = new Date();
        if (now > new Date(currentSession.endSession)) {
          setCurrentSession(null);
          setQrData('');
          setRealTimeAttendance([]);
          localStorage.removeItem('currentSession');
          clearInterval(intervalId);
          console.log('Session expired, cleared localStorage');
        }
      }, 60000);
      return () => clearInterval(intervalId);
    }
  }, [currentSession]);

  useEffect(() => {
    if (!selectedUnit || currentSession?.ended) {
      setLoadingSessionData(false);
      if (!currentSession || currentSession.ended) {
        setCurrentSession(null);
        setQrData('');
      }
      return;
    }

    const fetchCurrentSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found");
        message.error("Authentication token missing. Please log in again.");
        setLoadingSessionData(false);
        return;
      }

      if (!selectedUnit || selectedUnit === 'undefined') {
        console.error("No valid unit selected:", selectedUnit);
        message.error("Please select a valid unit.");
        setLoadingSessionData(false);
        return;
      }

      try {
        setLoadingSessionData(true);
        console.log("Fetching session for unit:", selectedUnit);
        const response = await axios.get(
          `https://attendance-system-w70n.onrender.com/api/sessions/current/${selectedUnit}`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
            validateStatus: status => status >= 200 && status < 300
          }
        );
        console.log("Full API response for current session:", response.data);
        if (response.data && response.data._id && !response.data.ended) {
          const validStartTime = response.data.startTime ? new Date(response.data.startTime) : null;
          const validEndTime = response.data.endTime ? new Date(response.data.endTime) : null;
          if (!validStartTime || !validEndTime || isNaN(validStartTime.getTime()) || isNaN(validEndTime.getTime())) {
            message.warning("Invalid session times received.");
            setCurrentSession(null);
            setQrData('');
          } else {
            const unitFromResponse = response.data.unit || {};
            const unitName = unitFromResponse.name || (units.find(u => u._id === response.data.unit)?.name) || "Unknown Unit";
            setCurrentSession({ ...response.data, unit: { ...unitFromResponse, name: unitName }, startSession: validStartTime, endSession: validEndTime });
            setQrData(response.data.qrCode);
          }
        } else {
          setCurrentSession(null);
          setQrData('');
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        if (error.response?.status === 429) {
          message.warning('Too many requests. Please try again later.');
        } else if (error.response?.status === 400) {
          message.error('Invalid request to fetch session. Please select a valid unit.');
        } else {
          message.error('Could not fetch current session.');
        }
        setCurrentSession(null);
        setQrData('');
      } finally {
        setLoadingSessionData(false);
      }
    };
    fetchCurrentSession();
  }, [selectedUnit, units, currentSession?.ended]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(prev => ({ ...prev, units: true }));
        const unitsData = await getLecturerUnits(lecturerId);
        setUnits(unitsData || []);
        if (unitsData?.length > 0 && !selectedUnit && !currentSession) {
          setSelectedUnit(unitsData[0]._id);
        }
      } catch (error) {
        console.error("Error fetching units:", error);
        message.error('Unable to load units.');
      } finally {
        setLoading(prev => ({ ...prev, units: false }));
      }
    };
    if (lecturerId && units.length === 0) fetchUnits();
  }, [lecturerId, selectedUnit, currentSession, units]);

  const fetchRealTimeAttendance = useCallback(async () => {
    if (!selectedUnit || !currentSession || !currentSession._id || currentSession.ended) {
      console.log('Skipping real-time attendance fetch: invalid or no active session', { selectedUnit, currentSession });
      setRealTimeAttendance([]);
      return;
    }
    try {
      setLoading(prev => ({ ...prev, attendance: true, stats: true }));
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      console.log('Fetching real-time attendance for session:', currentSession._id);
      const response = await axios.get(
        `https://attendance-system-w70n.onrender.com/api/attendance/realtime/${currentSession._id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('Real-time attendance response:', response.data);
      const uniqueAttendance = Object.values(
        (response.data || []).reduce((acc, record) => {
          acc[record.student.regNo] = record;
          return acc;
        }, {})
      );
      setRealTimeAttendance(uniqueAttendance);
    } catch (error) {
      console.error("Error fetching real-time attendance:", error);
      if (error.response?.status === 404) {
        message.error('No active session found for real-time attendance. Session may have ended.');
        setCurrentSession(null);
        setQrData('');
        setRealTimeAttendance([]);
        localStorage.removeItem('currentSession');
        await checkCurrentSession();
      } else if (error.response?.status === 400) {
        message.error('Invalid session ID for real-time attendance.');
      } else {
        message.error('Failed to fetch real-time attendance.');
      }
      setRealTimeAttendance([]);
    } finally {
      setLoading(prev => ({ ...prev, attendance: false, stats: false }));
    }
  }, [selectedUnit, currentSession, checkCurrentSession]);

  const handleViewAttendance = useCallback(async () => {
    if (!selectedUnit) return;
    try {
      setLoading(prev => ({ ...prev, attendance: true, stats: true }));
      const date = filters.date ? filters.date.startOf('day').toISOString() : null;
      const endDate = filters.date ? filters.date.endOf('day').toISOString() : null;
      const data = await getLecturerUnitAttendance(selectedUnit, date, endDate);
      const uniqueAttendance = Object.values(
        (data || []).reduce((acc, record) => {
          acc[record.student.regNo] = record;
          return acc;
        }, {})
      );
      setAttendance(uniqueAttendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendance([]);
      message.error('Unable to fetch attendance data.');
    } finally {
      setLoading(prev => ({ ...prev, attendance: false, stats: false }));
    }
  }, [selectedUnit, filters.date]);

  useEffect(() => {
    if (currentSession && !currentSession.ended) {
      fetchRealTimeAttendance();
      const interval = setInterval(fetchRealTimeAttendance, 30000);
      return () => clearInterval(interval);
    } else {
      setRealTimeAttendance([]);
    }
  }, [currentSession, fetchRealTimeAttendance]);

  useEffect(() => {
    handleViewAttendance();
  }, [selectedUnit, filters.date, handleViewAttendance]);

  const handleCreateSession = async () => {
    if (!selectedUnit) {
      message.error('Please select a unit first');
      return;
    }
    try {
      setLoading(prev => ({ ...prev, session: true }));
      setLoadingSessionData(true);
      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const data = await createSession({ unitId: selectedUnit, lecturerId, startTime, endTime });
      const validStartTime = data.startTime ? new Date(data.startTime) : new Date();
      const validEndTime = data.endTime ? new Date(data.endTime) : new Date(Date.now() + 60 * 60 * 1000);
      if (isNaN(validStartTime.getTime()) || isNaN(validEndTime.getTime())) {
        throw new Error('Invalid session times received from API');
      }
      const unitName = units.find(u => u._id === selectedUnit)?.name || 'Unknown Unit';
      setCurrentSession({ ...data, unit: { ...data.unit, name: unitName }, startSession: validStartTime, endSession: validEndTime, ended: false });
      setQrData(data.qrCode);
      message.success('Session created successfully');
    } catch (error) {
      console.error("Error creating session:", error);
      if (error.response?.status === 429) {
        message.warning('Too many requests. Please try again later.');
      } else if (error.response?.status === 400) {
        message.error('Invalid session details. Please check your input and try again.');
      } else {
        message.error('Failed to create session. Please try again.');
      }
    } finally {
      setLoading(prev => ({ ...prev, session: false }));
      setLoadingSessionData(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!selectedUnit || !currentSession || currentSession.ended) {
      message.error('Please select a unit and ensure an active session exists');
      return;
    }
    try {
      setLoading(prev => ({ ...prev, qr: true }));
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
      if (error.response?.status === 429) {
        message.warning('Too many requests. Please try again later.');
      } else if (error.response?.status === 400) {
        message.error('Invalid session or unit. Please ensure an active session exists.');
      } else {
        message.error('Failed to generate QR code. Please try again.');
      }
    } finally {
      setLoading(prev => ({ ...prev, qr: false }));
    }
  };

  const handleEndSession = async () => {
    if (!currentSession) {
      message.warning('No active session to end');
      return;
    }
    try {
      setLoading(prev => ({ ...prev, session: true }));
      const token = localStorage.getItem('token');
      Modal.confirm({
        title: 'End Current Session?',
        content: 'This will stop the session and mark absent students. The session data will be preserved.',
        okText: 'End Session',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: async () => {
          try {
            if (!currentSession?._id) throw new Error('Invalid session ID');
            console.log('Ending session with ID:', currentSession._id);
            const response = await axios.post(
              'https://attendance-system-w70n.onrender.com/api/sessions/end',
              { sessionId: currentSession._id },
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            console.log('Session end response:', response.data);
            if (response.data.session.ended) {
              message.success('Session ended successfully');
              setCurrentSession(null);
              setQrData('');
              setRealTimeAttendance([]);
              localStorage.removeItem('currentSession');
              setSelectedUnit(null);
              await checkCurrentSession();
            } else {
              throw new Error('Session not marked as ended');
            }
          } catch (error) {
            console.error('Error ending session:', error);
            if (error.response?.status === 429) {
              message.warning('Too many requests. Please try again later.');
            } else if (error.response?.status === 400) {
              message.error('Invalid session ID. Session may already be ended.');
              setCurrentSession(null);
              setQrData('');
              localStorage.removeItem('currentSession');
            } else {
              message.error('Failed to end session. Please try again.');
            }
          }
        }
      });
    } catch (error) {
      console.error('Unexpected error in handleEndSession:', error);
      message.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, session: false }));
    }
  };

  const realTimeColumns = [
    { title: 'Reg Number', dataIndex: ['student', 'regNo'], key: 'regNo', sorter: (a, b) => (a.student?.regNo || '').localeCompare(b.student?.regNo || '') },
    { title: 'Name', key: 'name', render: (_, record) => `${record.student?.firstName || ''} ${record.student?.lastName || ''}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: status => <Tag color={status === 'Present' ? 'green' : 'volcano'}>{status.toUpperCase()}</Tag> },
    { title: 'Scan Time', dataIndex: 'attendedAt', key: 'attendedAt', render: date => date ? moment(date).format('HH:mm:ss') : 'N/A' }
  ];

  const filterColumns = [
    { title: 'Reg Number', dataIndex: ['student', 'regNo'], key: 'regNo', sorter: (a, b) => (a.student?.regNo || '').localeCompare(b.student?.regNo || '') },
    { title: 'Name', key: 'name', render: (_, record) => `${record.student?.firstName || ''} ${record.student?.lastName || ''}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: status => <Tag color={status === 'Present' ? 'green' : 'volcano'}>{status.toUpperCase()}</Tag> },
    { title: 'Date', dataIndex: 'attendedAt', key: 'attendedAt', render: date => date ? moment(date).format('YYYY-MM-DD') : 'N/A' }
  ];

  const { attendanceRate, totalEnrolled, totalScans } = useMemo(() => {
    if (!selectedUnit) return { attendanceRate: 0, totalEnrolled: 0, totalScans: 0 };
    const unit = units.find(u => u._id === selectedUnit);
    const enrolledCount = unit?.studentsEnrolled?.length || 0;
    const sessionAttendance = currentSession && !currentSession.ended ? realTimeAttendance : attendance;
    const scans = sessionAttendance.filter(a => a.status === 'Present').length;
    return {
      attendanceRate: enrolledCount > 0 ? Number((scans / enrolledCount * 100).toFixed(1)) : 0,
      totalEnrolled: enrolledCount,
      totalScans: scans
    };
  }, [attendance, realTimeAttendance, selectedUnit, units, currentSession]);

  const summaryCards = (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={8}><Card><Statistic title="Enrolled Students" value={totalEnrolled} prefix={<TeamOutlined />} loading={loading.stats} /></Card></Col>
      <Col xs={24} sm={12} md={8}><Card><Statistic title="Attendance Rate" value={attendanceRate} suffix="%" prefix={<PercentageOutlined />} loading={loading.stats} /></Card></Col>
      <Col xs={24} sm={12} md={8}><Card><Statistic title="Total Scans" value={totalScans} prefix={<ScheduleOutlined />} loading={loading.stats} /></Card></Col>
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
      <Spin spinning={loading.units || loading.session} tip={loading.units ? "Fetching units..." : "Checking session..."}>
        {loadingSessionData ? (
          <Card loading style={{ marginBottom: 24 }}><Skeleton active /></Card>
        ) : currentSession && currentSession.startSession && currentSession.endSession && !currentSession.ended ? (
          <Card title={<Space><ClockCircleOutlined /> Active Session: {currentSession.unit?.name || 'Unknown'}</Space>} style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}><Text strong>Time: </Text>{formatSessionTime(currentSession)}</Col>
              <Col span={24}><SessionTimer end={currentSession.endSession} /></Col>
              <Col span={24}><Button danger onClick={handleEndSession} loading={loading.session}>End Session</Button></Col>
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
                allowClear
              >
                {units.map(unit => (
                  <Option key={unit._id} value={unit._id}>
                    <Space><BookOutlined />{unit.name} – {unit.code}</Space>
                  </Option>
                ))}
              </Select>
              <Button type="primary" icon={<QrcodeOutlined />} onClick={handleGenerateQR} disabled={!currentSession || currentSession.ended} loading={loading.qr}>
                {screens.md ? 'Generate QR Code' : 'QR'}
              </Button>
              <Button type="primary" icon={<CalendarOutlined />} onClick={handleCreateSession} disabled={currentSession && !currentSession.ended} loading={loading.session}>
                Create Session
              </Button>
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Card
              title="Real-time Attendance"
              extra={<Button onClick={fetchRealTimeAttendance} loading={loading.attendance} type="primary" disabled={!currentSession || currentSession.ended}>Refresh</Button>}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  placeholder="Search by Reg Number"
                  prefix={<SearchOutlined />}
                  style={{ width: 240 }}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  allowClear
                />
                {summaryCards}
                <Skeleton active loading={loading.attendance}>
                  <Table
                    columns={realTimeColumns}
                    dataSource={realTimeAttendance.filter(a => a.student?.regNo?.toLowerCase().includes(filters.search.toLowerCase()))}
                    rowKey="_id"
                    scroll={{ x: true }}
                    pagination={{ pageSize: 8, showTotal: total => `Total ${total} students` }}
                    locale={{ emptyText: 'No attendance records' }}
                    bordered
                    size="middle"
                  />
                </Skeleton>
              </Space>
            </Card>

            <Card title="Attendance Records Filter" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space wrap>
                  <Select
                    placeholder="Select Unit"
                    style={{ width: 300 }}
                    onChange={setSelectedUnit}
                    value={selectedUnit}
                    allowClear
                  >
                    {units.map(unit => (
                      <Option key={unit._id} value={unit._id}>{unit.name} – {unit.code}</Option>
                    ))}
                  </Select>
                  <DatePicker
                    style={{ width: 150 }}
                    onChange={date => setFilters(prev => ({ ...prev, date }))}
                    value={filters.date}
                  />
                  <Button icon={<DownloadOutlined />} onClick={() => downloadAttendanceReport(selectedUnit)} disabled={!selectedUnit}>
                    {screens.md ? 'Download Report' : 'Export'}
                  </Button>
                </Space>
                <Skeleton active loading={loading.attendance}>
                  <Table
                    columns={filterColumns}
                    dataSource={attendance}
                    rowKey="_id"
                    pagination={false}
                    size="small"
                    bordered
                    scroll={{ y: 200 }}
                    locale={{ emptyText: 'No records' }}
                  />
                </Skeleton>
              </Space>
            </Card>
          </Space>
        </Card>
      </Spin>

      <Modal
        title="Attendance QR Code"
        open={isQRModalOpen}
        centered
        onCancel={() => Modal.confirm({ title: 'Are you sure you want to close?', content: 'The QR code will no longer be accessible.', okText: 'Yes', cancelText: 'No', onOk: () => setIsQRModalOpen(false) })}
        footer={[<Button key="close" onClick={() => Modal.confirm({ title: 'Are you sure you want to close?', content: 'The QR code will no longer be accessible.', okText: 'Yes', cancelText: 'No', onOk: () => setIsQRModalOpen(false) })}>Close</Button>]}
        destroyOnClose
        maskClosable={false}
      >
        <Spin spinning={loading.qr} tip="Generating QR code...">
          <div style={{ textAlign: 'center', padding: 24 }}>
            {qrData ? (
              <>
                <img src={qrData} alt="QR Code" style={{ maxWidth: 300 }} />
                {currentSession && !currentSession.ended && <SessionTimer end={currentSession.endSession} />}
                <Typography.Text type="secondary" style={{ marginTop: 16, display: "block" }}>Scan this QR code to mark attendance.</Typography.Text>
              </>
            ) : (
              <Typography.Text type="danger">Failed to load QR Code</Typography.Text>
            )}
          </div>
        </Spin>
      </Modal>
    </div>
  );
};

export default AttendanceManagement;