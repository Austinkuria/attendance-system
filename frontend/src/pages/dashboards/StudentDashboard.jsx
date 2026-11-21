import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  API_URL,
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
  Button,
  Modal,
  message,
  Input,
  Rate,
  Space,
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
  QrcodeOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import 'antd/dist/reset.css';
import './StudentDashboard.css';
import { ThemeContext } from '../../context/ThemeContext';
import { useStyles } from '../../styles/styles.js';
import { useContext } from 'react';
import StatCard from '../../components/StatCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const { Option } = Select;

const StudentDashboard = () => {
  // Removed unused dashboardData state
  const { isDarkMode, themeColors } = useContext(ThemeContext);
  const styles = useStyles(isDarkMode, themeColors);
  const navigate = useNavigate();

  const [units, setUnits] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ attendanceRecords: [], weeklyEvents: [], dailyEvents: [] });
  const [attendanceRates, setAttendanceRates] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  // Add separate loading states for different data types
  const [loadingStates, setLoadingStates] = useState({
    profile: false,
    units: false,
    attendance: false,
    feedback: false
  });
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
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [deviceModalConfirmed, setDeviceModalConfirmed] = useState(false);

  // Add state variables for session status
  const [latestSession, setLatestSession] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(true);

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

      // Store profile data in localStorage with expiration time (1 day)
      const profileData = {
        data: profileRes,
        expiry: Date.now() + (24 * 60 * 60 * 1000)
      };
      localStorage.setItem('cachedProfileData', JSON.stringify(profileData));
      setLoadingErrors(prev => ({ ...prev, profile: false }));
      return profileRes;
    } catch (error) {
      console.warn("Could not retrieve remote profile data, falling back to local session:", error.message);
      setLoadingErrors(prev => ({ ...prev, profile: false }));
      // Try to use cached data or stored user session as fallback
      try {
        const cachedProfile = localStorage.getItem('cachedProfileData');
        if (cachedProfile) {
          const parsedProfile = JSON.parse(cachedProfile);
          if (parsedProfile.data?.firstName) {
            return parsedProfile.data;
          }
        }
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const parsed = JSON.parse(storedUserData);
          return parsed;
        }
      } catch (e) {
        console.error("Error loading fallback profile:", e);
      }
      return { firstName: 'Student', role: 'student' };
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
    // Set a timeout to prevent infinite loading - increase to 30 seconds
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
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
      title: { display: false },
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
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Attendance Events</h2>
          <p className="text-xs text-slate-500">Upcoming and past class sessions</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={viewMode}
              onChange={(value) => {
                setViewMode(value);
                if (value === 'daily') {
                  setSelectedDate(moment());
                } else {
                  setSelectedDate(moment().startOf('week'));
                }
                setEventPage(1);
              }}
              style={{ width: 85, fontSize: '12px' }}
            >
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
            </Select>
            <DatePicker
              onChange={handleDateChange}
              value={getDatePickerValue()}
              format={getDatePickerFormat()}
              picker={viewMode === 'weekly' ? 'date' : 'date'}
              placeholder={viewMode === 'weekly' ? 'Select Date for Week' : 'Select Date'}
              style={{ width: 145, fontSize: '12px' }}
            />
            {totalEvents > 0 && (
              <Select
                value={eventSortOrder}
                onChange={(value) => {
                  setEventSortOrder(value);
                  setEventPage(1);
                }}
                style={{ width: 130, fontSize: '12px' }}
              >
                <Option value="mostRecent">Most Recent</Option>
                <Option value="oldest">Oldest</Option>
              </Select>
            )}
          </div>

          {selectedDate && (
            <div className="text-xs text-slate-500 font-medium">
              {viewMode === 'weekly' ? (
                <>
                  Showing: {moment(selectedDate).startOf('week').format('MMM D')} to {moment(selectedDate).endOf('week').format('MMM D, YYYY')}
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
                      title={<span className="text-sm font-medium text-slate-900">{item.title}</span>}
                      description={<span className="text-xs text-slate-500">{item.date ? item.date.format('YYYY-MM-DD') + ` (${item.status})` : 'No Date'}</span>}
                    />
                  </List.Item>
                )}
                style={{ maxHeight: '280px', overflow: 'auto' }}
              />
              <Pagination
                current={eventPage}
                pageSize={pageSize}
                total={totalEvents}
                onChange={(page) => {
                  const maxPage = Math.ceil(totalEvents / pageSize);
                  if (page <= maxPage) {
                    setEventPage(page);
                  }
                }}
                showSizeChanger={false}
                size="small"
                style={{ textAlign: 'center', marginTop: 12 }}
              />
            </>
          ) : (
            <p className="text-center text-xs text-slate-500 py-6">No events found for the selected period.</p>
          )}
        </div>
      </div>
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
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
            <p className="text-xs text-slate-500">Feedback requests and session alerts</p>
          </div>
          {totalNotifications > 0 && (
            <button
              type="button"
              onClick={() => setPendingFeedbacks([])}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="p-4 space-y-3">
          {totalNotifications > 0 && (
            <div className="flex justify-end">
              <Select
                value={notificationSortOrder}
                onChange={(value) => {
                  setNotificationSortOrder(value);
                  setNotificationPage(1);
                }}
                style={{ width: 130, fontSize: '12px' }}
              >
                <Option value="mostRecent">Most Recent</Option>
                <Option value="oldest">Oldest</Option>
              </Select>
            </div>
          )}
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
                        <button
                          key="provide-feedback"
                          type="button"
                          onClick={() => handleProvideFeedback(item.sessionId, item.unitId)}
                          disabled={isFeedbackSubmitted}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 transition-colors"
                        >
                          Provide
                        </button>,
                        <button
                          key="dismiss"
                          type="button"
                          onClick={() => setPendingFeedbacks((prev) => prev.filter((pf) => pf.sessionId !== item.sessionId))}
                          className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                        >
                          Dismiss
                        </button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={<span className="text-sm font-medium text-slate-900">{item.title || 'Notification'}</span>}
                        description={<span className="text-xs text-slate-500">{`${item.message || ''} (Unit: ${item.unitName || 'Unknown'})`}</span>}
                      />
                    </List.Item>
                  );
                }}
                style={{ maxHeight: '280px', overflow: 'auto' }}
              />
              <Pagination
                current={notificationPage}
                pageSize={pageSize}
                total={totalNotifications}
                onChange={(page) => {
                  const maxPage = Math.ceil(totalNotifications / pageSize);
                  if (page <= maxPage) {
                    setNotificationPage(page);
                  }
                }}
                showSizeChanger={false}
                size="small"
                style={{ textAlign: 'center', marginTop: 12 }}
              />
            </>
          ) : (
            <p className="text-center text-xs text-slate-500 py-6">No new notifications.</p>
          )}
        </div>
      </div>
    );
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Probe active sessions for all enrolled units on load and periodically
  useEffect(() => {
    if (units.length > 0) {
      units.forEach((unit) => {
        if (unit?._id) {
          checkActiveSessionForUnit(unit._id);
        }
      });
      const interval = setInterval(() => {
        units.forEach((unit) => {
          if (unit?._id) {
            checkActiveSessionForUnit(unit._id);
          }
        });
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [units]);

  // Derive the first live session entry if any exists
  const activeSessionEntry = useMemo(() => {
    for (const unit of units) {
      if (!unit?._id) continue;
      const session = activeSessionsByUnit[unit._id];
      if (session && !session.ended && !session.loading) {
        return { unit, session, countdown: sessionCountdowns[unit._id] };
      }
    }
    return null;
  }, [units, activeSessionsByUnit, sessionCountdowns]);

  // Main render
  return (
    <div className="space-y-6 w-full min-w-0">
      <PageHeader
        title="Student Dashboard"
        subtitle="Track enrolled units, recent attendance, and scan session QR codes."
        actions={
          <button
            type="button"
            onClick={() => {
              if (activeSessionEntry?.unit?._id) {
                handleAttendClick(activeSessionEntry.unit._id);
              } else if (units.length > 0 && units[0]?._id) {
                handleAttendClick(units[0]._id);
              } else {
                message.info("Please wait for your units to load.");
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            <QrcodeOutlined />
            Scan QR
          </button>
        }
      />

      {/* KPI StatCards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <StatCard
          title="Total Units"
          value={loadingErrors.units ? '?' : units.length}
          loading={loadingStates.units}
          subtitle="Enrolled semester units"
        />
        <StatCard
          title="Attendance Rate"
          value={loadingErrors.attendance ? '?' : `${attendanceRates.length ? Math.round(attendanceRates.reduce((sum, rate) => sum + (rate.value === null ? 0 : parseFloat(rate.value)), 0) / attendanceRates.length) : 0}%`}
          loading={loadingStates.attendance}
          subtitle="Across all lectures"
        />
        <StatCard
          title="Sessions Attended"
          value={loadingErrors.attendance ? '?' : attendanceData.attendanceRecords.filter(r => r.status === 'Present').length}
          loading={loadingStates.attendance}
          subtitle="Verified present"
        />
        <StatCard
          title="Pending Feedback"
          value={loadingErrors.feedback ? '?' : pendingFeedbacks.length}
          loading={loadingStates.feedback}
          subtitle="Lectures awaiting review"
        />
      </div>

      {/* Top Live Lecture Alert Banner */}
      {activeSessionEntry && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-emerald-950 text-sm truncate">
                Live Session Active: {activeSessionEntry.unit.code || 'Unit'} • {activeSessionEntry.unit.name}
                {activeSessionEntry.session.venue ? ` (${activeSessionEntry.session.venue})` : ''}
                {activeSessionEntry.countdown && activeSessionEntry.countdown !== 'Ended' ? ` • Closes in ${activeSessionEntry.countdown}` : ''}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Attendance check-in is currently open for this lecture.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleAttendClick(activeSessionEntry.unit._id)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 transition-colors shadow-2xs"
          >
            <QrcodeOutlined />
            Check In Now
          </button>
        </div>
      )}

      {/* 12-Column Asymmetric Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Enrolled Units & Attendance Chart (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Enrolled Units Card */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Enrolled Units</h2>
                <p className="text-xs text-slate-500">Your registered course modules for this academic period</p>
              </div>
            </div>
            <div className="p-5">
              {loadingErrors.units ? (
                <div className="text-center py-6 text-sm text-slate-500">
                  <p>Unable to load units. Please check your connection and try again.</p>
                  <button
                    type="button"
                    onClick={() => fetchUnitsData()}
                    className="mt-3 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 text-white"
                  >
                    Retry Loading Units
                  </button>
                </div>
              ) : units.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">
                  No enrolled units found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {units.map((unit) => {
                    if (!unit || !unit._id) return null;
                    const rate = calculateAttendanceRate(unit._id);
                    const session = activeSessionsByUnit[unit._id];
                    const isLive = session && !session.ended && !session.loading;
                    const hasFeedbackSubmitted = attendanceData.attendanceRecords.some(
                      (rec) => rec.session.unit._id.toString() === unit._id.toString() && rec.feedbackSubmitted
                    );
                    const canGiveFeedback = attendanceData.attendanceRecords.some(
                      (rec) => rec.session.unit._id.toString() === unit._id.toString() && rec.status === 'Present'
                    );

                    const lecturerName = typeof unit.lecturer === 'object'
                      ? (unit.lecturer?.firstName && unit.lecturer?.lastName
                        ? `${unit.lecturer.firstName} ${unit.lecturer.lastName}`
                        : unit.lecturer?.name || 'N/A')
                      : (unit.lecturer || 'N/A');

                    return (
                      <div key={unit._id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">{unit.name || 'Untitled Unit'}</span>
                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                              {unit.code || 'N/A'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Lecturer: {lecturerName}</p>
                          <div className="flex items-center gap-3 mt-2 max-w-xs">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-slate-900 h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, rate === null ? 0 : parseFloat(rate)))}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium tabular-nums text-slate-700">
                              {rate === null ? 'No sessions' : `${rate}%`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isLive ? (
                            <button
                              type="button"
                              onClick={() => handleAttendClick(unit._id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
                            >
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                              </span>
                              Check In
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            >
                              No Active Class
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openFeedbackModal(unit._id)}
                            disabled={!canGiveFeedback}
                            className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors"
                          >
                            {hasFeedbackSubmitted ? 'Feedback Submitted' : 'Feedback'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Attendance Overview Chart */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Attendance Overview</h2>
                <p className="text-xs text-slate-500">Comparative attendance performance across enrolled units</p>
              </div>
              <button
                type="button"
                onClick={() => setDownloadModalVisible(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              >
                Download Report
              </button>
            </div>
            <div className="p-5">
              <div style={{ height: '320px' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Notifications & Events (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {renderNotifications()}
          {renderCalendarEvents()}
        </div>
      </div>

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
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: activeSessionsByUnit[selectedUnit._id] && !activeSessionsByUnit[selectedUnit._id].loading
                ? (isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)')
                : (isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)'),
              border: `1px solid ${activeSessionsByUnit[selectedUnit._id] && !activeSessionsByUnit[selectedUnit._id].loading
                ? (isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)')
                : (isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)')}`,
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
    </div>
  );
};

export default StudentDashboard;