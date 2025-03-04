import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStudentAttendance,
  getStudentUnits,
  getUserProfile,
  submitFeedback,
  getActiveSessionForUnit,
  getPendingFeedbackAttendance
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
  Space,
  theme,
  Typography,
  Spin,
  Slider,
  Switch,
  DatePicker,
  Select,
  List,
  Checkbox,
  Pagination,
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
import 'antd/dist/reset.css';
import './StudentDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;
const { Option } = Select;
const API_URL = 'https://attendance-system-w70n.onrender.com/api';

const StudentDashboard = () => {
  const { token: { colorBgContainer } } = theme.useToken();
  const [collapsed, setCollapsed] = useState(window.innerWidth < 992);
  const [units, setUnits] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ attendanceRecords: [], weeklyEvents: [], dailyEvents: [] });
  const [attendanceRates, setAttendanceRates] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    rating: 0,
    text: '',
    pace: 0,
    interactivity: 0,
    clarity: null,
    resources: '',
    anonymous: false,
  });
  const [hasShownLowAttendanceAlert, setHasShownLowAttendanceAlert] = useState(false);
  const [viewMode, setViewMode] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(moment());
  const [pendingFeedbacks, setPendingFeedbacks] = useState([]);
  const [eventPage, setEventPage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);
  const [pageSize] = useState(5);
  const [eventSortOrder, setEventSortOrder] = useState('mostRecent');
  const [notificationSortOrder, setNotificationSortOrder] = useState('mostRecent');

  const navigate = useNavigate();

  const fetchAllData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const [profileRes, unitsRes, feedbackRes] = await Promise.all([
        getUserProfile(token),
        getStudentUnits(token),
        getPendingFeedbackAttendance()
      ]);

      const unitsData = Array.isArray(unitsRes) ? unitsRes : (unitsRes?.enrolledUnits || []);
      const sanitizedUnits = unitsData.filter((unit) => unit && unit._id && typeof unit._id === 'string' && unit._id.trim() !== '');
      setUnits(sanitizedUnits);

      if (profileRes._id) {
        const attendanceRes = await getStudentAttendance(profileRes._id);
        setAttendanceData(attendanceRes);
      }

      const newPendingFeedbacks = feedbackRes.pendingFeedbackRecords.map((record) => ({
        sessionId: record.session._id,
        unitId: record.session.unit._id,
        unitName: record.session.unit.name,
        title: "Feedback Available",
        message: "Please provide your feedback for the session.",
        timestamp: record.session.endTime || new Date(),
      }));

      // Filter out expired sessions on load
      const filteredFeedbacks = await Promise.all(
        newPendingFeedbacks.map(async (feedback) => {
          try {
            const { isExpired } = await fetchSessionStatus(feedback.unitId, feedback.sessionId);
            if (isExpired) {
              message.warning(`Notification dismissed: You cannot provide feedback for session ${feedback.sessionId} in ${feedback.unitName} since it is expired.`);
              return null;
            }
            return feedback;
          } catch (error) {
            console.error(`Error checking session ${feedback.sessionId}:`, error);
            return feedback; // Keep it if there's an error fetching status
          }
        })
      );

      setPendingFeedbacks((prev) => {
        const existingIds = new Set(prev.map((pf) => pf.sessionId));
        const validNewFeedbacks = filteredFeedbacks.filter((pf) => pf && !existingIds.has(pf.sessionId));
        return [...prev, ...validNewFeedbacks];
      });

    } catch (error) {
      console.error("Error fetching data:", error);
      message.error(`Failed to load data: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedFeedbacks = JSON.parse(localStorage.getItem('pendingFeedbacks')) || [];
    setPendingFeedbacks(savedFeedbacks);
  }, []);

  useEffect(() => {
    localStorage.setItem('pendingFeedbacks', JSON.stringify(pendingFeedbacks));
    console.log('Updated pendingFeedbacks in localStorage:', pendingFeedbacks);
  }, [pendingFeedbacks]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/login');
      return;
    }
    fetchAllData();
  }, [navigate, fetchAllData]);

  const calculateAttendanceRate = useCallback(
    (unitId) => {
      const unitData = attendanceData.attendanceRecords.filter(
        (record) => record.session.unit._id.toString() === unitId.toString()
      );
      if (!unitData.length) return null;
      const attendedSessions = unitData.filter((att) => att.status === 'Present').length;
      return ((attendedSessions / unitData.length) * 100).toFixed(2);
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
        content: 'Low attendance(<75%) in some units may risk not attaining the required average attendance rate for your semester!',
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
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          callback: function(value) {
            const label = this.getLabelForValue(value);
            return window.innerWidth < 576 && label.length > 10 ? label.substring(0, 10) + '...' : label;
          },
        },
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        navigate('/student/attendance-trends');
      }
    },
  };

  const filteredEvents = () => {
    let events = [];
    if (!selectedDate) {
      events = attendanceData.attendanceRecords.map((record) => ({
        title: `${record.session.unit?.name || 'Unknown'} - ${record.status || 'Unknown'}`,
        date: record.session.startTime ? moment(record.session.startTime) : null,
        status: record.status || 'Unknown',
        sessionId: record.session._id,
      }));
    } else if (viewMode === 'weekly') {
      const selectedWeek = attendanceData.weeklyEvents.find((week) =>
        week.week === selectedDate.format('MMM D - MMM D, YYYY')
      );
      events = selectedWeek
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
      events = selectedDay
        ? selectedDay.events.map((event) => ({
            title: `${event.unitName} - ${event.status}`,
            date: moment(event.startTime),
            status: event.status,
          }))
        : [];
    }

    return events.sort((a, b) => {
      const dateA = a.date ? a.date.valueOf() : 0;
      const dateB = b.date ? b.date.valueOf() : 0;
      return eventSortOrder === 'mostRecent' ? dateB - dateA : dateA - dateB;
    });
  };

  const renderCalendarEvents = () => {
    const events = filteredEvents();
    const totalEvents = events.length;
    const startIndex = (eventPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedEvents = events.slice(startIndex, endIndex);

    return (
      <Card style={{ borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', height: '100%' }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <AntTitle level={3} style={{ textAlign: 'center' }}>
            <CalendarOutlined style={{ marginRight: 4 }} /> Attendance Events
          </AntTitle>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space wrap size={4} className="event-controls">
              <Select
                value={viewMode}
                onChange={(value) => {
                  setViewMode(value);
                  setSelectedDate(value === 'daily' ? moment() : null);
                  setEventPage(1);
                }}
                style={{ width: 80, fontSize: '12px' }}
              >
                <Option value="daily">Daily</Option>
                <Option value="weekly">Weekly</Option>
              </Select>
              <DatePicker
                picker={viewMode === 'weekly' ? 'week' : 'date'}
                onChange={(date) => {
                  setSelectedDate(date);
                  setEventPage(1);
                }}
                value={selectedDate}
                format={viewMode === 'weekly' ? 'MMM D - MMM D, YYYY' : 'YYYY-MM-DD'}
                placeholder={`Select ${viewMode === 'weekly' ? 'Week' : 'Date'}`}
                style={{ width: 120, fontSize: '12px' }}
              />
              <Select
                value={eventSortOrder}
                onChange={(value) => {
                  setEventSortOrder(value);
                  setEventPage(1);
                }}
                style={{ width: 120, fontSize: '12px' }}
              >
                <Option value="mostRecent">Most Recent</Option>
                <Option value="oldest">Oldest</Option>
              </Select>
            </Space>
          </Space>
          {totalEvents > 0 ? (
            <>
              <List
                dataSource={paginatedEvents}
                renderItem={(item) => (
                  <List.Item key={item.sessionId || `${item.title}-${item.date?.toISOString()}`}>
                    <List.Item.Meta
                      title={item.title}
                      description={item.date ? item.date.format('YYYY-MM-DD') + ` (${item.status})` : 'No Date'}
                    />
                  </List.Item>
                )}
                style={{ maxHeight: '300px', overflow: 'auto' }}
              />
              <Pagination
                current={eventPage}
                pageSize={pageSize}
                total={totalEvents}
                onChange={(page) => setEventPage(page)}
                showSizeChanger={false}
                style={{ textAlign: 'center', marginTop: 16 }}
              />
            </>
          ) : (
            <p style={{ textAlign: 'center', color: '#888' }}>No events found for the selected period.</p>
          )}
        </Space>
      </Card>
    );
  };

  const fetchSessionStatus = async (unitId, sessionIdToCheck) => {
    try {
      const token = localStorage.getItem('token');
      const activeResponse = await axios.get(
        `${API_URL}/sessions/active/${unitId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const activeSession = activeResponse.data;

      if (activeSession && activeSession._id !== sessionIdToCheck && !activeSession.ended) {
        return { isExpired: true, latestSession: activeSession };
      }

      const lastSessionResponse = await axios.get(
        `${API_URL}/sessions/last/${unitId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const lastSession = lastSessionResponse.data;

      if (lastSession._id !== sessionIdToCheck && new Date(lastSession.startTime) > new Date(activeSession?.startTime || 0)) {
        return { isExpired: true, latestSession: lastSession };
      }

      return { isExpired: false, latestSession: lastSession };
    } catch (error) {
      console.error('Error fetching session status:', error);
      if (error.response?.status === 404) {
        const token = localStorage.getItem('token');
        const lastSession = await axios.get(
          `${API_URL}/sessions/last/${unitId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return { isExpired: lastSession.data._id !== sessionIdToCheck, latestSession: lastSession.data };
      }
      throw error;
    }
  };

  const checkFeedbackStatus = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/attendance/feedback/status/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.feedbackSubmitted;
    } catch (error) {
      console.error('Error checking feedback status:', error);
      return false;
    }
  };

  const renderNotifications = () => {
    const sortedNotifications = [...pendingFeedbacks].sort((a, b) => {
      const timeA = moment(a.timestamp).valueOf();
      const timeB = moment(b.timestamp).valueOf();
      return notificationSortOrder === 'mostRecent' ? timeB - timeA : timeA - timeB;
    });
    const totalNotifications = sortedNotifications.length;
    const startIndex = (notificationPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedNotifications = sortedNotifications.slice(startIndex, endIndex);

    const handleProvideFeedback = async (sessionId, unitId) => {
      try {
        const { isExpired, latestSession } = await fetchSessionStatus(unitId, sessionId);

        if (isExpired) {
          message.warning(`Notification dismissed: You cannot provide feedback for this session since it is expired.`);
          setPendingFeedbacks((prev) => prev.filter((pf) => pf.sessionId !== sessionId));
          return;
        }

        const feedbackSubmitted = await checkFeedbackStatus(sessionId);
        if (feedbackSubmitted) {
          message.info(`Notification dismissed: Feedback already submitted for this session.`);
          setPendingFeedbacks((prev) => prev.filter((pf) => pf.sessionId !== sessionId));
          return;
        }

        if (!latestSession.ended) {
          message.info('Feedback is only available after the session ends.');
          return;
        }

        const attendanceRecord = attendanceData.attendanceRecords.find(
          (rec) => rec.session._id === sessionId
        );
        if (attendanceRecord?.status !== 'Present') {
          message.info('You must mark attendance for this session to provide feedback.');
          return;
        }

        setActiveSessionId(sessionId);
        setFeedbackModalVisible(true);
      } catch (error) {
        console.error('Error checking session status:', error);
        message.error('Failed to verify session status.');
      }
    };

    return (
      <Card
        title={<><BellOutlined /> Notifications</>}
        style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', height: '100%' }}
        extra={
          totalNotifications > 0 && (
            <Button type="link" onClick={() => setPendingFeedbacks([])}>
              Clear All
            </Button>
          )
        }
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space size={4} style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Select
              value={notificationSortOrder}
              onChange={(value) => {
                setNotificationSortOrder(value);
                setNotificationPage(1);
              }}
              style={{ width: 120, fontSize: '12px' }}
            >
              <Option value="mostRecent">Most Recent</Option>
              <Option value="oldest">Oldest</Option>
            </Select>
          </Space>
          {totalNotifications > 0 ? (
            <>
              <List
                dataSource={paginatedNotifications}
                renderItem={(item) => {
                  const isFeedbackSubmitted = attendanceData.attendanceRecords.some(
                    (rec) => rec.session._id === item.sessionId && rec.feedbackSubmitted
                  );
                  return (
                    <List.Item
                      key={item.sessionId}
                      actions={[
                        <Button
                          key="provide-feedback"
                          type="primary"
                          size="small"
                          onClick={() => handleProvideFeedback(item.sessionId, item.unitId)}
                          disabled={isFeedbackSubmitted}
                        >
                          Provide
                        </Button>,
                        <Button
                          key="dismiss"
                          size="small"
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
                  );
                }}
                style={{ maxHeight: '300px', overflow: 'auto' }}
              />
              <Pagination
                current={notificationPage}
                pageSize={pageSize}
                total={totalNotifications}
                onChange={(page) => setNotificationPage(page)}
                showSizeChanger={false}
                style={{ textAlign: 'center', marginTop: 16 }}
              />
            </>
          ) : (
            <p style={{ textAlign: 'center', color: '#888' }}>No new notifications.</p>
          )}
        </Space>
      </Card>
    );
  };

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

  const openFeedbackModal = async (unitId) => {
    const unitAttendance = attendanceData.attendanceRecords
      .filter((data) => data.session.unit._id.toString() === unitId.toString())
      .sort((a, b) => new Date(b.session.endTime) - new Date(a.session.endTime));
    const latestSession = unitAttendance[0];
    if (!latestSession) {
      message.warning('No attendance records found for this unit.');
      return;
    }

    try {
      const session = await fetchSessionStatus(unitId, latestSession.session._id);
      if (session.isExpired) {
        message.warning('You cannot provide feedback for this session since it is expired.');
        return;
      }
      if (!session.latestSession.ended) {
        message.info('Feedback is only available after the latest session ends.');
        return;
      }
      if (latestSession.status !== 'Present') {
        message.info('You must mark attendance for the latest session to provide feedback.');
        return;
      }
      const feedbackSubmitted = await checkFeedbackStatus(latestSession.session._id);
      if (feedbackSubmitted) {
        message.info('Feedback already submitted for the latest session.');
        return;
      }
      setActiveSessionId(latestSession.session._id);
      setFeedbackModalVisible(true);
    } catch (error) {
      console.error('Error fetching session status:', error);
      message.error('Failed to fetch session status.');
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!activeSessionId) return message.error('No session selected.');

    if (
      feedbackData.rating === 0 ||
      feedbackData.pace === 0 ||
      feedbackData.interactivity === 0 ||
      feedbackData.clarity === null
    ) {
      message.error('Please complete all required feedback fields (marked with *).');
      return;
    }

    try {
      await submitFeedback({
        sessionId: activeSessionId,
        rating: feedbackData.rating,
        feedbackText: feedbackData.text || '',
        pace: feedbackData.pace,
        interactivity: feedbackData.interactivity,
        clarity: feedbackData.clarity,
        resources: feedbackData.resources || '',
        anonymous: feedbackData.anonymous,
      });
      message.success('Feedback submitted successfully!');
      setFeedbackModalVisible(false);
      setFeedbackData({ rating: 0, text: '', pace: 0, interactivity: 0, clarity: null, resources: '', anonymous: false });
      setAttendanceData((prev) => ({
        ...prev,
        attendanceRecords: prev.attendanceRecords.map((rec) =>
          rec.session._id === activeSessionId ? { ...rec, feedbackSubmitted: true } : rec
        ),
      }));
      // Auto-dismiss the notification after successful submission
      setPendingFeedbacks((prev) => {
        const updatedFeedbacks = prev.filter((pf) => pf.sessionId !== activeSessionId);
        if (prev.length > updatedFeedbacks.length) {
          message.info(`Notification for session ${activeSessionId} dismissed after feedback submission.`);
        }
        return updatedFeedbacks;
      });
      await fetchAllData();
    } catch (error) {
      console.error('Feedback submission failed:', error);
      message.error(`Error submitting feedback: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleAttendClick = async (unitId) => {
    if (!unitId || typeof unitId !== 'string' || unitId.trim() === '' || unitId === 'undefined') {
      console.error("Invalid unitId:", unitId);
      message.error("Unit ID is missing or invalid.");
      return;
    }
    try {
      const session = await getActiveSessionForUnit(unitId);
      if (session && session._id && !session.ended) {
        navigate(`/qr-scanner/${unitId}`);
      } else {
        message.info("No active session is currently available for this unit.");
      }
    } catch (err) {
      console.error('Error checking active session:', err);
      const errorMessage = err.response?.status === 404
        ? "No active session is currently available for this unit."
        : "Unable to check for an active session at this time.";
      message.info(errorMessage);
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header
        style={{
          padding: '0 16px',
          background: colorBgContainer,
          position: 'fixed',
          width: '100%',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Space>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
        </Space>
        <AntTitle
          level={3}
          style={{
            margin: 0,
            flex: 1,
            textAlign: 'center',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: collapsed ? 'none' : 'block'
          }}
        >
          Student Dashboard
        </AntTitle>
        <AntTitle
          level={3}
          style={{
            margin: 0,
            display: collapsed ? 'inline' : 'none'
          }}
        >
          Student Dashboard
        </AntTitle>
        <Dropdown menu={{ items: profileItems }} trigger={['click']}>
          <Button type="text" icon={<UserOutlined style={{ fontSize: 24 }} />} style={{ marginRight: 24 }} />
        </Dropdown>
      </Header>

      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={250}
          breakpoint="lg"
          collapsedWidth={80}
          style={{
            background: colorBgContainer,
            marginTop: 64,
            position: 'fixed',
            height: 'calc(100vh - 64px)',
            overflow: 'auto',
            zIndex: 11
          }}
        >
          <div className="demo-logo-vertical" />
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            items={[
              { key: '1', icon: <BookOutlined />, label: 'My Units', onClick: () => scrollToSection('my-units') },
              { key: '2', icon: <CheckCircleOutlined />, label: 'Attendance Overview', onClick: () => scrollToSection('attendance-overview') },
              { key: '3', icon: <CheckCircleOutlined />, label: 'AttendanceTrends', onClick: () => navigate('/student/attendance-trends') },
            ]}
          />
        </Sider>

        <Content
          style={{
            margin: collapsed ? '64px 16px 16px 80px' : '64px 16px 16px 250px',
            padding: 24,
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
            transition: 'margin-left 0.2s',
            marginLeft: collapsed ? 80 : 250,
          }}
        >
          <Spin spinning={loading} tip="Loading data...">
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12}>
                <Card
                  className="summary-card"
                  style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', borderRadius: 10, textAlign: 'center' }}
                  styles={{ body: { padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } }}
                >
                  <Space direction="vertical">
                    <BookOutlined style={{ fontSize: 24 }} />
                    <h3 style={{ margin: '8px 0' }}>Total Units</h3>
                    <h1 style={{ margin: 0 }}>{units.length}</h1>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card
                  className="summary-card"
                  style={{ background: 'linear-gradient(135deg, #52c41a, #389e0d)', color: 'white', borderRadius: 10, textAlign: 'center' }}
                  styles={{ body: { padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } }}
                >
                  <Space direction="vertical">
                    <CheckCircleOutlined style={{ fontSize: 24 }} />
                    <h3 style={{ margin: '8px 0' }}>Attendance Rate</h3>
                    <h1 style={{ margin: 0 }}>{attendanceRates.length ? Math.round(attendanceRates.reduce((sum, rate) => sum + (rate.value === null ? 0 : parseFloat(rate.value)), 0) / attendanceRates.length) : 0}%</h1>
                  </Space>
                </Card>
              </Col>
            </Row>

            <AntTitle id="my-units" level={2} style={{ textAlign: 'center', marginBottom: 16 }}>My Units</AntTitle>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {units.map((unit) => unit._id ? (
                <Col xs={24} sm={12} md={8} lg={6} key={unit._id}>
                  <Card
                    title={unit.name || 'Untitled Unit'}
                    extra={<span>{unit.code || 'N/A'}</span>}
                    style={{ borderRadius: 10, width: '100%' }}
                    styles={{ body: { padding: '16px' }, header: { padding: '8px 16px', whiteSpace: 'normal', wordBreak: 'break-word' } }}
                    onClick={() => setSelectedUnit(unit)}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size={16}>
                      {(() => {
                        const rate = calculateAttendanceRate(unit._id);
                        return rate === null ? (
                          <div style={{ color: '#888' }}>No sessions</div>
                        ) : (
                          <div style={{ background: '#e8ecef', borderRadius: 6, overflow: 'hidden', height: 20 }}>
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
                        <Col span={24}>
                          <Button type="primary" icon={<QrcodeOutlined />} block onClick={(e) => { e.stopPropagation(); handleAttendClick(unit._id); }}>Attend</Button>
                        </Col>
                        <Col span={24}>
                          <Button
                            block
                            onClick={(e) => { e.stopPropagation(); openFeedbackModal(unit._id); }}
                            disabled={attendanceData.attendanceRecords.some((rec) => rec.session.unit._id.toString() === unit._id.toString() && rec.feedbackSubmitted)}
                          >
                            Feedback
                          </Button>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                </Col>
              ) : null)}
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} md={12}>
                {renderNotifications()}
              </Col>
              <Col xs={24} md={12}>
                {renderCalendarEvents()}
              </Col>
            </Row>

            <AntTitle id="attendance-overview" level={2} style={{ textAlign: 'center', marginBottom: 16 }}>Attendance Overview</AntTitle>
            <Card style={{ borderRadius: 10, marginBottom: 64 }}>
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
                  <p>Overall Satisfaction <span style={{ color: 'red' }}>*</span></p>
                  <Rate allowHalf value={feedbackData.rating} onChange={(value) => setFeedbackData({ ...feedbackData, rating: value })} />
                </div>
                <div>
                  <p>Pace of the Session (Slow to Fast) <span style={{ color: 'red' }}>*</span></p>
                  <Slider
                    min={0}
                    max={100}
                    value={feedbackData.pace}
                    onChange={(value) => setFeedbackData({ ...feedbackData, pace: value })}
                    marks={{ 0: 'Too Slow', 50: 'Just Right', 100: 'Too Fast' }}
                  />
                </div>
                <div>
                  <p>Interactivity Level <span style={{ color: 'red' }}>*</span></p>
                  <Rate value={feedbackData.interactivity} onChange={(value) => setFeedbackData({ ...feedbackData, interactivity: value })} />
                </div>
                <div>
                  <p>Was the content clear? <span style={{ color: 'red' }}>*</span></p>
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
                  placeholder="Suggestions for resources or improvements (optional)"
                  value={feedbackData.resources}
                  onChange={(e) => setFeedbackData({ ...feedbackData, resources: e.target.value })}
                />
                <Checkbox
                  checked={feedbackData.anonymous}
                  onChange={(e) => setFeedbackData({ ...feedbackData, anonymous: e.target.checked })}
                >
                  Submit anonymously
                </Checkbox>
              </Space>
            </Modal>
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentDashboard;