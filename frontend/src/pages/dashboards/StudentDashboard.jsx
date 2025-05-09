import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStudentAttendance,
  getStudentUnits,
  getUserProfile,
  submitFeedback,
  getActiveSessionForUnit,
  getPendingFeedbackAttendance,
  checkSessionStatus, // Add import for checkSessionStatus
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
  ArrowUpOutlined, // Add ArrowUp icon for back to top button
} from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import { motion } from 'framer-motion';
import 'antd/dist/reset.css';
import './StudentDashboard.css';
import { ThemeContext } from '../../context/ThemeContext';
import { useStyles } from '../../styles/styles.js';
import { useContext } from 'react';
import BackToTop from '../../components/BackToTop.jsx';
import ThemeToggle from '../../components/ThemeToggle.jsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;
const { Option } = Select;
const API_URL = 'https://attendance-system-w70n.onrender.com/api';

const StudentDashboard = () => {
  // Removed unused dashboardData state
  const { isDarkMode, themeColors } = useContext(ThemeContext);
  const styles = useStyles(isDarkMode, themeColors);
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(window.innerWidth < 992);
  const [units, setUnits] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ attendanceRecords: [], weeklyEvents: [], dailyEvents: [] });
  const [attendanceRates, setAttendanceRates] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null); // Add this state
  // Add separate loading states for different data types
  const [loadingStates, setLoadingStates] = useState({
    profile: false,
    units: false,
    attendance: false,
    feedback: false
  });
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
  const [eventPage, setEventPage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);
  const [pageSize] = useState(5);
  const [eventSortOrder, setEventSortOrder] = useState('mostRecent');
  const [notificationSortOrder, setNotificationSortOrder] = useState('mostRecent');
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [deviceModalConfirmed, setDeviceModalConfirmed] = useState(false);
  const [dataLoadingError, setDataLoadingError] = useState(false); // New state for error

  // Add state variables for session status
  const [latestSession, setLatestSession] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(true);

  // Add state for back to top button visibility
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Add a new state to track active sessions by unit ID
  const [activeSessionsByUnit, setActiveSessionsByUnit] = useState({});

  // Add a new state to track countdowns for active sessions
  const [sessionCountdowns, setSessionCountdowns] = useState({});

  // Add these new states after the existing state declarations
  const [loadingErrors, setLoadingErrors] = useState({
    profile: false,
    units: false,
    attendance: false,
    feedback: false
  });

  // Add these new state variables after other state declarations
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloadFilters, setDownloadFilters] = useState({
    unit: null,
    startDate: null,
    endDate: null,
  });

  // Split the fetchAllData into separate functions for each data typerate functions for each data type
  const fetchProfileData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoadingStates(prev => ({ ...prev, profile: true }));
    try {
      const profileRes = await getUserProfile(token);

      // Set username from profile response
      if (profileRes && profileRes.firstName) {
        setUsername(profileRes.firstName);
      }

      // Store profile data in localStorage with expiration time (1 day)
      const profileData = {
        data: profileRes,
        expiry: Date.now() + (24 * 60 * 60 * 1000)
      };
      localStorage.setItem('cachedProfileData', JSON.stringify(profileData));
      setLoadingErrors(prev => ({ ...prev, profile: false }));
      return profileRes;
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setLoadingErrors(prev => ({ ...prev, profile: true }));
      // Try to use cached data as fallback
      try {
        const cachedProfile = localStorage.getItem('cachedProfileData');
        if (cachedProfile) {
          const parsedProfile = JSON.parse(cachedProfile);
          if (parsedProfile.expiry > Date.now()) {
            if (parsedProfile.data?.firstName) {
              setUsername(parsedProfile.data.firstName);
            }
            return parsedProfile.data;
          }
        }
      } catch (e) {
        console.error("Error loading cached profile:", e);
      }
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, profile: false }));
    }
  }, []);

  const fetchUnitsData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Check for cached units data (expires after 1 day)
    const cachedUnits = localStorage.getItem('cachedUnitsData');
    if (cachedUnits) {
      try {
        const parsedCache = JSON.parse(cachedUnits);
        if (parsedCache.expiry > Date.now()) {
          // Cache is still valid
          const sanitizedUnits = parsedCache.data.filter((unit) =>
            unit && unit._id && typeof unit._id === 'string' && unit._id.trim() !== ''
          );
          setUnits(sanitizedUnits);
          return sanitizedUnits;
        }
      } catch (error) {
        console.error("Error parsing cached units:", error);
        // Continue to fetch fresh data if cache parsing fails
      }
    }

    setLoadingStates(prev => ({ ...prev, units: true }));
    try {
      const unitsRes = await getStudentUnits(token);

      const unitsData = Array.isArray(unitsRes) ? unitsRes : (unitsRes?.enrolledUnits || []);
      const sanitizedUnits = unitsData.filter((unit) =>
        unit && unit._id && typeof unit._id === 'string' && unit._id.trim() !== ''
      );
      setUnits(sanitizedUnits);

      // Cache units data with expiration (1 day)
      const unitsCache = {
        data: sanitizedUnits,
        expiry: Date.now() + (24 * 60 * 60 * 1000)
      };
      localStorage.setItem('cachedUnitsData', JSON.stringify(unitsCache));

      return sanitizedUnits;
    } catch (error) {
      console.error("Error fetching units data:", error);
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, units: false }));
    }
  }, []);

  const fetchAttendanceData = useCallback(async (profileId) => {
    const token = localStorage.getItem('token');
    if (!token || !profileId) return;

    setLoadingStates(prev => ({ ...prev, attendance: true }));
    try {
      const attendanceRes = await getStudentAttendance(profileId);
      setAttendanceData(attendanceRes);
      return attendanceRes;
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, attendance: false }));
    }
  }, []);

  const fetchFeedbackData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Check if we should throttle the feedback fetch
    const lastFetchTime = localStorage.getItem('lastFeedbackFetch');
    const now = Date.now();
    const FETCH_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown

    if (lastFetchTime && (now - parseInt(lastFetchTime)) < FETCH_COOLDOWN) {
      return; // Skip fetching if within cooldown period
    }

    setLoadingStates(prev => ({ ...prev, feedback: true }));
    try {
      const feedbackRes = await getPendingFeedbackAttendance();

      // Store fetch timestamp
      localStorage.setItem('lastFeedbackFetch', now.toString());

      // Get processed notification IDs from localStorage
      const processedNotifications = new Set(JSON.parse(localStorage.getItem('processedNotifications') || '[]'));

      // Create a unique ID for each notification to prevent duplicates
      const existingNotificationIds = new Set(pendingFeedbacks.map(pf => `${pf.sessionId}-${pf.unitId}`));

      const newPendingFeedbacks = feedbackRes.pendingFeedbackRecords
        .filter(record =>
          // Filter out already processed notifications
          !processedNotifications.has(record.session._id) &&
          // Filter out duplicates that already exist in the state
          !existingNotificationIds.has(`${record.session._id}-${record.session.unit._id}`)
        )
        .map((record) => ({
          sessionId: record.session._id,
          unitId: record.session.unit._id,
          unitName: record.session.unit.name,
          title: "Feedback Available",
          message: "Please provide your feedback for the session.",
          timestamp: record.session.endTime || new Date(),
          // Add a unique notification ID
          notificationId: `${record.session._id}-${record.session.unit._id}`
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

        // Update state with new unique notifications
        setPendingFeedbacks(prev => {
          // Create a map of existing notifications
          const existingNotifications = new Map(prev.map(p => [p.notificationId || `${p.sessionId}-${p.unitId}`, p]));

          // Add new notifications, overwriting if duplicate
          validFeedbacks.forEach(feedback => {
            if (feedback) {
              existingNotifications.set(feedback.notificationId, feedback);
            }
          });

          // Convert the map back to array
          return Array.from(existingNotifications.values());
        });
      }

      return feedbackRes;
    } catch (error) {
      console.error("Error fetching feedback data:", error);
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, feedback: false }));
    }
  }, [pendingFeedbacks]);

  // Replace fetchAllData with a coordinated fetch function that calls individual fetchers
  const fetchAllData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setDataLoadingError(false); // reset error before fetching

    // Set a timeout to prevent infinite loading - increase to 30 seconds
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      setDataLoadingError(true);
      message.error("Loading took too long. Please try refreshing the page.");
    }, 30000); // 30 seconds timeout

    setLoading(true);
    try {
      // Fetch profile data first
      const profileRes = await fetchProfileData();

      // Fetch units data in parallel with attendance data
      const unitsPromise = fetchUnitsData();

      // Only fetch attendance if we have the profile ID
      let attendancePromise = null;
      if (profileRes && profileRes._id) {
        attendancePromise = fetchAttendanceData(profileRes._id);
      }

      // Wait for both units and attendance to complete
      await Promise.all([unitsPromise, attendancePromise].filter(Boolean));

      // Fetch feedback data last as it's less critical
      await fetchFeedbackData();

      // Clear the timeout since we got the data
      clearTimeout(loadingTimeout);

    } catch (error) {
      console.error("Error fetching data:", error);
      setDataLoadingError(true); // mark error occurred
      if (error.response && error.response.status === 429) {
        message.error("Too many requests. Please wait a moment and try again.");
      } else {
        message.error("Unable to load data. Please check your connection and try again.");
      }
    } finally {
      clearTimeout(loadingTimeout); // Make sure timeout is cleared
      setLoading(false); // Always ensure loading is set to false
    }
  }, [fetchProfileData, fetchUnitsData, fetchAttendanceData, fetchFeedbackData]);

  // Add a new effect to reset loading state if stuck
  useEffect(() => {
    // Reset loading state after component mounts (in case we're returning from QR scanner)
    const resetTimeout = setTimeout(() => {
      if (loading) {
        console.log("Force resetting loading state after timeout");
        setLoading(false);
      }
    }, 5000); // 5 second backup timeout

    return () => clearTimeout(resetTimeout);
  }, [loading]);

  // Update the useEffect that calls fetchAllData to handle navigation return and load cached data first
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/login');
      return;
    }

    // Check if we're returning from QR scanner
    const returnFromScanner = sessionStorage.getItem('returnFromQrScanner');
    if (returnFromScanner === 'true') {
      sessionStorage.removeItem('returnFromQrScanner');
      setLoading(false); // Reset loading state immediately

      // When returning, try to use cached data first for units and profile
      const tryLoadCachedData = async () => {
        let profileData = null;
        let needFullRefresh = false;

        // Try to load cached profile
        try {
          const cachedProfile = localStorage.getItem('cachedProfileData');
          if (cachedProfile) {
            const parsedProfile = JSON.parse(cachedProfile);
            if (parsedProfile.expiry > Date.now()) {
              profileData = parsedProfile.data;
              if (profileData?.firstName) {
                setUsername(profileData.firstName);
              }
            } else {
              needFullRefresh = true;
            }
          } else {
            needFullRefresh = true;
          }
        } catch (error) {
          console.error("Error loading cached profile:", error);
          needFullRefresh = true;
        }

        // Try to load cached units
        try {
          const cachedUnits = localStorage.getItem('cachedUnitsData');
          if (cachedUnits) {
            const parsedUnits = JSON.parse(cachedUnits);
            if (parsedUnits.expiry > Date.now()) {
              const sanitizedUnits = parsedUnits.data.filter((unit) =>
                unit && unit._id && typeof unit._id === 'string' && unit._id.trim() !== ''
              );
              setUnits(sanitizedUnits);
            } else {
              needFullRefresh = true;
            }
          } else {
            needFullRefresh = true;
          }
        } catch (error) {
          console.error("Error loading cached units:", error);
          needFullRefresh = true;
        }

        // If we have profile data, update attendance even when returning
        if (profileData?._id) {
          fetchAttendanceData(profileData._id);
        }

        // Always check for new feedback
        fetchFeedbackData();

        // If any cache is invalid or missing, do a full refresh
        if (needFullRefresh) {
          setTimeout(() => fetchAllData(), 1000);
        }
      };

      tryLoadCachedData();
    } else {
      fetchAllData();
    }

    const handleResize = () => setCollapsed(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate, fetchAllData, fetchAttendanceData, fetchFeedbackData]);

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

    // Check if the low attendance alert has already been shown
    if (!hasShownLowAttendanceAlert && rates.some(rate => rate.value !== null && parseFloat(rate.value) < 75)) {
      // Check if there are any existing messages on the screen
      const existingMessages = document.querySelectorAll('.ant-message-notice');
      if (existingMessages.length === 0) {
        message.warning({
          content: 'Low attendance(<75%) in some units may risk not attaining the required average attendance rate for your semester!',
          duration: 5,
        });
        setHasShownLowAttendanceAlert(true);
      }
    }
  }, [units, attendanceData, calculateAttendanceRate, hasShownLowAttendanceAlert]);

  const exportAttendanceData = async () => {
    try {
      message.loading({ content: 'Preparing attendance data...', key: 'export' });

      const data = attendanceData.attendanceRecords.map(record => ({
        'Unit Name': record.session.unit.name,
        'Unit Code': record.session.unit.code || 'N/A',
        'Session Date': new Date(record.session.startTime).toLocaleDateString(),
        'Session Time': `${new Date(record.session.startTime).toLocaleTimeString()} - ${new Date(record.session.endTime).toLocaleTimeString()}`,
        'Status': record.status,
        'Attendance Time': record.attendedAt ? new Date(record.attendedAt).toLocaleTimeString() : 'N/A',
        'Feedback Submitted': record.feedbackSubmitted ? 'Yes' : 'No'
      }));

      // Create workbook and worksheet
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Add summary sheet
      const summaryData = units.map(unit => {
        const rate = calculateAttendanceRate(unit._id);
        return {
          'Unit': unit.name,
          'Code': unit.code || 'N/A',
          'Attendance Rate': rate ? `${rate}%` : 'No sessions',
          'Total Sessions': attendanceData.attendanceRecords.filter(
            record => record.session.unit._id === unit._id
          ).length,
          'Present': attendanceData.attendanceRecords.filter(
            record => record.session.unit._id === unit._id && record.status === 'Present'
          ).length,
          'Absent': attendanceData.attendanceRecords.filter(
            record => record.session.unit._id === unit._id && record.status === 'Absent'
          ).length
        };
      });

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);

      // Add sheets to workbook
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Detailed Attendance');

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const fileName = `attendance_report_${date}.xlsx`;

      // Write and download file
      XLSX.writeFile(workbook, fileName);

      message.success({
        content: 'Attendance data exported successfully!',
        key: 'export',
        duration: 3
      });
    } catch (error) {
      console.error('Export error:', error);
      message.error({
        content: 'Failed to export attendance data',
        key: 'export',
        duration: 3
      });
    }
  };

  const handleDownloadAttendance = async () => {
    try {
      message.loading({ content: 'Preparing download...', key: 'download' });

      const params = {
        ...(downloadFilters.unit && { unitId: downloadFilters.unit }),
        ...(downloadFilters.startDate && { startDate: downloadFilters.startDate.format('YYYY-MM-DD') }),
        ...(downloadFilters.endDate && { endDate: downloadFilters.endDate.format('YYYY-MM-DD') }),
        useDisplayCalculation: true // Add this parameter to use dashboard calculation method
      };

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/login');
        return;
      }

      const response = await axios.get(
        `${API_URL}/attendance/export`,
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          },
          responseType: 'blob'
        }
      );

      if (!response.data) {
        throw new Error('No data received');
      }

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      const fileName = `attendance_report_${moment().format('YYYY-MM-DD')}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      message.success({ content: 'Download successful!', key: 'download' });
      setDownloadModalVisible(false);
    } catch (error) {
      console.error('Download error:', error);
      message.error({
        content: 'Failed to download attendance data',
        key: 'download'
      });
    }
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
      // Get the current week's start and end dates
      const startOfWeek = moment(selectedDate).startOf('week');
      const endOfWeek = moment(selectedDate).endOf('week');

      // Use manual date comparison instead of isBetween
      const weeklyEvents = attendanceData.weeklyEvents || [];
      let selectedWeek = null;

      if (weeklyEvents.length > 0) {
        // Try to find matching week
        for (const week of weeklyEvents) {
          if (!week.week) continue;

          const dates = week.week.split(' - ');
          if (dates.length !== 2) continue;

          const weekStart = moment(dates[0], 'MMM D, YYYY');
          const weekEnd = moment(dates[1], 'MMM D, YYYY');

          // Check if our selected date falls within this week's range
          if (selectedDate.isSameOrAfter(weekStart, 'day') && selectedDate.isSameOrBefore(weekEnd, 'day')) {
            selectedWeek = week;
            break;
          }
        }
      }

      // If no matching week is found, just filter based on current week bounds
      if (!selectedWeek) {
        // Manually filter attendance records within the selected week
        events = attendanceData.attendanceRecords
          .filter(record => {
            const recordDate = record.session.startTime ? moment(record.session.startTime) : null;
            return recordDate &&
              recordDate.isSameOrAfter(startOfWeek, 'day') &&
              recordDate.isSameOrBefore(endOfWeek, 'day');
          })
          .map(record => ({
            title: `${record.session.unit?.name || 'Unknown'} - ${record.status || 'Unknown'}`,
            date: moment(record.session.startTime),
            status: record.status || 'Unknown',
            sessionId: record.session._id,
          }));
      } else {
        // Use the selected week's events
        events = selectedWeek.events.map((event) => ({
          title: `${event.unitName} - ${event.status}`,
          date: moment(event.startTime),
          status: event.status,
        }));
      }
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

    // Add this function to handle date selection in weekly mode
    const handleDateChange = (date) => {
      if (!date) {
        setSelectedDate(null);
        return;
      }

      if (viewMode === 'weekly') {
        // When in weekly mode, set the date to the start of the week
        const startOfWeek = moment(date).startOf('week');
        setSelectedDate(startOfWeek);
      } else {
        setSelectedDate(date);
      }

      setEventPage(1);
    };

    // Helper function to format the selected date display in weekly mode
    const getDatePickerValue = () => {
      if (!selectedDate) return null;
      return selectedDate;
    };

    // Helper function to format the displayed date string based on view mode
    const getDatePickerFormat = () => {
      if (viewMode === 'weekly') {
        // Simplified format without week numbers
        return 'MMM D, YYYY';
      }
      return 'YYYY-MM-DD';
    };

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
                    // Reset date when switching modes
                    if (value === 'daily') {
                      setSelectedDate(moment());
                    } else {
                      setSelectedDate(moment().startOf('week'));
                    }
                    setEventPage(1);
                  }}
                  style={{ width: 80, fontSize: '12px' }}
                >
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                </Select>
                <DatePicker
                  onChange={handleDateChange}
                  value={getDatePickerValue()}
                  format={getDatePickerFormat()}
                  picker={viewMode === 'weekly' ? 'date' : 'date'} // Changed from 'week' to 'date' for consistent UI
                  placeholder={viewMode === 'weekly' ? 'Select Date for Week' : 'Select Date'}
                  style={{ width: 150, fontSize: '12px' }}
                  renderExtraFooter={() => viewMode === 'weekly' ?
                    <div style={{
                      fontSize: '12px',
                      padding: '5px',
                      color: isDarkMode ? '#ddd' : '#555',
                      textAlign: 'center'
                    }}>
                      Will show the entire week
                    </div> : null
                  }
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

            {/* Display selected date/week range info for clarity */}
            {selectedDate && (
              <div style={{
                fontSize: '13px',
                textAlign: 'center',
                marginBottom: '8px',
                color: themeColors.text
              }}>
                {viewMode === 'weekly' ? (
                  <>
                    Showing: {moment(selectedDate).startOf('week').format('MMM D')} - {moment(selectedDate).endOf('week').format('MMM D, YYYY')}
                  </>
                ) : (
                  <>
                    Showing: {moment(selectedDate).format('MMMM D, YYYY')}
                  </>
                )}
              </div>
            )}

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
      if (!token) {
        console.error('Authentication token missing');
        return { isExpired: true, error: 'Authentication failed' };
      }
      
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
        if (!token) {
          return { isExpired: true, error: 'Authentication failed' };
        }
        const lastSession = await axios.get(
          `${API_URL}/sessions/last/${unitId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return { isExpired: lastSession.data._id !== sessionIdToCheck, latestSession: lastSession.data };
      }
      return { isExpired: true, error: error.message || 'Failed to fetch session status' };
    }
  };

  const checkFeedbackStatus = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Authentication token missing");
      }

      const response = await axios.get(
        `${API_URL}/attendance/feedback/status/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.feedbackSubmitted;
    } catch (error) {
      console.error('Error checking feedback status:', error);
      // Specifically throw the error so it can be caught and handled by the caller
      throw error;
    }
  };

  const renderNotifications = () => {
    // Ensure we have unique notifications by using a Map
    const uniqueNotifications = Array.from(
      new Map(pendingFeedbacks.map(item => [
        item.notificationId || `${item.sessionId}-${item.unitId}`,
        item
      ])).values()
    );

    const sortedNotifications = uniqueNotifications.sort((a, b) => {
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

          // Remove this specific notification
          setPendingFeedbacks((prev) => prev.filter((pf) =>
            pf.notificationId !== `${sessionId}-${unitId}` && pf.sessionId !== sessionId
          ));

          // Add to processed notifications
          const processedNotifications = new Set(JSON.parse(localStorage.getItem('processedNotifications') || '[]'));
          processedNotifications.add(sessionId);
          localStorage.setItem('processedNotifications', JSON.stringify([...processedNotifications]));

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
                          title={<span style={{ color: themeColors.text }}>{item.title || 'Notification'}</span>}
                          description={<span style={{ color: `${themeColors.text}80` }}>{`${item.message || ''} (Unit: ${item.unitName || 'Unknown'}) - ${moment(item.timestamp || new Date()).fromNow()}`}</span>}
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
      onClick: () => navigate('/student/profile'),
      style: {
        color: themeColors.text,
        '&:hover': {
          background: themeColors.hover,
        }
      }
    },
    {
      key: '2',
      label: 'Settings',
      icon: <SettingOutlined style={{ color: themeColors.text }} />,
      onClick: () => navigate('/student/settings'),
      style: {
        color: themeColors.text,
        '&:hover': {
          background: themeColors.hover,
        }
      }
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
        borderRadius: '4px',
        '&:hover': {
          opacity: 0.85,
        }
      },
      onClick: () =>
        Modal.confirm({
          title: <span style={{ color: themeColors.text }}>Confirm Logout</span>,
          content: <span style={{ color: themeColors.text }}>Are you sure you want to logout?</span>,
          onOk: () => {
            localStorage.removeItem('token'); // Clear the token
            navigate('/auth/login'); // Redirect to login page
          },
          centered: true,
          okButtonProps: {
            style: {
              backgroundColor: themeColors.accent,
              borderColor: themeColors.accent,
              color: '#fff'
            }
          },
          cancelButtonProps: {
            style: {
              borderColor: themeColors.text,
              color: themeColors.text
            }
          }
        }),
    },
  ];

  const openFeedbackModal = async (unitId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error("Authentication token missing. Please log in again.");
        navigate('/auth/login');
        return;
      }

      // Get all sessions for this unit, sorted by date (newest first)
      const unitAttendance = attendanceData.attendanceRecords
        .filter((data) => data.session.unit._id.toString() === unitId.toString())
        .sort((a, b) => new Date(b.session.endTime) - new Date(a.session.endTime));

      const latestSession = unitAttendance[0];

      if (!latestSession) {
        message.warning('No attendance records found for this unit.');
        return;
      }

      // Check if there's an active session first
      try {
        const activeSession = await getActiveSessionForUnit(unitId);
        if (activeSession && !activeSession.ended) {
          message.info("Please mark your attendance first. Feedback will be available after the session ends.");
          return;
        }
      } catch (error) {
        console.error("Error checking active session:", error);
        // Continue if we can't check active session - might be no active session
      }

      // Check if feedback was already submitted for the latest session
      if (latestSession.feedbackSubmitted) {
        message.info("You've already submitted feedback for the latest session.");
        return;
      }

      // Get all attended sessions
      const latestAttendedSession = unitAttendance
        .find(record => record.status === 'Present');

      if (!latestAttendedSession) {
        message.error("No attended sessions found for this unit.");
        return;
      }

      if (latestAttendedSession.session._id !== latestSession.session._id) {
        message.info("Feedback can only be provided for your most recent attended session.");
        return;
      }

      // Check session status
      try {
        const sessionStatus = await checkSessionStatus(latestSession.session._id);

        if (!sessionStatus.ended) {
          message.info("Feedback will be available after the session ends.");
          return;
        }
      } catch (e) {
        // Check if this is the "already submitted" error
        if (
          e.response &&
          e.response.data &&
          typeof e.response.data.message === 'string' &&
          e.response.data.message.toLowerCase().includes("already submitted")
        ) {
          message.info("You've already submitted feedback for this session.");
          setAttendanceData(prev => ({
            ...prev,
            attendanceRecords: prev.attendanceRecords.map(rec =>
              rec.session._id === latestSession.session._id
                ? { ...rec, feedbackSubmitted: true }
                : rec
            )
          }));
          return;
        }

        // For other errors, try to continue with the feedback modal
        console.warn("Error checking session status:", e);
      }

      // Double-check feedback status one last time before opening modal
      try {
        const feedbackStatus = await checkFeedbackStatus(latestSession.session._id);
        if (feedbackStatus) {
          message.info("You've already submitted feedback for this session.");

          // Update local state to reflect feedback submission
          setAttendanceData(prev => ({
            ...prev,
            attendanceRecords: prev.attendanceRecords.map(rec =>
              rec.session._id === latestSession.session._id
                ? { ...rec, feedbackSubmitted: true }
                : rec
            )
          }));
          return;
        }
      } catch (error) {
        // Just log the error but continue - the user may still be able to submit feedback
        console.warn("Error checking feedback status:", error);
      }

      // If all checks pass or some were skipped due to non-critical errors, open the feedback modal
      setLatestSession(latestSession);
      setActiveSessionId(latestSession.session._id);
      setFeedbackModalVisible(true);

    } catch (error) {
      console.error("Error checking feedback availability:", error);

      // Provide more specific error messages
      if (error.response) {
        if (error.response.status === 401) {
          message.error("Session expired. Please log in again.");
          navigate('/auth/login');
        } else if (error.response.status === 404) {
          message.warning("Session information not found. It may have been deleted.");
        } else {
          message.error(`Error: ${error.response.data?.message || 'Something went wrong'}`);
        }
      } else if (error.request) {
        message.error("Network error. Please check your internet connection.");
      } else {
        message.error("Unable to check feedback availability. Please try again later.");
      }
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!activeSessionId) return message.error('No session selected.');

    // Check each required field individually to provide more specific error messages
    const missingFields = [];
    if (feedbackData.rating === 0) missingFields.push('Rating');
    if (feedbackData.pace === 0) missingFields.push('Pace');
    if (feedbackData.interactivity === 0) missingFields.push('Interactivity');
    if (feedbackData.clarity === null || feedbackData.clarity === undefined) missingFields.push('Content Clarity');

    if (missingFields.length > 0) {
      message.error(`Please complete the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      const feedbackPayload = {
        sessionId: activeSessionId,
        rating: feedbackData.rating,
        feedbackText: feedbackData.text || '',
        pace: feedbackData.pace,
        interactivity: feedbackData.interactivity,
        clarity: feedbackData.clarity,
        resources: feedbackData.resources.trim(),
        anonymous: feedbackData.anonymous,
      };

      await submitFeedback(feedbackPayload);
      message.success('Feedback submitted successfully!');

      // Update local state to reflect feedback submission
      setAttendanceData((prev) => ({
        ...prev,
        attendanceRecords: prev.attendanceRecords.map((rec) =>
          rec.session._id === activeSessionId ? { ...rec, feedbackSubmitted: true } : rec
        ),
      }));

      // Remove feedback notifications
      setPendingFeedbacks((prev) => prev.filter((pf) => pf.sessionId !== activeSessionId));

      // Add to processed notifications
      const processedNotifications = new Set(JSON.parse(localStorage.getItem('processedNotifications') || '[]'));
      processedNotifications.add(activeSessionId);
      localStorage.setItem('processedNotifications', JSON.stringify([...processedNotifications]));

      // Reset form and close modal
      setFeedbackData({ rating: 0, text: '', pace: 0, interactivity: 0, clarity: null, resources: '', anonymous: false });
      setFeedbackModalVisible(false);
      setActiveSessionId(null);

      await fetchAllData(); // Refresh data
    } catch (error) {
      console.error('Feedback submission failed:', error);
      message.error(`Error submitting feedback: ${error.response?.data?.message || error.message}`);
    }
  };

  // Update handleAttendClick to set the return flag
  const handleAttendClick = async (unitId) => {
    if (!unitId || typeof unitId !== 'string' || unitId.trim() === '' || unitId === 'undefined') {
      console.error("Invalid unitId:", unitId);
      message.error("Unit ID is missing or invalid.");
      return;
    }

    // Check if the user has already confirmed the device analysis modal
    const hasConfirmedDeviceAnalysis = localStorage.getItem('hasConfirmedDeviceAnalysis');
    if (!hasConfirmedDeviceAnalysis && !deviceModalConfirmed) {
      // Store the current unitId to use after confirmation
      sessionStorage.setItem('pendingAttendUnitId', unitId);
      setDeviceModalVisible(true);
      return;
    }

    try {
      const session = await getActiveSessionForUnit(unitId);
      if (session && session._id && !session.ended) {
        // Set flag that we're navigating to QR scanner
        sessionStorage.setItem('returnFromQrScanner', 'true');
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
  const handleDeviceModalConfirm = async () => {
    localStorage.setItem('hasConfirmedDeviceAnalysis', 'true');
    setDeviceModalConfirmed(true);
    setDeviceModalVisible(false);

    // Get the pending unitId from sessionStorage
    const unitId = sessionStorage.getItem('pendingAttendUnitId');
    sessionStorage.removeItem('pendingAttendUnitId');

    if (unitId) {
      try {
        const session = await getActiveSessionForUnit(unitId);
        if (session && session._id && !session.ended) {
          // Set flag that we're navigating to QR scanner
          sessionStorage.setItem('returnFromQrScanner', 'true');
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
    }
  };

  // New function to handle device modal cancellation
  const handleDeviceModalCancel = () => {
    setDeviceModalVisible(false);
    // Clear the pending unitId
    sessionStorage.removeItem('pendingAttendUnitId');
    message.info("You need to accept device analysis to attend sessions.");
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Define fetchUserAttendance function
  const fetchUserAttendance = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error("Authentication token missing. Please log in again.");
        navigate('/auth/login');
        return;
      }

      const profileRes = await getUserProfile(token);
      if (profileRes._id) {
        const attendanceRes = await getStudentAttendance(profileRes._id);
        setAttendanceData(attendanceRes);
        // Also update the latest session when attendance is refreshed
        if (selectedUnit && attendanceRes.attendanceRecords.length > 0) {
          const unitAttendance = attendanceRes.attendanceRecords
            .filter((data) => data.session.unit._id.toString() === selectedUnit._id?.toString())
            .sort((a, b) => new Date(b.session.endTime) - new Date(a.session.endTime));
          setLatestSession(unitAttendance[0] || null);
        }
      }
    } catch (error) {
      console.error("Error fetching user attendance:", error);

      if (error.response && error.response.status === 401) {
        message.error("Session expired. Please log in again.");
        navigate('/auth/login');
      } else {
        message.error("Unable to refresh attendance data");
      }
    }
  }, [selectedUnit, navigate]);

  // Function to check if a session is still active
  const checkSessionStatusFromApi = useCallback(async () => {
    if (latestSession && latestSession.session && latestSession.session._id) {
      try {
        const status = await checkSessionStatus(latestSession.session._id);
        setIsSessionActive(status.active);

        // If session was active but is now ended, refresh the dashboard
        if (!status.active && isSessionActive) {
          message.info("The session has ended.");
          fetchUserAttendance();
        }
      } catch (error) {
        console.error("Error checking session status:", error);
      }
    }
  }, [isSessionActive, fetchUserAttendance, latestSession]);

  // Set up an interval to check session status
  useEffect(() => {
    if (latestSession && latestSession.session && latestSession.session._id) {
      // Check immediately on component mount
      checkSessionStatusFromApi();

      // Check every 30 seconds
      const intervalId = setInterval(checkSessionStatusFromApi, 30000);

      return () => clearInterval(intervalId);
    }
  }, [checkSessionStatusFromApi, latestSession]);

  // Update latestSession when selectedUnit changes
  useEffect(() => {
    if (selectedUnit && attendanceData.attendanceRecords.length > 0) {
      const unitAttendance = attendanceData.attendanceRecords
        .filter((data) => data.session.unit._id.toString() === selectedUnit._id?.toString())
        .sort((a, b) => new Date(b.session.endTime) - new Date(a.session.endTime));
      setLatestSession(unitAttendance[0] || null);
    }
  }, [selectedUnit, attendanceData.attendanceRecords]);

  // Add useEffect to handle scroll event for back to top button
  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled down 300px
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Clean up event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Add the checkActiveSessionForUnit function that was missing
  const checkActiveSessionForUnit = async (unitId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Set loading state for this specific unit
      setActiveSessionsByUnit(prev => ({
        ...prev,
        [unitId]: { loading: true }
      }));

      const session = await getActiveSessionForUnit(unitId);

      // Update the state with the session data if it exists and is active
      setActiveSessionsByUnit(prev => ({
        ...prev,
        [unitId]: session && !session.ended ? session : null
      }));

      return session;
    } catch (err) {
      console.error('Error checking active session for unit:', err);
      // Clear the loading state if there's an error
      setActiveSessionsByUnit(prev => ({
        ...prev,
        [unitId]: null
      }));
      return null;
    }
  };

  // Add this useEffect to handle the countdown timers
  useEffect(() => {
    // Create interval for countdown timers
    const countdownIntervals = {};

    // For each active session, set up a countdown timer
    Object.entries(activeSessionsByUnit).forEach(([unitId, session]) => {
      if (session && !session.ended) {
        // Calculate end time - either based on duration or default 1 hour
        const endTime = session.duration
          ? moment(session.startTime).add(session.duration, 'minutes')
          : moment(session.startTime).add(1, 'hour');

        // Update countdown initially
        updateCountdown(unitId, endTime);

        // Set interval to update countdown every second
        countdownIntervals[unitId] = setInterval(() => {
          updateCountdown(unitId, endTime);
        }, 1000);
      }
    });

    // Cleanup function to clear all intervals
    return () => {
      Object.values(countdownIntervals).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, [activeSessionsByUnit]);

  // Helper function to update countdown for a session
  const updateCountdown = (unitId, endTime) => {
    const now = moment();
    const duration = moment.duration(endTime.diff(now));

    // Check if the session has ended
    if (duration.asSeconds() <= 0) {
      setSessionCountdowns(prev => ({
        ...prev,
        [unitId]: 'Ended'
      }));

      // Update the active session state
      setActiveSessionsByUnit(prev => ({
        ...prev,
        [unitId]: null
      }));

      return;
    }

    // Format the countdown string
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    const countdownString = `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;

    setSessionCountdowns(prev => ({
      ...prev,
      [unitId]: countdownString
    }));
  };

  // Add the loadData function
  const loadData = async () => {
    try {
      setLoading(true);

      // Attempt to load cached data first
      const cachedData = localStorage.getItem('dashboardCache');
      if (cachedData && !navigator.onLine) {
        const parsed = JSON.parse(cachedData);
        setDashboardData(parsed);
        message.info('You are offline. Showing last known data.');
        return;
      }

      // Fetch fresh data when online
      const profileData = await fetchProfileData();
      const unitsData = await fetchUnitsData();
      const attendanceData = profileData._id ? await fetchAttendanceData(profileData._id) : null;

      const freshData = {
        profile: profileData,
        units: unitsData,
        attendance: attendanceData
      };

      // Cache the fresh data
      localStorage.setItem('dashboardCache', JSON.stringify(freshData));
      setDashboardData(freshData);

    } catch {
      const msg = !navigator.onLine
        ? 'You are offline. Please check your connection to see the latest data.'
        : 'Failed to load data. Please try again.';

      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Add online/offline listener
  useEffect(() => {
    const handleOnline = () => {
      message.success('Back online. Refreshing data...');
      loadData();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Update the loading indicator in the UI to show more specific loading states
  return (
    <Layout style={styles.layout} data-theme={isDarkMode ? 'dark' : 'light'}>
      <style>
        {styles.globalStyles}
        {`
          /* Add these styles for dropdown menu theming */
          .ant-dropdown .ant-dropdown-menu {
            background-color: ${themeColors.cardBg} !important;
          }
          
          .ant-dropdown .ant-dropdown-menu-item {
            color: ${themeColors.text} !important;
          }
          .ant-dropdown .ant-dropdown-menu-item:hover {
            background-color: ${themeColors.hover} !important;
          }
          .ant-dropdown .ant-dropdown-menu-item .anticon {
            color: ${themeColors.text} !important;
          }
          .ant-dropdown .ant-dropdown-menu-item-divider {
            background-color: ${themeColors.border} !important;
          }
          /* Special styling for logout menu item */
          .ant-dropdown .ant-dropdown-menu-item:last-child {
            margin: 4px 8px !important;
            border-radius: 4px !important;
          }
          
          .ant-dropdown .ant-dropdown-menu-item:last-child:hover {
            opacity: 0.85 !important;
            background-color: ${themeColors.accent} !important;
          }
          
          .ant-dropdown .ant-dropdown-menu-item:last-child .anticon {
            color: #fff !important;
          }
          /* Existing styles continue below */
          ${styles.existingStyles}
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
          /* Fix profile icon color in dark mode */
          [data-theme='dark'] .header-profile-icon {
            color: #fff !important;
          }
          
          [data-theme='light'] .header-profile-icon {
            color: #000 !important;
          }
          /* Rate component styles for both themes */
          .ant-rate .ant-rate-star:not(.ant-rate-star-full) .ant-rate-star-first,
          .ant-rate .ant-rate-star:not(.ant-rate-star-full) .ant-rate-star-second {
            color: rgba(0, 0, 0, 0.25) !important;
          }
          
          [data-theme='dark'] .ant-rate .ant-rate-star:not(.ant-rate-star-full) .ant-rate-star-first,
          [data-theme='dark'] .ant-rate .ant-rate-star:not(.ant-rate-star-full) .ant-rate-star-second {
            color: rgba(255, 255, 255, 0.3) !important;
          }
          
          /* Ensure empty stars are visible */
          .ant-rate-star-zero .ant-rate-star-first,
          .ant-rate-star-zero .ant-rate-star-second {
            opacity: 1 !important;
          }

          /* Slider mark text styles for better visibility */
          .ant-slider-mark-text {
            color: ${themeColors.text}99 !important;
            font-size: 12px;
            font-weight: normal;
          }

          /* Active mark text styling */
          .ant-slider-mark-text-active {
            color: ${themeColors.text} !important;
            font-weight: 600;
            font-size: 13px;
          }

          /* Light mode specific adjustments */
          [data-theme='light'] .ant-slider-mark-text {
            color: rgba(0, 0, 0, 0.65) !important;
          }

          [data-theme='light'] .ant-slider-mark-text-active {
            color: rgba(0, 0, 0, 0.88) !important;
          }
          /* Dark mode specific adjustments */
          [data-theme='dark'] .ant-slider-mark-text {
            color: rgba(255, 255, 255, 0.65) !important;
          }

          [data-theme='dark'] .ant-slider-mark-text-active {
            color: rgba(255, 255, 255, 0.88) !important;
          }
          /* Calendar weekday header specific fixes for both themes */
          .ant-picker-content th {
            color: ${isDarkMode ? themeColors.primary : 'rgba(0, 0, 0, 0.85)'} !important;
            font-weight: bold !important;
            padding: 5px 0 !important;
          }
          
          /* Make sure the content inside calendar cells is visible */
          .ant-picker-content th, .ant-picker-content td {
            text-align: center !important;
          }
          
          /* Light mode weekday headers */
          [data-theme='light'] .ant-picker-content th {
            color: rgba(0, 0, 0, 0.85) !important;
            font-weight: bold !important;
          }
          
          /* Dark mode weekday headers - more contrast */
          [data-theme='dark'] .ant-picker-content th {
            color: ${themeColors.primary} !important;
            font-weight: bold !important;
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
          <ThemeToggle />
          <Dropdown menu={{ items: profileItems }} trigger={['click']}>
            <Button
              type="text"
              icon={
                <UserOutlined
                  style={{
                    fontSize: 24,
                    color: isDarkMode ? themeColors.primary : '#1890ff',
                    background: isDarkMode ? `${themeColors.primary}20` : `rgba(24, 144, 255, 0.1)`,
                    padding: isDarkMode ? '10px' : '8px',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease'
                  }}
                />
              }
              style={{
                borderRadius: '50%',
                marginLeft: 16, // Add margin between toggle and profile icon
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                const iconEl = e.currentTarget.querySelector('.anticon');
                if (iconEl) {
                  iconEl.style.background = isDarkMode
                    ? `${themeColors.primary}40`
                    : `rgba(24, 144, 255, 0.2)`;
                }
              }}
              onMouseLeave={(e) => {
                const iconEl = e.currentTarget.querySelector('.anticon');
                if (iconEl) {
                  iconEl.style.background = isDarkMode
                    ? `${themeColors.primary}20`
                    : `rgba(24, 144, 255, 0.1)`;
                }
              }}
            />
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
              Loading data...{Object.entries(loadingStates)
                .filter(([, isLoading]) => isLoading)
                .map(([key]) => ` ${key}`)
                .join(',')}
            </span>}
            className="custom-spin"
          >
            {dataLoadingError && !loading ? (
              <div style={{ textAlign: 'center', margin: '20px', color: themeColors.text }}>
                <p>Failed to load data. Please check your network and try again.</p>
                <Button type="primary" onClick={fetchAllData}>
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {/* Welcome Section */}
                  {(!loadingErrors.profile || username) && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                      <AntTitle level={2} style={{ textAlign: 'center', marginBottom: 24, color: themeColors.text }}>
                        {loadingStates.profile ? (
                          <Spin size="small" />
                        ) : (
                          `Welcome, ${username || 'Student'}! 👋`
                        )}
                      </AntTitle>
                    </motion.div>
                  )}

                  {/* Units Overview Cards */}
                  <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12}>
                      <motion.div initial="hidden" animate="visible" variants={styles.cardVariants}>
                        <Card hoverable className="summary-card-1" style={styles.summaryCard1}>
                          <Space direction="vertical">
                            <BookOutlined style={{ fontSize: 28, color: '#fff' }} />
                            <h3 style={{ fontWeight: 600, margin: '8px 0', color: '#fff' }}>Total Units</h3>
                            <h1 style={{ fontSize: 32, margin: 0, color: '#fff' }}>
                              {loadingErrors.units ? '?' : units.length}
                            </h1>
                            {loadingErrors.units && (
                              <Button size="small" onClick={() => fetchUnitsData()} style={{ marginTop: 8 }}>
                                Retry
                              </Button>
                            )}
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
                              {loadingErrors.attendance ? '?' : (
                                attendanceRates.length ?
                                  Math.round(attendanceRates.reduce((sum, rate) => sum + (rate.value === null ? 0 : parseFloat(rate.value)), 0) / attendanceRates.length)
                                  : 0
                              )}%
                            </h1>
                            {loadingErrors.attendance && (
                              <Button size="small" onClick={() => fetchAttendanceData()} style={{ marginTop: 8 }}>
                                Retry
                              </Button>
                            )}
                          </Space>
                        </Card>
                      </motion.div>
                    </Col>
                  </Row>

                  {/* Units Section */}
                  <section>
                    <AntTitle id="my-units" level={2} style={{ textAlign: 'center', marginBottom: 24, color: themeColors.text }}>
                      My Units
                    </AntTitle>
                    {loadingErrors.units ? (
                      <Card style={styles.card}>
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <p>Unable to load units. Please check your connection and try again.</p>
                          <Button type="primary" onClick={() => fetchUnitsData()}>
                            Retry Loading Units
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                        {units.map((unit) => unit && unit._id ? (
                          <Col xs={24} sm={12} md={8} lg={6} key={unit._id}>
                            <motion.div initial="hidden" animate="visible" variants={styles.cardVariants}>
                              <Card
                                title={<span style={{ color: themeColors.text, fontWeight: 600 }}>{unit.name || 'Untitled Unit'}</span>}
                                extra={<span style={{ color: `${themeColors.text}80` }}>{unit.code || 'N/A'}</span>}
                                hoverable
                                style={styles.card}
                                styles={{ body: { padding: '16px' }, header: { padding: '8px 16px', whiteSpace: 'normal', wordBreak: 'break-word' } }}
                                onClick={(e) => {
                                  e.preventDefault(); // Prevent default behavior
                                  try {
                                    // Only set selected unit if it's a valid object
                                    if (unit && typeof unit === 'object' && unit._id) {
                                      // Create a safe copy of the unit object to avoid rendering issues
                                      const safeUnit = {
                                        _id: unit._id,
                                        name: unit.name || 'Unnamed Unit',
                                        code: unit.code || 'N/A',
                                        // Format lecturer properly based on its type
                                        lecturer: typeof unit.lecturer === 'object'
                                          ? (unit.lecturer?.firstName && unit.lecturer?.lastName
                                            ? `${unit.lecturer.firstName} ${unit.lecturer.lastName}`
                                            : unit.lecturer?.name || 'N/A')
                                          : (unit.lecturer || 'N/A'),
                                        // Handle description that might be an object
                                        description: typeof unit.description === 'object'
                                          ? 'See course syllabus for details'
                                          : (unit.description || 'N/A')
                                      };

                                      // Set loading state for this unit before checking active session
                                      setActiveSessionsByUnit(prev => ({
                                        ...prev,
                                        [unit._id]: { loading: true }
                                      }));

                                      // Set selected unit immediately to show modal
                                      setSelectedUnit(safeUnit);

                                      // Then check for active session
                                      checkActiveSessionForUnit(unit._id);
                                    }
                                  } catch (error) {
                                    console.error("Error selecting unit:", error);
                                    message.error("Failed to select unit. Please try again.");
                                  }
                                }}
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
                                          !attendanceData.attendanceRecords.some((rec) =>
                                            rec.session.unit._id.toString() === unit._id.toString() &&
                                            rec.status === 'Present'
                                          )
                                        }
                                      >
                                        {(() => {
                                          const latestRecord = attendanceData.attendanceRecords
                                            .filter(rec => rec.session.unit._id.toString() === unit._id.toString())
                                            .sort((a, b) => new Date(b.session.endTime) - new Date(a.session.endTime))[0];
                                          if (!latestRecord) return 'Feedback';
                                          if (latestRecord.feedbackSubmitted) return 'Feedback Submitted';
                                          if (latestRecord.session.ended) return 'Feedback Available';
                                          return 'Feedback';
                                        })()}
                                      </Button>
                                    </Col>
                                  </Row>
                                </Space>
                              </Card>
                            </motion.div>
                          </Col>
                        ) : null)}
                      </Row>
                    )}
                  </section>

                  {/* Notifications and Calendar Section */}
                  <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                    <Col xs={24} md={12}>
                      {loadingErrors.feedback ? (
                        <Card style={styles.card}>
                          <div style={{ textAlign: 'center', padding: '20px' }}>
                            <p>Unable to load notifications.</p>
                            <Button type="link" onClick={() => fetchFeedbackData()}>
                              Retry
                            </Button>
                          </div>
                        </Card>
                      ) : (
                        renderNotifications()
                      )}
                    </Col>
                    <Col xs={24} md={12}>
                      {loadingErrors.attendance ? (
                        <Card style={styles.card}>
                          <div style={{ textAlign: 'center', padding: '20px' }}>
                            <p>Unable to load attendance events.</p>
                            <Button type="link" onClick={() => fetchAttendanceData()}>
                              Retry
                            </Button>
                          </div>
                        </Card>
                      ) : (
                        renderCalendarEvents()
                      )}
                    </Col>
                  </Row>

                  {/* Attendance Overview Section */}
                  <section>
                    <AntTitle id="attendance-overview" level={2} style={{ textAlign: 'center', marginBottom: 24, color: themeColors.text }}>
                      Attendance Overview
                    </AntTitle>
                    <Card style={styles.card}>
                      {loadingErrors.attendance ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <p>Unable to load attendance data.</p>
                          <Button type="primary" onClick={() => fetchAttendanceData()}>
                            Retry Loading Data
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div style={{ height: '400px' }}>
                            <Bar data={chartData} options={chartOptions} />
                          </div>
                          <Button
                            type="primary"
                            style={{ ...styles.button, color: '#fff !important', marginTop: '20px' }}
                            onClick={() => setDownloadModalVisible(true)}
                            className="export-button"
                          >
                            <span style={{ color: '#fff' }}>Download Attendance Report</span>
                          </Button>
                        </>
                      )}
                    </Card>
                  </section>
                </Space>

                <Modal
                  open={!!selectedUnit}
                  title={<span style={{ color: themeColors.text }}>{selectedUnit?.name}</span>}
                  onCancel={() => setSelectedUnit(null)}
                  footer={<Button onClick={() => setSelectedUnit(null)}>Close</Button>}
                  centered
                  width={Math.min(window.innerWidth * 0.9, 500)}
                >
                  {selectedUnit && (
                    <Space direction="vertical" style={{ width: '100%', color: themeColors.text }}>
                      <p><strong>Code:</strong> {selectedUnit.code || 'N/A'}</p>
                      <p><strong>Lecturer:</strong> {
                        typeof selectedUnit.lecturer === 'object'
                          ? (selectedUnit.lecturer?.firstName && selectedUnit.lecturer?.lastName
                            ? `${selectedUnit.lecturer.firstName} ${selectedUnit.lecturer.lastName}`
                            : selectedUnit.lecturer?.name || 'N/A')
                          : (selectedUnit.lecturer || 'N/A')
                      }</p>
                      {/* Only show description if it has meaningful content */}
                      {selectedUnit.description && selectedUnit.description !== 'N/A' && (
                        <p><strong>Description:</strong> {
                          typeof selectedUnit.description === 'object'
                            ? 'See course syllabus for details'
                            : selectedUnit.description
                        }</p>
                      )}

                      {/* Display session status with improved loading state handling */}
                      <div style={{
                        marginTop: '12px',
                        padding: '8px',
                        borderRadius: '4px',
                        backgroundColor: activeSessionsByUnit[selectedUnit._id] && !activeSessionsByUnit[selectedUnit._id].loading
                          ? `${themeColors.secondary}20`
                          : `${themeColors.accent}20`,
                        borderLeft: `4px solid ${activeSessionsByUnit[selectedUnit._id] && !activeSessionsByUnit[selectedUnit._id].loading
                          ? themeColors.secondary
                          : themeColors.accent}`,
                      }}>
                        {activeSessionsByUnit[selectedUnit._id]?.loading ? (
                          // Show loading state
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Spin size="small" style={{ marginRight: '10px' }} />
                            <p style={{ margin: 0 }}>Checking session status...</p>
                          </div>
                        ) : (
                          // Show session status after loading completes
                          <>
                            <p style={{
                              margin: 0,
                              fontWeight: 'bold',
                              color: activeSessionsByUnit[selectedUnit._id] ? themeColors.secondary : themeColors.accent
                            }}>
                              {activeSessionsByUnit[selectedUnit._id]
                                ? <><span style={{ marginRight: '8px' }}>●</span> Active Session Available</>
                                : <><span style={{ marginRight: '8px' }}>○</span> No Active Session</>}
                            </p>
                            {activeSessionsByUnit[selectedUnit._id] && (
                              <>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                                  Started: {moment(activeSessionsByUnit[selectedUnit._id].startTime).format('MMM D, YYYY h:mm A')}
                                </p>
                                <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}>
                                  Ends: {activeSessionsByUnit[selectedUnit._id].duration
                                    ? moment(activeSessionsByUnit[selectedUnit._id].startTime)
                                      .add(activeSessionsByUnit[selectedUnit._id].duration, 'minutes')
                                      .format('MMM D, YYYY h:mm A')
                                    : 'When lecturer ends the session or by default after one hour'}
                                </p>
                                <p style={{
                                  margin: '4px 0 0 0',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  color: sessionCountdowns[selectedUnit._id] === 'Ended' ? themeColors.accent : themeColors.secondary
                                }}>
                                  Time remaining: {sessionCountdowns[selectedUnit._id] || 'Calculating...'}
                                </p>
                              </>
                            )}
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                              {activeSessionsByUnit[selectedUnit._id]
                                ? 'You can mark attendance for this session now.'
                                : 'Check back later for the next available session.'}
                            </p>
                          </>
                        )}
                      </div>

                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                        <Button
                          type="primary"
                          icon={<QrcodeOutlined style={{ color: '#fff' }} />}
                          onClick={() => { handleAttendClick(selectedUnit._id); }}
                          disabled={!activeSessionsByUnit[selectedUnit._id] || activeSessionsByUnit[selectedUnit._id]?.loading}
                          style={{
                            ...styles.button,
                            color: '#fff',
                            opacity: activeSessionsByUnit[selectedUnit._id] && !activeSessionsByUnit[selectedUnit._id]?.loading ? 1 : 0.6
                          }}
                        >
                          <span style={{ color: '#fff' }}>Attend Session</span>
                        </Button>
                      </div>
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
                        color: '#fff !important',
                      }
                    }
                  }}
                >
                  <Space direction="vertical" size={16} style={{ width: '100%', color: themeColors.text }}>
                    <div>
                      <p>Overall Satisfaction <span style={{ color: themeColors.accent }}>*</span></p>
                      <Rate
                        allowHalf
                        value={feedbackData.rating}
                        onChange={(value) => setFeedbackData({ ...feedbackData, rating: value })}
                        style={{ color: themeColors.primary }}
                      />
                    </div>
                    <div>
                      <p>Pace of the Session (Slow to Fast) <span style={{ color: themeColors.accent }}>*</span></p>
                      <Slider
                        min={0}
                        max={100}
                        value={feedbackData.pace}
                        onChange={(value) => setFeedbackData({ ...feedbackData, pace: value })}
                        marks={{
                          0: 'Too Slow',
                          25: 'Slow',
                          50: 'Just Right',
                          75: 'Fast',
                          100: 'Too Fast'
                        }}
                        step={25}
                        style={{ marginBottom: '24px' }}
                      />
                    </div>
                    <div>
                      <p>Interactivity Level <span style={{ color: themeColors.accent }}>*</span></p>
                      <Rate
                        value={feedbackData.interactivity}
                        onChange={(value) => setFeedbackData({ ...feedbackData, interactivity: value })}
                        style={{ color: themeColors.primary }}
                      />
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
                        color: themeColors.accent,
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
                  centered={false}
                >
                  <p style={{ color: themeColors.text }}>
                    We use anonymous device characteristics to prevent attendance fraud. No personal data is collected.
                    By continuing, you agree to this analysis for attendance verification purposes only.
                  </p>
                </Modal>

                <Modal
                  title={<span style={{ color: themeColors.text }}>Download Attendance Report</span>}
                  open={downloadModalVisible}
                  onCancel={() => setDownloadModalVisible(false)}
                  onOk={handleDownloadAttendance}
                  okText="Download"
                  okButtonProps={{
                    style: { ...styles.button, color: '#fff' }
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Select
                      placeholder="Select Unit (Optional)"
                      style={{ width: '100%' }}
                      allowClear
                      value={downloadFilters.unit}
                      onChange={(value) => setDownloadFilters(prev => ({ ...prev, unit: value }))}
                    >
                      <Option value={null}>All Units</Option>
                      {units.map(unit => (
                        <Option key={unit._id} value={unit._id}>{unit.name}</Option>
                      ))}
                    </Select>

                    <DatePicker.RangePicker
                      style={{ width: '100%' }}
                      onChange={(dates) => {
                        setDownloadFilters(prev => ({
                          ...prev,
                          startDate: dates?.[0] || null,
                          endDate: dates?.[1] || null
                        }));
                      }}
                      popupStyle={{ position: 'fixed' }}
                      getPopupContainer={trigger => trigger.parentNode}
                      responsive={true}
                      format="YYYY-MM-DD"
                    />
                  </Space>
                </Modal>
              </>
            )}
          </Spin>
        </Content>
      </Layout>

      {/* Add Back to Top Button */}
      {showBackToTop && (
        <Button
          type="primary"
          icon={<ArrowUpOutlined />}
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: themeColors.accent,
            border: '2px solid #fff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 9999,
          }}
        />
      )}
      <BackToTop />
    </Layout>
  );
};

export default StudentDashboard;