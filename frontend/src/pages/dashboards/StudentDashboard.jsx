import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStudentAttendance,
  getStudentUnits,
  getUserProfile,
  submitFeedback,
  getActiveSessionForUnit,
  getPendingFeedbackAttendance,
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
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  LogoutOutlined,
  QrcodeOutlined,
  CalendarOutlined,
  BellOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import { motion } from 'framer-motion';
import 'antd/dist/reset.css';
import './StudentDashboard.css';
import { ThemeContext } from '../../context/ThemeContext';
import { useStyles } from '../../styles/styles.js';
import { useContext } from 'react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;
const { Option } = Select;
const API_URL = 'https://attendance-system-w70n.onrender.com/api';

const StudentDashboard = () => {
  const { isDarkMode, setIsDarkMode, themeColors } = useContext(ThemeContext);
  const styles = useStyles(isDarkMode, themeColors);
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(window.innerWidth < 992);
  const [units, setUnits] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ attendanceRecords: [], weeklyEvents: [], dailyEvents: [] });
  const [attendanceRates, setAttendanceRates] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [username, setUsername] = useState('');
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
  const [unitSessionStatus, setUnitSessionStatus] = useState({});
  const [eventPage, setEventPage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);
  const [pageSize] = useState(5);
  const [eventSortOrder, setEventSortOrder] = useState('mostRecent');
  const [notificationSortOrder, setNotificationSortOrder] = useState('mostRecent');
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [deviceModalConfirmed, setDeviceModalConfirmed] = useState(false);

  const fetchAllData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Check if we should throttle the feedback fetch
    const lastFetchTime = localStorage.getItem('lastFeedbackFetch');
    const now = Date.now();
    const FETCH_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown

    if (lastFetchTime && (now - parseInt(lastFetchTime)) < FETCH_COOLDOWN) {
      return; // Skip fetching if within cooldown period
    }

    setLoading(true);
    try {
      const [profileRes, unitsRes, feedbackRes] = await Promise.all([
        getUserProfile(token),
        getStudentUnits(token),
        getPendingFeedbackAttendance(),
      ]);

      // Store fetch timestamp
      localStorage.setItem('lastFeedbackFetch', now.toString());

      // Get processed notification IDs from localStorage
      const processedNotifications = new Set(JSON.parse(localStorage.getItem('processedNotifications') || '[]'));

      // Set username from profile response
      if (profileRes && profileRes.firstName) {
        setUsername(profileRes.firstName);
      }

      const unitsData = Array.isArray(unitsRes) ? unitsRes : (unitsRes?.enrolledUnits || []);
      const sanitizedUnits = unitsData.filter((unit) => unit && unit._id && typeof unit._id === 'string' && unit._id.trim() !== '');
      setUnits(sanitizedUnits);

      if (profileRes._id) {
        const attendanceRes = await getStudentAttendance(profileRes._id);
        setAttendanceData(attendanceRes);

        const sessionStatusPromises = sanitizedUnits.map(async (unit) => {
          const unitAttendance = attendanceRes.attendanceRecords
            .filter((data) => data.session.unit._id.toString() === unit._id.toString())
            .sort((a, b) => new Date(b.session.endTime) - new Date(a.session.endTime));
          const latestSession = unitAttendance[0];
          if (!latestSession) return { unitId: unit._id, isExpired: true, feedbackSubmitted: false };

          const { isExpired } = await fetchSessionStatus(unit._id, latestSession.session._id);
          return {
            unitId: unit._id,
            isExpired,
            feedbackSubmitted: latestSession.feedbackSubmitted || false,
          };
        });

        const sessionStatuses = await Promise.all(sessionStatusPromises);
        setUnitSessionStatus(Object.fromEntries(sessionStatuses.map(status => [status.unitId, status])));
      }

      const newPendingFeedbacks = feedbackRes.pendingFeedbackRecords
        .filter(record => !processedNotifications.has(record.session._id))
        .map((record) => ({
          sessionId: record.session._id,
          unitId: record.session.unit._id,
          unitName: record.session.unit.name,
          title: "Feedback Available",
          message: "Please provide your feedback for the session.",
          timestamp: record.session.endTime || new Date(),
        }));

      if (newPendingFeedbacks.length > 0) {
        const checkedFeedbacks = await Promise.all(
          newPendingFeedbacks.map(async (feedback) => {
            try {
              const { isExpired } = await fetchSessionStatus(feedback.unitId, feedback.sessionId);
              if (isExpired) {
                // Add to processed notifications
                processedNotifications.add(feedback.sessionId);
                return null;
              }
              return feedback;
            } catch (error) {
              console.error(`Error checking session ${feedback.sessionId}:`, error);
              return null;
            }
          })
        );

        // Update processed notifications in localStorage
        localStorage.setItem('processedNotifications', JSON.stringify([...processedNotifications]));

        // Filter out null values and update state
        const validFeedbacks = checkedFeedbacks.filter(f => f !== null);
        setPendingFeedbacks(prev => [...prev, ...validFeedbacks]);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response && error.response.status === 429) {
        message.error("Too many requests. Please wait a moment and try again.");
      } else {
        message.error("Unable to load data. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [pendingFeedbacks]);

  useEffect(() => {
    const savedFeedbacks = JSON.parse(localStorage.getItem('pendingFeedbacks')) || [];
    setPendingFeedbacks(savedFeedbacks);
  }, []);

  useEffect(() => {
    localStorage.setItem('pendingFeedbacks', JSON.stringify(pendingFeedbacks));
  }, [pendingFeedbacks]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/login');
      return;
    }
    fetchAllData();

    const handleResize = () => setCollapsed(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    message.success({
      content: 'Logged out successfully.',
      style: { color: themeColors.accent }
    });
    navigate('/auth/login');
  };

  const getAttendanceColor = (rate) => {
    if (rate === null) return themeColors.accent;
    const value = parseFloat(rate);
    if (value >= 75) return themeColors.secondary;
    if (value >= 50) return themeColors.primary || themeColors.warning || themeColors.accent;  // Use primary or fallback
    if (value >= 25) return themeColors.warning || themeColors.accent; // Use warning or fallback
    return themeColors.accent;
  };

  const chartData = {
    labels: attendanceRates.map((rate) => rate.label),
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: attendanceRates.map((rate) => rate.value === null ? 0 : rate.value),
        backgroundColor: attendanceRates.map((rate) => getAttendanceColor(rate.value)),
        borderColor: attendanceRates.map((rate) => getAttendanceColor(rate.value)),
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
      legend: { position: 'top', labels: { color: themeColors.text } },
      title: { display: true, text: 'Attendance Overview', color: themeColors.text, font: { size: 18, weight: 'bold' } },
      tooltip: { callbacks: { label: (context) => `${context.raw === 0 && attendanceRates[context.dataIndex].value === null ? 'N/A' : context.raw}%` } },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: 'Attendance Rate (%)', color: themeColors.text },
        grid: { color: `${themeColors.text}20` },
        ticks: { color: themeColors.text },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          color: themeColors.text,
          callback: function (value) {
            const label = this.getLabelForValue(value);
            return window.innerWidth < 576 && label.length > 10 ? label.substring(0, 10) + '...' : label;
          },
        },
        grid: { display: false },
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
      <motion.div initial="hidden" animate="visible" variants={styles.cardVariants}>
        <Card style={styles.card}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <AntTitle level={3} style={{ textAlign: 'center', color: themeColors.text }}>
              <CalendarOutlined style={{ marginRight: 8 }} /> Attendance Events
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
                        title={<span style={{ color: themeColors.text }}>{item.title}</span>}
                        description={<span style={{ color: `${themeColors.text}80` }}>{item.date ? item.date.format('YYYY-MM-DD') + ` (${item.status})` : 'No Date'}</span>}
                      />
                    </List.Item>
                  )}
                  style={{ maxHeight: '300px', overflow: 'auto' }}
                />
                <Pagination
                  current={eventPage}
                  pageSize={pageSize}
                  total={totalEvents}
                  onChange={(page) => {
                    // Only allow navigation to pages that have data
                    const maxPage = Math.ceil(totalEvents / pageSize);
                    if (page <= maxPage) {
                      setEventPage(page);
                    }
                  }}
                  showSizeChanger={false}
                  style={{ textAlign: 'center', marginTop: 16 }}
                />
              </>
            ) : (
              <p style={{ textAlign: 'center', color: `${themeColors.text}80` }}>No events found for the selected period.</p>
            )}
          </Space>
        </Card>
      </motion.div>
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
        let shouldDismiss = false;
        let dismissReason = '';

        if (isExpired) {
          shouldDismiss = true;
          dismissReason = 'expired session';
        } else {
          const feedbackSubmitted = await checkFeedbackStatus(sessionId);
          if (feedbackSubmitted) {
            shouldDismiss = true;
            dismissReason = 'feedback already submitted';
          } else if (!latestSession.ended) {
            message.info('Feedback is only available after the session ends.');
            return;
          } else {
            const attendanceRecord = attendanceData.attendanceRecords.find(
              (rec) => rec.session._id === sessionId
            );
            if (attendanceRecord?.status !== 'Present') {
              message.info('You must mark attendance for this session to provide feedback.');
              return;
            }
          }
        }

        if (shouldDismiss) {
          // Still show individual messages when manually clicking on a notification
          message.info(`Notification dismissed: Cannot provide feedback for this ${dismissReason}.`);
          setPendingFeedbacks((prev) => prev.filter((pf) => pf.sessionId !== sessionId));
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
      <motion.div initial="hidden" animate="visible" variants={styles.cardVariants}>
        <Card
          title={<span style={{ color: themeColors.text }}><BellOutlined style={{ marginRight: 8 }} /> Notifications</span>}
          style={styles.card}
          extra={
            totalNotifications > 0 && (
              <Button type="link" onClick={() => setPendingFeedbacks([])} style={{ color: themeColors.accent }}>
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
                            style={{ ...styles.button, color: '#fff !important' }}
                            className="provide-button"
                          >
                            <span style={{ color: '#fff' }}>Provide</span>
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
                          title={<span style={{ color: themeColors.text }}>{item.title}</span>}
                          description={<span style={{ color: `${themeColors.text}80` }}>{`${item.message} (Unit: ${item.unitName}) - ${moment(item.timestamp).fromNow()}`}</span>}
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
                  onChange={(page) => {
                    // Only allow navigation to pages that have data
                    const maxPage = Math.ceil(totalNotifications / pageSize);
                    if (page <= maxPage) {
                      setNotificationPage(page);
                    }
                  }}
                  showSizeChanger={false}
                  style={{ textAlign: 'center', marginTop: 16 }}
                />
              </>
            ) : (
              <p style={{ textAlign: 'center', color: `${themeColors.text}80` }}>No new notifications.</p>
            )}
          </Space>
        </Card>
      </motion.div>
    );
  };

  const profileItems = [
    {
      key: '1',
      label: 'View Profile',
      icon: <UserOutlined style={{ color: themeColors.text }} />,
      onClick: () => navigate('/student/profile')
    },
    {
      key: '2',
      label: 'Settings',
      icon: <SettingOutlined style={{ color: themeColors.text }} />,
      onClick: () => navigate('/student/settings')
    },
    { type: 'divider' },
    {
      key: '3',
      label: 'Logout',
      icon: <LogoutOutlined style={{ color: '#fff' }} />,
      danger: false,
      style: {
        color: '#fff',
        backgroundColor: themeColors.accent,
        borderRadius: '4px'
      },
      onClick: () =>
        Modal.confirm({
          title: <span style={{ color: themeColors.text }}>Confirm Logout</span>,
          content: <span style={{ color: themeColors.text }}>Are you sure you want to logout?</span>,
          onOk: logout,
          centered: true,
          okButtonProps: {
            style: {
              ...styles.button,
              backgroundColor: themeColors.accent,
              borderColor: themeColors.accent,
              color: '#fff'
            }
          },
          cancelButtonProps: {
            style: {
              borderColor: themeColors.text
            }
          }
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

    if (!latestSession.session.ended) {
      message.info('Feedback is only available after the latest session ends.');
      return;
    }
    if (latestSession.status !== 'Present') {
      message.info('You must mark attendance for the latest session to provide feedback.');
      return;
    }
    setActiveSessionId(latestSession.session._id);
    setFeedbackModalVisible(true);
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

      // Silently dismiss notifications without showing message
      setPendingFeedbacks((prev) => prev.filter((pf) => pf.sessionId !== activeSessionId));

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

    // Check if the user has already confirmed the device analysis modal
    const hasConfirmedDeviceAnalysis = localStorage.getItem('hasConfirmedDeviceAnalysis');
    if (!hasConfirmedDeviceAnalysis && !deviceModalConfirmed) {
      setDeviceModalVisible(true);
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

  // New function to handle device modal confirmation
  const handleDeviceModalConfirm = () => {
    localStorage.setItem('hasConfirmedDeviceAnalysis', 'true');
    setDeviceModalConfirmed(true);
    setDeviceModalVisible(false);

    // Because we're in an async context, we need to re-trigger the latest attend click
    if (selectedUnit && selectedUnit._id) {
      setTimeout(() => handleAttendClick(selectedUnit._id), 0);
    }
  };

  // New function to handle device modal cancellation
  const handleDeviceModalCancel = () => {
    setDeviceModalVisible(false);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Layout style={styles.layout} data-theme={isDarkMode ? 'dark' : 'light'}>
      <style>
        {styles.globalStyles}
        {`
          /* Add custom spin size styles */
          .custom-spin.ant-spin {
            font-size: 24px;
          }
          
          .custom-spin .ant-spin-text {
            margin-top: 16px;
            font-size: 16px;
          }
          
          .custom-spin.ant-spin-spinning {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 400px;
          }
          
          .custom-spin .ant-spin-dot {
            font-size: 48px;
          }
          
          .custom-spin .ant-spin-dot i {
            width: 24px;
            height: 24px;
          }

          /* ... rest of existing styles ... */
          
          /* Remove the dark mode spinner overrides and other styles remain the same */
          
          /* Light mode pagination styling */
          [data-theme='light'] .ant-pagination-item a {
            color: #000 !important;
          }
          
          [data-theme='light'] .ant-pagination-item:hover a {
            color: #000 !important; /* Keep black on hover */
          }
          
          [data-theme='light'] .ant-pagination-item-active a {
            color: #fff !important; /* Active item remains white */
          }
          
          [data-theme='light'] .ant-pagination-item-link .anticon {
            color: #000 !important; /* Black arrows in light mode */
          }
          
          [data-theme='light'] .ant-pagination-prev:hover .ant-pagination-item-link,
          [data-theme='light'] .ant-pagination-next:hover .ant-pagination-item-link {
            color: #000 !important; /* Keep arrows black on hover */
          }
          
          /* Light mode ellipsis */
          [data-theme='light'] .ant-pagination-jump-prev .ant-pagination-item-container .ant-pagination-item-ellipsis,
          [data-theme='light'] .ant-pagination-jump-next .ant-pagination-item-container .ant-pagination-item-ellipsis {
            color: #000 !important; /* Black ellipsis */
          }
          
          /* Dark mode pagination styling */
          [data-theme='dark'] .ant-pagination-item a {
            color: #fff !important; /* White color for items */
          }
          
          [data-theme='dark'] .ant-pagination-item:hover a {
            color: #fff !important; /* Stay white on hover */
          }
          
          [data-theme='dark'] .ant-pagination-item-active a {
            color: #fff !important; /* Active item is white */
          }
          
          [data-theme='dark'] .ant-pagination-item-link .anticon {
            color: #fff !important; /* White arrows */
          }
          
          [data-theme='dark'] .ant-pagination-prev:hover .ant-pagination-item-link,
          [data-theme='dark'] .ant-pagination-next:hover .ant-pagination-item-link {
            color: #fff !important; /* Keep arrows white on hover */
          }
          
          /* Dark mode ellipsis */
          [data-theme='dark'] .ant-pagination-jump-prev .ant-pagination-item-container .ant-pagination-item-ellipsis,
          [data-theme='dark'] .ant-pagination-jump-next .ant-pagination-item-container .ant-pagination-item-ellipsis {
            color: #fff !important; /* White ellipsis */
          }

          /* Dark mode slider marks */
          [data-theme='dark'] .ant-slider-mark-text {
            color: #fff !important;
          }

          /* Checkbox styles */
          .ant-checkbox-checked .ant-checkbox-inner {
            background-color: ${themeColors.primary} !important;
            border-color: ${themeColors.primary} !important;
          }

          /* Button text color fixes */
          .ant-btn-primary:hover span {
            color: #fff !important;
          }

          /* Modal button styles */
          .ant-modal-footer .ant-btn {
            transition: opacity 0.3s;
          }

          .ant-modal-footer .ant-btn:hover {
            opacity: 0.8;
          }

          .ant-btn-primary span,
          .ant-modal-footer .ant-btn span {
            color: #fff !important;
          }

          .ant-btn-primary:hover span,
          .ant-modal-footer .ant-btn:hover span {
            color: #fff !important;
          }

          /* Target feedback modal cancel button specifically */
          .ant-modal-footer button.ant-btn:not(.ant-btn-primary) {
            background-color: ${themeColors.accent} !important;
            border-color: ${themeColors.accent} !important;
            color: #fff !important;
            opacity: 1;
            transition: opacity 0.3s;
          }

          .ant-modal-footer button.ant-btn:not(.ant-btn-primary):hover {
            opacity: 0.8;
            background-color: ${themeColors.accent} !important;
            border-color: ${themeColors.accent} !important;
            color: #fff !important;
          }

          /* Dark mode Select dropdown styles */
          [data-theme='dark'] .ant-select-selector {
            background-color: ${themeColors.background} !important;
            border-color: ${themeColors.border} !important;
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-select-selection-item {
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-select-dropdown {
            background-color: ${themeColors.background} !important;
          }

          [data-theme='dark'] .ant-select-item {
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
            background-color: ${themeColors.border} !important;
          }

          [data-theme='dark'] .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
            background-color: ${themeColors.primary}40 !important;
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-select-arrow {
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-select-dropdown .ant-select-item {
            background-color: ${themeColors.background} !important;
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-select-dropdown .ant-select-item-option-content {
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-select-dropdown .ant-select-item-option-active {
            background-color: ${themeColors.border} !important;
          }

          [data-theme='dark'] .ant-select-dropdown .ant-select-item-option-selected {
            background-color: ${themeColors.primary}40 !important;
          }

          [data-theme='dark'] .ant-select-dropdown .ant-select-item:hover {
            background-color: ${themeColors.border} !important;
          }

          [data-theme='dark'] .ant-select-selection-item {
            color: ${themeColors.text} !important;
          }

          /* Dark mode calendar and datepicker styles */
          [data-theme='dark'] .ant-picker {
            background-color: ${themeColors.background} !important;
            border-color: ${themeColors.border} !important;
          }

          [data-theme='dark'] .ant-picker-suffix {
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-picker-input > input {
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-picker-dropdown {
            background-color: ${themeColors.background} !important;
          }

          [data-theme='dark'] .ant-picker-content th {
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-picker-header {
            color: ${themeColors.text} !important;
            border-bottom-color: ${themeColors.border} !important;
          }

          [data-theme='dark'] .ant-picker-header button {
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-picker-header-view {
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-picker-cell {
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-picker-cell-disabled {
            color: ${themeColors.text}40 !important;
          }

          [data-theme='dark'] .ant-picker-cell-in-view {
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-picker-content {
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-picker-cell:hover:not(.ant-picker-cell-selected):not(.ant-picker-cell-range-start):not(.ant-picker-cell-range-end):not(.ant-picker-cell-range-hover-start):not(.ant-picker-cell-range-hover-end) .ant-picker-cell-inner {
            background: ${themeColors.border} !important;
          }

          [data-theme='dark'] .ant-picker-cell-inner {
            color: ${themeColors.text} !important;
          }

          [data-theme='dark'] .ant-picker-cell-today .ant-picker-cell-inner::before {
            border-color: ${themeColors.primary} !important;
          }

          [data-theme='dark'] .ant-picker-cell-selected .ant-picker-cell-inner {
            background: ${themeColors.primary} !important;
          }
        `}
      </style>
      <Header style={styles.header}>
        <Space>
          <Button
            type="text"
            icon={collapsed ?
              <MenuUnfoldOutlined style={{ color: isDarkMode ? '#fff' : undefined }} /> :
              <MenuFoldOutlined style={{ color: isDarkMode ? '#fff' : undefined }} />
            }
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18, width: 64, height: 64 }}
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
            display: window.innerWidth < 992 ? 'none' : 'block',
            color: themeColors.text,
          }}
        >
          Student Dashboard
        </AntTitle>
        <AntTitle
          level={3}
          style={{
            margin: 0,
            display: window.innerWidth >= 992 ? 'none' : 'inline',
            color: themeColors.text,
          }}
        >
          Student Dashboard
        </AntTitle>
        <Space>
          <Switch
            checked={isDarkMode}
            onChange={() => setIsDarkMode(!isDarkMode)}
            checkedChildren="Dark"
            unCheckedChildren="Light"
          />
          <Dropdown menu={{ items: profileItems }} trigger={['click']}>
            <Button type="text" icon={<UserOutlined style={{ fontSize: 24 }} />} />
          </Dropdown>
        </Space>
      </Header>

      <Layout>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={250} breakpoint="lg" collapsedWidth={80} style={styles.sider}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            items={[
              { key: '1', icon: <BookOutlined style={{ color: themeColors.text }} />, label: 'My Units', onClick: () => scrollToSection('my-units') },
              { key: '2', icon: <BarChartOutlined style={{ color: themeColors.text }} />, label: 'Attendance Overview', onClick: () => scrollToSection('attendance-overview') },
              { key: '3', icon: <LineChartOutlined style={{ color: themeColors.text }} />, label: 'Attendance Trends', onClick: () => navigate('/student/attendance-trends') },
            ]}
          />
        </Sider>

        <Content style={{ ...styles.content, marginLeft: collapsed ? 88 : 258 }}>
          <Spin
            size="large"
            spinning={loading}
            tip={<span style={{ color: isDarkMode ? '#fff' : themeColors.text, fontSize: '16px', fontWeight: 500 }}>
              Loading data...
            </span>}
            className="custom-spin"
          >
            {username && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <AntTitle level={2} style={{ textAlign: 'center', marginBottom: 24, color: themeColors.text }}>
                  Welcome, {username}! 👋
                </AntTitle>
              </motion.div>
            )}

            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12}>
                <motion.div initial="hidden" animate="visible" variants={styles.cardVariants}>
                  <Card hoverable className="summary-card-1" style={styles.summaryCard1}>
                    <Space direction="vertical">
                      <BookOutlined style={{ fontSize: 28, color: '#fff' }} />
                      <h3 style={{ fontWeight: 600, margin: '8px 0', color: '#fff' }}>Total Units</h3>
                      <h1 style={{ fontSize: 32, margin: 0, color: '#fff' }}>{units.length}</h1>
                    </Space>
                  </Card>
                </motion.div>
              </Col>
              <Col xs={24} sm={12}>
                <motion.div initial="hidden" animate="visible" variants={styles.cardVariants}>
                  <Card hoverable className="summary-card-2" style={styles.summaryCard2}>
                    <Space direction="vertical">
                      <PieChartOutlined style={{ fontSize: 28, color: '#fff' }} />
                      <h3 style={{ fontWeight: 600, margin: '8px 0', color: '#fff' }}>Attendance Rate</h3>
                      <h1 style={{ fontSize: 32, margin: 0, color: '#fff' }}>
                        {attendanceRates.length ? Math.round(attendanceRates.reduce((sum, rate) => sum + (rate.value === null ? 0 : parseFloat(rate.value)), 0) / attendanceRates.length) : 0}%
                      </h1>
                    </Space>
                  </Card>
                </motion.div>
              </Col>
            </Row>

            <AntTitle id="my-units" level={2} style={{ textAlign: 'center', marginBottom: 24, color: themeColors.text }}>
              My Units
            </AntTitle>
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
              {units.map((unit) => unit._id ? (
                <Col xs={24} sm={12} md={8} lg={6} key={unit._id}>
                  <motion.div initial="hidden" animate="visible" variants={styles.cardVariants}>
                    <Card
                      title={<span style={{ color: themeColors.text, fontWeight: 600 }}>{unit.name || 'Untitled Unit'}</span>}
                      extra={<span style={{ color: `${themeColors.text}80` }}>{unit.code || 'N/A'}</span>}
                      hoverable
                      style={styles.card}
                      styles={{ body: { padding: '16px' }, header: { padding: '8px 16px', whiteSpace: 'normal', wordBreak: 'break-word' } }}
                      onClick={() => setSelectedUnit(unit)}
                    >
                      <Space direction="vertical" style={{ width: '100%' }} size={16}>
                        {(() => {
                          const rate = calculateAttendanceRate(unit._id);
                          return rate === null ? (
                            <div style={{ color: `${themeColors.text}80` }}>No sessions</div>
                          ) : (
                            <div style={{ background: `${themeColors.text}20`, borderRadius: 6, overflow: 'hidden', height: 20 }}>
                              <div style={{
                                width: `${rate}%`,
                                minWidth: rate === '0.00' ? '20px' : '0',
                                background: getAttendanceColor(rate),
                                color: '#fff',
                                textAlign: 'center',
                                padding: '2px 0',
                                transition: 'width 0.5s ease',
                              }}>
                                {rate}%
                              </div>
                            </div>
                          );
                        })()}
                        <Row gutter={[8, 8]} justify="space-between">
                          <Col span={24}>
                            <Button
                              type="primary"
                              icon={<QrcodeOutlined style={{ color: '#fff' }} />}
                              block
                              onClick={(e) => { e.stopPropagation(); handleAttendClick(unit._id); }}
                              style={{ ...styles.button, color: '#fff !important' }}
                              className="attend-button"
                            >
                              <span style={{ color: '#fff' }}>Attend</span>
                            </Button>
                          </Col>
                          <Col span={24}>
                            <Button
                              block
                              onClick={(e) => { e.stopPropagation(); openFeedbackModal(unit._id); }}
                              disabled={
                                unitSessionStatus[unit._id]?.isExpired ||
                                unitSessionStatus[unit._id]?.feedbackSubmitted ||
                                !attendanceData.attendanceRecords.some((rec) => rec.session.unit._id.toString() === unit._id.toString())
                              }
                            >
                              Feedback
                            </Button>
                          </Col>
                        </Row>
                      </Space>
                    </Card>
                  </motion.div>
                </Col>
              ) : null)}
            </Row>

            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
              <Col xs={24} md={12}>
                {renderNotifications()}
              </Col>
              <Col xs={24} md={12}>
                {renderCalendarEvents()}
              </Col>
            </Row>

            <AntTitle id="attendance-overview" level={2} style={{ textAlign: 'center', marginBottom: 24, color: themeColors.text }}>
              Attendance Overview
            </AntTitle>
            <Card style={styles.card}>
              <div style={{ height: '400px' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
              <Button
                type="primary"
                style={{ ...styles.button, color: '#fff !important' }}
                onClick={exportAttendanceData}
                className="export-button"
              >
                <span style={{ color: '#fff' }}>Export Data</span>
              </Button>
            </Card>

            <Modal
              open={!!selectedUnit}
              title={<span style={{ color: themeColors.text }}>{selectedUnit?.name}</span>}
              onCancel={() => setSelectedUnit(null)}
              footer={<Button onClick={() => setSelectedUnit(null)}>Close</Button>}
              centered
              width={Math.min(window.innerWidth * 0.9, 500)}
            >
              {selectedUnit && (
                <Space direction="vertical" style={{ color: themeColors.text }}>
                  <p><strong>Code:</strong> {selectedUnit.code || 'N/A'}</p>
                  <p><strong>Lecturer:</strong> {selectedUnit.lecturer || 'N/A'}</p>
                  <p><strong>Description:</strong> {selectedUnit.description || 'N/A'}</p>
                </Space>
              )}
            </Modal>

            <Modal
              open={feedbackModalVisible}
              title={<span style={{ color: themeColors.text }}>Session Feedback</span>}
              onCancel={() => setFeedbackModalVisible(false)}
              onOk={handleFeedbackSubmit}
              centered
              width={Math.min(window.innerWidth * 0.9, 600)}
              okButtonProps={{
                style: {
                  ...styles.button,
                  backgroundColor: themeColors.accent,
                  borderColor: themeColors.accent,
                  color: '#fff'
                }
              }}
              cancelButtonProps={{
                style: {
                  backgroundColor: themeColors.accent,
                  borderColor: themeColors.accent,
                  color: '#fff',
                  opacity: 1,
                  transition: 'opacity 0.3s',
                  '&:hover': {
                    opacity: 0.8,
                    backgroundColor: `${themeColors.accent} !important`,
                    borderColor: `${themeColors.accent} !important`,
                    color: '#fff !important'
                  }
                }
              }}
            >
              <Space direction="vertical" size={16} style={{ width: '100%', color: themeColors.text }}>
                <div>
                  <p>Overall Satisfaction <span style={{ color: themeColors.accent }}>*</span></p>
                  <Rate allowHalf value={feedbackData.rating} onChange={(value) => setFeedbackData({ ...feedbackData, rating: value })} />
                </div>
                <div>
                  <p>Pace of the Session (Slow to Fast) <span style={{ color: themeColors.accent }}>*</span></p>
                  <Slider
                    min={0}
                    max={100}
                    value={feedbackData.pace}
                    onChange={(value) => setFeedbackData({ ...feedbackData, pace: value })}
                    marks={{ 0: 'Too Slow', 50: 'Just Right', 100: 'Too Fast' }}
                  />
                </div>
                <div>
                  <p>Interactivity Level <span style={{ color: themeColors.accent }}>*</span></p>
                  <Rate value={feedbackData.interactivity} onChange={(value) => setFeedbackData({ ...feedbackData, interactivity: value })} />
                </div>
                <div>
                  <p>Was the content clear? <span style={{ color: themeColors.accent }}>*</span></p>
                  <Switch
                    checked={feedbackData.clarity}
                    onChange={(checked) => setFeedbackData({ ...feedbackData, clarity: checked })}
                    checkedChildren="Yes"
                    unCheckedChildren="No"
                  />
                </div>
                <Input.TextArea
                  rows={1}
                  placeholder="Share your thoughts (optional)"
                  value={feedbackData.text}
                  onChange={(e) => setFeedbackData({ ...feedbackData, text: e.target.value })}
                />
                <Input.TextArea
                  rows={1}
                  placeholder="Suggestions for resources or improvements (optional)"
                  value={feedbackData.resources}
                  onChange={(e) => setFeedbackData({ ...feedbackData, resources: e.target.value })}
                />
                <Checkbox
                  checked={feedbackData.anonymous}
                  onChange={(e) => setFeedbackData({ ...feedbackData, anonymous: e.target.checked })}
                  style={{ color: themeColors.text }}
                >
                  Submit anonymously
                </Checkbox>
              </Space>
            </Modal>

            <Modal
              title={<span style={{ color: themeColors.text }}>Device Analysis</span>}
              open={deviceModalVisible}
              onCancel={handleDeviceModalCancel}
              footer={[
                <Button
                  key="cancel"
                  onClick={handleDeviceModalCancel}
                  style={{
                    borderColor: themeColors.accent,
                    color: themeColors.accent
                  }}
                >
                  Cancel
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  onClick={handleDeviceModalConfirm}
                  style={{ ...styles.button, color: '#fff' }}
                >
                  <span style={{ color: '#fff' }}>I Understand</span>
                </Button>,
              ]}
              destroyOnClose={true}
              maskClosable={false}
              centered
            >
              <p style={{ color: themeColors.text }}>
                We use anonymous device characteristics to prevent attendance fraud. No personal data is collected.
                By continuing, you agree to this analysis for attendance verification purposes only.
              </p>
            </Modal>
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentDashboard;