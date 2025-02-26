import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStudentAttendance,
  getStudentUnits,
  getUserProfile,
  submitFeedback,
  getSessionQuiz,
  submitQuizAnswers,
  getActiveSessionForUnit,
} from '../../services/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  Layout,
  Menu,
  Button,
  Card,
  Row,
  Col,
  Dropdown,
  Modal,
  message,
  Input,
  Rate,
  Radio,
  Space,
  theme,
  Typography,
  Spin,
  notification,
  Slider,
  Switch,
  DatePicker,
  Select,
  List,
} from 'antd';
import {
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  LogoutOutlined,
  QrcodeOutlined,
  CalendarOutlined,
  BellOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import { messaging, onMessage, registerFcmToken } from '../../firebase';
import 'antd/dist/reset.css';
import './StudentDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;
const { Option } = Select;
const API_URL = 'https://attendance-system-w70n.onrender.com/api';

const StudentDashboard = () => {
  const { token: { colorBgContainer } } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
  const [units, setUnits] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ attendanceRecords: [], weeklyEvents: [], dailyEvents: [] });
  const [attendanceRates, setAttendanceRates] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    rating: 3,
    text: '',
    pace: 50,
    interactivity: 3,
    clarity: true,
    resources: '',
  });
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [hasShownLowAttendanceAlert, setHasShownLowAttendanceAlert] = useState(false);
  const [viewMode, setViewMode] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(null);
  const [pendingFeedbacks, setPendingFeedbacks] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/login');
    } else {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/firebase-messaging-sw.js')
          .then((registration) => console.log('Service Worker registered:', registration.scope))
          .catch((error) => console.error('Service Worker registration failed:', error));
      }

      registerFcmToken().then((fcmToken) => {
        if (fcmToken) {
          axios.post(
            `${API_URL}/users/update-fcm-token`,
            { token: fcmToken },
            { headers: { Authorization: `Bearer ${token}` } }
          )
            .then(() => console.log('FCM Token registered:', fcmToken))
            .catch((error) => console.error('Error registering FCM token:', error));
        }
      });
    }
  }, [navigate]);

  const fetchAllData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const [profileRes, unitsRes] = await Promise.all([
        getUserProfile(token),
        getStudentUnits(token),
      ]);

      const unitsData = Array.isArray(unitsRes) ? unitsRes : (unitsRes?.enrolledUnits || []);
      const sanitizedUnits = unitsData.filter((unit) => {
        const isValid = unit && unit._id && typeof unit._id === 'string' && unit._id.trim() !== '';
        if (!isValid) console.warn("Invalid unit detected:", unit);
        return isValid;
      });
      if (sanitizedUnits.length === 0) {
        message.warning("No valid units assigned to your account.");
      }
      setUnits(sanitizedUnits);

      if (profileRes._id) {
        const attendanceRes = await getStudentAttendance(profileRes._id);
        setAttendanceData(attendanceRes);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error(`Failed to load data: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const handleNotification = (payload) => {
      const { sessionId, action, unitName } = payload.data || {};
      const sessionRecord = attendanceData.attendanceRecords.find((rec) => rec.session._id === sessionId);

      if (action === "openFeedback" && sessionRecord && sessionRecord.status === "Present") {
        setPendingFeedbacks((prev) => {
          if (!prev.some((pf) => pf.sessionId === sessionId)) {
            return [...prev, {
              sessionId,
              unitName,
              title: payload.notification.title,
              message: payload.notification.body,
              timestamp: new Date(),
            }];
          }
          return prev;
        });
      } else if (action === "feedbackSubmitted") {
        setPendingFeedbacks((prev) => prev.filter((pf) => pf.sessionId !== sessionId));
        notification.success({
          message: payload.notification.title,
          description: payload.notification.body,
          duration: 5,
        });
      }
    };

    onMessage(messaging, (payload) => {
      console.log('Foreground notification received:', payload);
      handleNotification(payload);
    });
  }, [attendanceData]);

  const calculateAttendanceRate = useCallback(
    (unitId) => {
      const unitData = attendanceData.attendanceRecords.filter(
        (record) => record.session.unit._id.toString() === unitId.toString()
      );
      if (!unitData || unitData.length === 0) return null;
      const attendedSessions = unitData.filter((att) => att.status === 'Present').length;
      const totalSessions = unitData.length;
      return ((attendedSessions / totalSessions) * 100).toFixed(2);
    },
    [attendanceData]
  );

  useEffect(() => {
    const rates = units.map((unit) => ({
      label: unit.name || 'Unnamed Unit',
      value: calculateAttendanceRate(unit._id),
    }));
    setAttendanceRates(rates);

    if (!hasShownLowAttendanceAlert && rates.some(rate => rate.value !== null && parseFloat(rate.value) < 75)) {
      message.warning({
        content: 'Low attendance in some units may risk not attaining the required average attendance rate for your semester!',
        duration: 5,
      });
      setHasShownLowAttendanceAlert(true);
    }
  }, [units, attendanceData, calculateAttendanceRate, hasShownLowAttendanceAlert]);

  const exportAttendanceData = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      attendanceRates.map((rate) => `${rate.label},${rate.value === null ? 'N/A' : rate.value}%`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'attendance_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const logout = () => {
    localStorage.removeItem('token');
    message.success('Logged out successfully.');
    navigate('/auth/login');
  };

  const getAttendanceColor = (rate) => {
    if (rate === null) return '#ff4d4f';
    const value = parseFloat(rate);
    if (value >= 75) return '#52c41a';
    if (value >= 50) return '#faad14';
    if (value >= 25) return '#ff7f50';
    return '#ff4d4f';
  };

  const chartData = {
    labels: attendanceRates.map((rate) => rate.label),
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: attendanceRates.map((rate) => rate.value === null ? 0 : rate.value),
        backgroundColor: attendanceRates.map((rate) => getAttendanceColor(rate.value)),
        borderColor: attendanceRates.map((rate) => {
          if (rate.value === null) return '#d9363e';
          const value = parseFloat(rate.value);
          if (value >= 75) return '#389e0d';
          if (value >= 50) return '#d48806';
          if (value >= 25) return '#e06636';
          return '#d9363e';
        }),
        borderWidth: 1,
        borderRadius: 4,
        minBarLength: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Attendance Overview' },
      tooltip: { callbacks: { label: (context) => `${context.raw === 0 && attendanceRates[context.dataIndex].value === null ? 'N/A' : context.raw}%` } },
    },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Attendance Rate (%)' } },
      x: { ticks: { maxRotation: 45, minRotation: 0 } },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        navigate('/student/attendance-trends');
      }
    },
  };

  const filteredEvents = () => {
    if (!selectedDate) {
      return attendanceData.attendanceRecords.map((record) => ({
        title: `${record.session.unit?.name || 'Unknown'} - ${record.status || 'Unknown'}`,
        date: record.session.startTime ? moment(record.session.startTime) : null,
        status: record.status || 'Unknown',
        sessionId: record.session._id,
      }));
    }

    if (viewMode === 'weekly') {
      const selectedWeek = attendanceData.weeklyEvents.find((week) =>
        week.week === selectedDate.format('MMM D - MMM D, YYYY')
      );
      return selectedWeek
        ? selectedWeek.events.map((event) => ({
          title: `${event.unitName} - ${event.status}`,
          date: moment(event.startTime),
          status: event.status,
        }))
        : [];
    } else {
      const selectedDay = attendanceData.dailyEvents.find((day) =>
        day.date === selectedDate.format('YYYY-MM-DD')
      );
      return selectedDay
        ? selectedDay.events.map((event) => ({
          title: `${event.unitName} - ${event.status}`,
          date: moment(event.startTime),
          status: event.status,
        }))
        : [];
    }
  };

  const renderCalendarEvents = () => (
    <Card style={{ marginTop: '24px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <AntTitle level={3} style={{ textAlign: 'center' }}>
          <CalendarOutlined /> Attendance Events
        </AntTitle>
        <Space>
          <Select
            value={viewMode}
            onChange={(value) => {
              setViewMode(value);
              setSelectedDate(null);
            }}
            style={{ width: 120 }}
          >
            <Option value="weekly">Weekly</Option>
            <Option value="daily">Daily</Option>
          </Select>
          <DatePicker
            picker={viewMode === 'weekly' ? 'week' : 'date'}
            onChange={(date) => setSelectedDate(date)}
            value={selectedDate}
            format={viewMode === 'weekly' ? 'MMM D - MMM D, YYYY' : 'YYYY-MM-DD'}
            placeholder={`Select ${viewMode === 'weekly' ? 'Week' : 'Date'}`}
            style={{ width: 200 }}
          />
        </Space>
        {filteredEvents().length > 0 ? (
          <List
            dataSource={filteredEvents()}
            renderItem={(item) => (
              <List.Item key={item.sessionId || `${item.title}-${item.date?.toISOString()}`}>
                <List.Item.Meta
                  title={item.title}
                  description={item.date ? item.date.format('YYYY-MM-DD') + ` (${item.status})` : 'No Date'}
                />
              </List.Item>
            )}
          />
        ) : (
          <p style={{ textAlign: 'center', color: '#888' }}>No events found for the selected period.</p>
        )}
      </Space>
    </Card>
  );

  const renderNotifications = () => (
    <Card
      title={<><BellOutlined /> Notifications</>}
      style={{ marginTop: 24, borderRadius: 10, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
      extra={
        pendingFeedbacks.length > 0 && (
          <Button
            type="link"
            onClick={() => setPendingFeedbacks([])}
          >
            Clear All
          </Button>
        )
      }
    >
      {pendingFeedbacks.length > 0 ? (
        <List
          dataSource={pendingFeedbacks}
          renderItem={(item) => (
            <List.Item
              key={item.sessionId}
              actions={[
                <Button
                  key="provide-feedback"
                  type="primary"
                  onClick={() => {
                    setActiveSessionId(item.sessionId);
                    setFeedbackModalVisible(true);
                  }}
                >
                  Provide Feedback
                </Button>,
                <Button
                  key="dismiss"
                  onClick={() => setPendingFeedbacks((prev) => prev.filter((pf) => pf.sessionId !== item.sessionId))}
                >
                  Dismiss
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={item.title}
                description={`${item.message} (Unit: ${item.unitName}) - ${moment(item.timestamp).fromNow()}`}
              />
            </List.Item>
          )}
        />
      ) : (
        <p style={{ textAlign: 'center', color: '#888' }}>No new notifications.</p>
      )}
    </Card>
  );

  const profileItems = [
    { key: '1', label: 'View Profile', icon: <UserOutlined />, onClick: () => navigate('/student/profile') },
    { key: '2', label: 'Settings', icon: <SettingOutlined />, onClick: () => navigate('/student/settings') },
    { type: 'divider' },
    {
      key: '3',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () =>
        Modal.confirm({
          title: 'Confirm Logout',
          content: 'Are you sure you want to logout?',
          onOk: logout,
          centered: true,
        }),
    },
  ];

  const fetchSessionStatus = async (unitId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/sessions/active/${unitId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        const token = localStorage.getItem('token');
        const lastSession = await axios.get(
          `${API_URL}/sessions/last/${unitId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return lastSession.data;
      }
      throw error;
    }
  };

  const openFeedbackModal = async (unitId) => {
    const unitAttendance = attendanceData.attendanceRecords
      .filter((data) => data.session.unit._id.toString() === unitId.toString())
      .sort((a, b) => new Date(b.attendedAt) - new Date(a.attendedAt));
    const latestSession = unitAttendance[0];
    if (!latestSession) {
      message.warning('No attendance records found for this unit.');
      return;
    }

    try {
      const session = await fetchSessionStatus(unitId);
      console.log('Fetched session status:', session);

      const sessionEnded = session.ended === true;
      if (!sessionEnded) {
        message.info('Feedback is only available after the latest session ends.');
        return;
      }
      if (latestSession.status !== 'Present') {
        message.info('You must mark attendance for the latest session to provide feedback.');
        return;
      }
      if (latestSession.feedbackSubmitted) {
        message.info('Feedback already submitted for the latest session.');
        return;
      }
      setActiveSessionId(latestSession.session._id);
      setFeedbackModalVisible(true);

      await fetchAllData();
    } catch (error) {
      console.error('Error fetching session status:', error);
      if (error.response?.status === 429) {
        message.warning('Too many requests. Please try again later.');
      } else {
        const sessionEnded = latestSession.session.ended || new Date() > new Date(latestSession.session.endTime);
        if (!sessionEnded) {
          message.info('Feedback is only available after the latest session ends.');
          return;
        }
        if (latestSession.status !== 'Present') {
          message.info('You must mark attendance for the latest session to provide feedback.');
          return;
        }
        if (latestSession.feedbackSubmitted) {
          message.info('Feedback already submitted for the latest session.');
          return;
        }
        setActiveSessionId(latestSession.session._id);
        setFeedbackModalVisible(true);
      }
    }
  };

  const openQuizModal = async (unitId) => {
    const unitAttendance = attendanceData.attendanceRecords.filter(
      (data) => data.session.unit._id.toString() === unitId.toString()
    );
    if (!unitAttendance.length) {
      message.warning('No attendance records found.');
      return;
    }
    const latestSession = unitAttendance[0];
    setActiveSessionId(latestSession._id);
    try {
      const quizData = await getSessionQuiz(latestSession.session._id);
      if (quizData?.questions) {
        setQuiz(quizData);
        setQuizModalVisible(true);
      } else {
        message.info('No quiz available.');
      }
    } catch {
      message.error('Error fetching quiz.');
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!activeSessionId) return message.error('No session selected.');
    try {
      await submitFeedback({
        sessionId: activeSessionId,
        rating: feedbackData.rating,
        feedbackText: feedbackData.text,
        pace: feedbackData.pace,
        interactivity: feedbackData.interactivity,
        clarity: feedbackData.clarity,
        resources: feedbackData.resources,
      });
      message.success('Feedback submitted!');
      setFeedbackModalVisible(false);
      setFeedbackData({ rating: 3, text: '', pace: 50, interactivity: 3, clarity: true, resources: '' });
      setAttendanceData((prev) => ({
        ...prev,
        attendanceRecords: prev.attendanceRecords.map((rec) =>
          rec.session._id === activeSessionId ? { ...rec, feedbackSubmitted: true } : rec
        ),
      }));
      setPendingFeedbacks((prev) => prev.filter((pf) => pf.sessionId !== activeSessionId));
      await fetchAllData();
    } catch (error) {
      console.error('Feedback submission failed:', error);
      message.error(`Error submitting feedback: ${error.message || 'Unknown error'}`);
    }
  };

  const handleQuizAnswerChange = (questionIndex, value) => {
    setQuizAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const handleQuizSubmit = async () => {
    if (!quiz?._id) return message.error('No quiz data.');
    try {
      await submitQuizAnswers({ quizId: quiz._id, answers: quizAnswers });
      message.success('Quiz submitted!');
      setQuizModalVisible(false);
      setQuizAnswers({});
      setQuiz(null);
    } catch {
      message.error('Error submitting quiz.');
    }
  };

  const handleAttendClick = async (unitId) => {
    if (!unitId || typeof unitId !== 'string' || unitId.trim() === '' || unitId === 'undefined') {
      console.error("Invalid unitId passed to handleAttendClick:", unitId);
      message.error("Unit ID is missing or invalid. Please try again or contact support.");
      return;
    }
    try {
      console.log("Calling getActiveSessionForUnit with unitId:", unitId);
      const session = await getActiveSessionForUnit(unitId);
      if (session && session._id && !session.ended) {
        const url = `/qr-scanner/${unitId}`;
        console.log("Navigating to URL:", url);
        navigate(url);
      } else {
        message.error("No active session available for this unit.");
      }
    } catch (err) {
      console.error('Error checking active session:', err);
      message.error(`No active session available or error checking session: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header style={{ padding: '0 16px', background: colorBgContainer, position: 'fixed', width: '100%', zIndex: 10 }}>
        <Row align="middle">
          <Col flex="auto">
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '16px', width: 64, height: 64 }} />
            <AntTitle level={3} style={{ display: 'inline', margin: 0 }}>Student Dashboard</AntTitle>
          </Col>
          <Col>
            <Dropdown menu={{ items: profileItems }} trigger={['click']}>
              <Button type="text" icon={<UserOutlined style={{ fontSize: 24 }} />} style={{ marginRight: 24 }} />
            </Dropdown>
          </Col>
        </Row>
      </Header>

      <Layout>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={250} breakpoint="lg" collapsedWidth={80} style={{ background: colorBgContainer, marginTop: 64, position: 'fixed', height: 'calc(100vh - 64px)', overflow: 'auto' }}>
          <Menu mode="inline" defaultSelectedKeys={['1']} items={[
            { key: '1', icon: <BookOutlined />, label: 'Units', onClick: () => navigate('/student/dashboard') },
            { key: '2', icon: <CheckCircleOutlined />, label: 'AttendanceTrends', onClick: () => navigate('/student/attendance-trends') },
            { key: '3', icon: <UserOutlined />, label: 'Profile', onClick: () => navigate('/student/profile') },
          ]} />
        </Sider>

        <Content style={{ marginTop: 64, marginBottom: 16, marginLeft: collapsed ? 96 : 266, marginRight: 16, padding: 24, minHeight: 'calc(100vh - 64px)', overflow: 'auto', maxWidth: 1200 }} className="ant-layout-content">
          <Spin spinning={loading} tip="Loading data...">
            <Row gutter={[16, 16]} justify="center">
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', borderRadius: 10, textAlign: 'center', width: '100%', minWidth: 200, height: 200 }} styles={{ body: { padding: '16px' } }}>
                  <Space direction="vertical">
                    <BookOutlined style={{ fontSize: 24 }} />
                    <h3>Total Units</h3>
                    <h1>{units.length}</h1>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card style={{ background: 'linear-gradient(135deg, #52c41a, #389e0d)', color: 'white', borderRadius: 10, textAlign: 'center', width: '100%', minWidth: 200, height: 200 }} styles={{ body: { padding: '16px' } }}>
                  <Space direction="vertical">
                    <CheckCircleOutlined style={{ fontSize: 24 }} />
                    <h3>Attendance Rate</h3>
                    <h1>{attendanceRates.length ? Math.round(attendanceRates.reduce((sum, rate) => sum + (rate.value === null ? 0 : parseFloat(rate.value)), 0) / attendanceRates.length) : 0}%</h1>
                  </Space>
                </Card>
              </Col>
            </Row>

            <AntTitle level={2} style={{ marginTop: 24, textAlign: 'center' }}>My Units</AntTitle>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {units.map((unit) => unit._id ? (
                <Col xs={24} sm={12} md={8} lg={6} key={unit._id}>
                  <Card title={unit.name || 'Untitled Unit'} extra={<span>{unit.code || 'N/A'}</span>} style={{ borderRadius: 10, width: '100%' }} styles={{ body: { padding: '16px' }, header: { padding: '8px 16px', whiteSpace: 'normal', wordBreak: 'break-word' } }} onClick={() => setSelectedUnit(unit)}>
                    <Space direction="vertical" style={{ width: '100%' }} size={16}>
                      {(() => {
                        const rate = calculateAttendanceRate(unit._id);
                        return rate === null ? (
                          <div style={{ color: '#888' }}>No sessions</div>
                        ) : (
                          <div
                            style={{
                              background: '#e8ecef',
                              borderRadius: 6,
                              overflow: 'hidden',
                              height: 20,
                            }}
                          >
                            <div style={{
                              width: `${rate}%`,
                              minWidth: rate === '0.00' ? '20px' : '0',
                              background: getAttendanceColor(rate),
                              color: '#fff',
                              textAlign: 'center',
                              padding: '2px 0',
                              transition: 'width 0.5s ease'
                            }}>
                              {rate}%
                            </div>
                          </div>
                        );
                      })()}
                      <Row gutter={[8, 8]} justify="space-between">
                        <Col span={12}>
                          <Button type="primary" icon={<QrcodeOutlined />} block onClick={(e) => { e.stopPropagation(); handleAttendClick(unit._id); }}>Attend</Button>
                        </Col>
                        <Col span={12}>
                          <Button block onClick={(e) => { e.stopPropagation(); openQuizModal(unit._id); }}>Quiz</Button>
                        </Col>
                      </Row>
                      <Button block onClick={(e) => { e.stopPropagation(); openFeedbackModal(unit._id); }}>Feedback</Button>
                    </Space>
                  </Card>
                </Col>
              ) : null)}
            </Row>

            {renderCalendarEvents()}
            {renderNotifications()}
            <AntTitle level={2} style={{ marginTop: 24, textAlign: 'center' }}>Attendance Overview</AntTitle>
            <Card style={{ marginTop: 16, borderRadius: 10 }}>
              <div style={{ height: '400px' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
              <Button type="primary" style={{ marginTop: 16, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} onClick={exportAttendanceData}>Export Data</Button>
            </Card>

            <Modal open={!!selectedUnit} title={selectedUnit?.name} onCancel={() => setSelectedUnit(null)} footer={<Button onClick={() => setSelectedUnit(null)}>Close</Button>} centered width={Math.min(window.innerWidth * 0.9, 500)}>
              {selectedUnit && (
                <Space direction="vertical">
                  <p><strong>Code:</strong> {selectedUnit.code || 'N/A'}</p>
                  <p><strong>Lecturer:</strong> {selectedUnit.lecturer || 'N/A'}</p>
                  <p><strong>Description:</strong> {selectedUnit.description || 'N/A'}</p>
                </Space>
              )}
            </Modal>

            <Modal
              open={feedbackModalVisible}
              title="Session Feedback"
              onCancel={() => setFeedbackModalVisible(false)}
              onOk={handleFeedbackSubmit}
              centered
              width={Math.min(window.innerWidth * 0.9, 600)}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div>
                  <p>Overall Satisfaction</p>
                  <Rate allowHalf value={feedbackData.rating} onChange={(value) => setFeedbackData({ ...feedbackData, rating: value })} />
                </div>
                <div>
                  <p>Pace of the Session (Slow to Fast)</p>
                  <Slider
                    min={0}
                    max={100}
                    value={feedbackData.pace}
                    onChange={(value) => setFeedbackData({ ...feedbackData, pace: value })}
                    marks={{ 0: 'Too Slow', 50: 'Just Right', 100: 'Too Fast' }}
                  />
                </div>
                <div>
                  <p>Interactivity Level</p>
                  <Rate value={feedbackData.interactivity} onChange={(value) => setFeedbackData({ ...feedbackData, interactivity: value })} />
                </div>
                <div>
                  <p>Was the content clear?</p>
                  <Switch
                    checked={feedbackData.clarity}
                    onChange={(checked) => setFeedbackData({ ...feedbackData, clarity: checked })}
                    checkedChildren="Yes"
                    unCheckedChildren="No"
                  />
                </div>
                <Input.TextArea
                  rows={4}
                  placeholder="Share your thoughts (optional)"
                  value={feedbackData.text}
                  onChange={(e) => setFeedbackData({ ...feedbackData, text: e.target.value })}
                />
                <Input.TextArea
                  rows={3}
                  placeholder="Suggestions for resources or improvements"
                  value={feedbackData.resources}
                  onChange={(e) => setFeedbackData({ ...feedbackData, resources: e.target.value })}
                />
              </Space>
            </Modal>

            <Modal open={quizModalVisible} title={quiz?.title || 'Quiz'} onCancel={() => setQuizModalVisible(false)} onOk={handleQuizSubmit} centered width={Math.min(window.innerWidth * 0.9, 500)}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {quiz?.questions?.map((q, index) => (
                  <div key={index}>
                    <p>{q.question}</p>
                    <Radio.Group onChange={(e) => handleQuizAnswerChange(index, e.target.value)} value={quizAnswers[index]}>
                      <Space direction="vertical">
                        {q.options?.map((opt, idx) => (
                          <Radio key={idx} value={opt.optionText}>{opt.optionText}</Radio>
                        ))}
                      </Space>
                    </Radio.Group>
                  </div>
                ))}
              </Space>
            </Modal>
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentDashboard;