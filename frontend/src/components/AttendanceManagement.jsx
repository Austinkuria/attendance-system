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
    return savedSession ? JSON.parse(savedSession) : null;
  });
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
    date: null
  });

  useEffect(() => {
    if (currentSession) {
      localStorage.setItem('currentSession', JSON.stringify(currentSession));
    } else {
      localStorage.removeItem('currentSession');
    }
  }, [currentSession]);

  const checkCurrentSession = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, session: true }));
      const { data } = await detectCurrentSession(lecturerId);
      if (data && !data.ended && new Date(data.endTime) > new Date()) {
        const validStartTime = new Date(data.startTime);
        const validEndTime = new Date(data.endTime);
        if (isNaN(validStartTime.getTime()) || isNaN(validEndTime.getTime())) {
          throw new Error('Invalid session times');
        }
        setCurrentSession({ ...data, startSession: validStartTime, endSession: validEndTime });
        setQrData(data.qrCode);
        setSelectedUnit(data.unit && data.unit._id ? data.unit._id : data.unit);
      } else {
        setCurrentSession(null);
        setQrData('');
        setRealTimeAttendance([]);
        localStorage.removeItem('currentSession');
      }
    } catch (error) {
      console.error("Error checking session:", error);
      setCurrentSession(null);
      setQrData('');
      setRealTimeAttendance([]);
      localStorage.removeItem('currentSession');
      message.error('Could not detect current session.');
    } finally {
      setLoading(prev => ({ ...prev, session: false }));
    }
  }, [lecturerId]);

  useEffect(() => {
    checkCurrentSession();
  }, [checkCurrentSession]);

  useEffect(() => {
    let intervalId;
    if (currentSession && !currentSession.ended) {
      intervalId = setInterval(() => {
        const now = new Date();
        if (now > new Date(currentSession.endSession)) {
          setCurrentSession(null);
          setQrData('');
          setRealTimeAttendance([]);
          localStorage.removeItem('currentSession');
          clearInterval(intervalId);
        }
      }, 60000);
      return () => clearInterval(intervalId);
    }
  }, [currentSession]);

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
    if (!selectedUnit || !currentSession || currentSession.ended) return;
    try {
      setLoading(prev => ({ ...prev, attendance: true, stats: true }));
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://attendance-system-w70n.onrender.com/api/attendance/realtime/${currentSession._id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const uniqueAttendance = Object.values(
        (response.data || []).reduce((acc, record) => {
          acc[record.student.regNo] = record;
          return acc;
        }, {})
      );
      setRealTimeAttendance(uniqueAttendance);
    } catch (error) {
      console.error("Error fetching real-time attendance:", error);
      setRealTimeAttendance([]);
      message.error('Failed to fetch real-time attendance.');
    } finally {
      setLoading(prev => ({ ...prev, attendance: false, stats: false }));
    }
  }, [selectedUnit, currentSession]);

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
      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const data = await createSession({ unitId: selectedUnit, lecturerId, startTime, endTime });
      setCurrentSession({ ...data, startSession: new Date(data.startTime), endSession: new Date(data.endTime), ended: false });
      setQrData(data.qrCode);
      message.success('Session created successfully');
    } catch (error) {
      console.error("Error creating session:", error);
      message.error('Failed to create session.');
    } finally {
      setLoading(prev => ({ ...prev, session: false }));
    }
  };

  const handleGenerateQR = async () => {
    if (!selectedUnit || !currentSession || currentSession.ended) {
      message.error('No active session for selected unit');
      return;
    }
    try {
      setLoading(prev => ({ ...prev, qr: true }));
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `https://attendance-system-w70n.onrender.com/api/sessions/current/${selectedUnit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.qrCode || data.ended) throw new Error("Invalid session");
      setQrData(data.qrCode);
      setIsQRModalOpen(true);
    } catch (error) {
      console.error("Error generating QR:", error);
      message.error('Failed to generate QR code.');
    } finally {
      setLoading(prev => ({ ...prev, qr: false }));
    }
  };

  const handleEndSession = async () => {
    if (!currentSession) return;
    try {
      setLoading(prev => ({ ...prev, session: true }));
      const token = localStorage.getItem('token');
      await axios.post(
        'https://attendance-system-w70n.onrender.com/api/sessions/end',
        { sessionId: currentSession._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentSession(null);
      setQrData('');
      setRealTimeAttendance([]); // Reset scans after session ends
      localStorage.removeItem('currentSession');
      message.success('Session ended successfully');
      await checkCurrentSession();
    } catch (error) {
      console.error("Error ending session:", error);
      message.error('Failed to end session.');
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

    const sessionAttendance = currentSession && !currentSession.ended
      ? realTimeAttendance // Use real-time data during active session
      : attendance; // Use historical data when no session

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
    if (!session?.startSession || !session?.endSession) return 'N/A';
    const start = new Date(session.startSession).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const end = new Date(session.endSession).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${start} - ${end}`;
  };

  const SessionTimer = ({ end }) => {
    const [timeLeft, setTimeLeft] = useState(() => Math.max(0, new Date(end).getTime() - Date.now()));
    useEffect(() => {
      const timer = setInterval(() => setTimeLeft(Math.max(0, new Date(end).getTime() - Date.now())), 1000);
      return () => clearInterval(timer);
    }, [end]);
    const formatTime = (ms) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    };
    return <Tag icon={<ClockCircleOutlined />} color="processing">Time Remaining: {formatTime(timeLeft)}</Tag>;
  };

  SessionTimer.propTypes = {
    end: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired
  };

  return (
    <div style={{ padding: screens.md ? 24 : 16 }}>
      <Spin spinning={loading.units || loading.session}>
        {currentSession && !currentSession.ended && (
          <Card title={<Space><ClockCircleOutlined /> Active Session: {units.find(u => u._id === selectedUnit)?.name || 'Unknown'}</Space>} style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}><Text strong>Time: </Text>{formatSessionTime(currentSession)}</Col>
              <Col span={24}><SessionTimer end={currentSession.endSession} /></Col>
              <Col span={24}><Button danger onClick={handleEndSession} loading={loading.session}>End Session</Button></Col>
            </Row>
          </Card>
        )}

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
        onCancel={() => setIsQRModalOpen(false)}
        footer={[<Button key="close" onClick={() => setIsQRModalOpen(false)}>Close</Button>]}
        centered
      >
        <Spin spinning={loading.qr}>
          <div style={{ textAlign: 'center', padding: 24 }}>
            {qrData ? (
              <>
                <img src={qrData} alt="QR Code" style={{ maxWidth: 300 }} />
                <SessionTimer end={currentSession?.endSession} />
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