import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStudentAttendance,
  getStudentUnits,
  getUserProfile,
  submitFeedback,
  getActiveSessionForUnit,
  getPendingFeedbackAttendance,
  checkSessionStatus,
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
  ArrowUpOutlined,
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
import { openDB } from 'idb';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;
const { Option } = Select;
const API_URL = 'https://attendance-system-w70n.onrender.com/api';

const StudentDashboard = () => {
  const { isDarkMode, themeColors } = useContext(ThemeContext);
  const styles = useStyles(isDarkMode, themeColors);
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(window.innerWidth < 992);
  const [units, setUnits] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ attendanceRecords: [], weeklyEvents: [], dailyEvents: [] });
  const [attendanceRates, setAttendanceRates] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    profile: false,
    units: false,
    attendance: false,
    feedback: false,
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
  const [dataLoadingError, setDataLoadingError] = useState(false);
  const [latestSession, setLatestSession] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSessionsByUnit, setActiveSessionsByUnit] = useState({});
  const [sessionCountdowns, setSessionCountdowns] = useState({});
  const [loadingErrors, setLoadingErrors] = useState({
    profile: false,
    units: false,
    attendance: false,
    feedback: false,
  });
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloadFilters, setDownloadFilters] = useState({
    unit: null,
    startDate: null,
    endDate: null,
  });

  const fetchProfileData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoadingStates((prev) => ({ ...prev, profile: true }));
    try {
      const profileRes = await getUserProfile(token);

      if (profileRes && profileRes.firstName) {
        setUsername(profileRes.firstName);
      }

      const profileData = {
        data: profileRes,
        expiry: Date.now() + 24 * 60 * 60 * 1000,
      };
      localStorage.setItem('cachedProfileData', JSON.stringify(profileData));
      setLoadingErrors((prev) => ({ ...prev, profile: false }));
      return profileRes;
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setLoadingErrors((prev) => ({ ...prev, profile: true }));
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
        console.error('Error loading cached profile:', e);
      }
      throw error;
    } finally {
      setLoadingStates((prev) => ({ ...prev, profile: false }));
    }
  }, []);

  const fetchUnitsData = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, units: true }));

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const userId = localStorage.getItem('userId');
      let response = null;

      if (userId) {
        try {
          response = await axios.get(`${API_URL}/students/${userId}/units`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Units fetched via student ID:', response.data);
        } catch (err) {
          console.log('Could not fetch units via student ID, falling back to standard endpoint');
        }
      }

      if (!response || !response.data || response.data.length === 0) {
        response = await axios.get(`${API_URL}/unit/student/units`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Units fetched via standard API:', response.data);
      }

      if (response?.data) {
        setUnits(Array.isArray(response.data) ? response.data : []);

        if (response.data.length > 0 && !selectedUnit) {
          setSelectedUnit(response.data[0]._id);
        }

        setLoadingStates((prev) => ({ ...prev, units: false }));
        setLoadingErrors((prev) => ({ ...prev, units: false }));
      } else {
        throw new Error('No units data returned');
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      setLoadingStates((prev) => ({ ...prev, units: false }));
      setLoadingErrors((prev) => ({ ...prev, units: true }));
    }
  }, [selectedUnit]);

  const fetchAttendanceData = useCallback(async (profileId) => {
    const token = localStorage.getItem('token');
    if (!token || !profileId) return;

    setLoadingStates((prev) => ({ ...prev, attendance: true }));
    try {
      const attendanceRes = await getStudentAttendance(profileId);
      setAttendanceData(attendanceRes);
      return attendanceRes;
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      throw error;
    } finally {
      setLoadingStates((prev) => ({ ...prev, attendance: false }));
    }
  }, []);

  const fetchFeedbackData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const lastFetchTime = localStorage.getItem('lastFeedbackFetch');
    const now = Date.now();
    const FETCH_COOLDOWN = 5 * 60 * 1000;

    if (lastFetchTime && now - parseInt(lastFetchTime) < FETCH_COOLDOWN) {
      return;
    }

    setLoadingStates((prev) => ({ ...prev, feedback: true }));
    try {
      const feedbackRes = await getPendingFeedbackAttendance();

      localStorage.setItem('lastFeedbackFetch', now.toString());

      const processedNotifications = new Set(JSON.parse(localStorage.getItem('processedNotifications') || '[]'));

      const existingNotificationIds = new Set(pendingFeedbacks.map((pf) => `${pf.sessionId}-${pf.unitId}`));

      const newPendingFeedbacks = feedbackRes.pendingFeedbackRecords
        .filter(
          (record) =>
            !processedNotifications.has(record.session._id) &&
            !existingNotificationIds.has(`${record.session._id}-${record.session.unit._id}`)
        )
        .map((record) => ({
          sessionId: record.session._id,
          unitId: record.session.unit._id,
          unitName: record.session.unit.name,
          title: 'Feedback Available',
          message: 'Please provide your feedback for the session.',
          timestamp: record.session.endTime || new Date(),
          notificationId: `${record.session._id}-${record.session.unit._id}`,
        }));

      if (newPendingFeedbacks.length > 0) {
        const checkedFeedbacks = await Promise.all(
          newPendingFeedbacks.map(async (feedback) => {
            try {
              const { isExpired } = await fetchSessionStatus(feedback.unitId, feedback.sessionId);
              if (isExpired) {
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

        localStorage.setItem('processedNotifications', JSON.stringify([...processedNotifications]));

        const validFeedbacks = checkedFeedbacks.filter((f) => f !== null);

        setPendingFeedbacks((prev) => {
          const existingNotifications = new Map(prev.map((p) => [p.notificationId || `${p.sessionId}-${p.unitId}`, p]));

          validFeedbacks.forEach((feedback) => {
            if (feedback) {
              existingNotifications.set(feedback.notificationId, feedback);
            }
          });

          return Array.from(existingNotifications.values());
        });
      }

      return feedbackRes;
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      throw error;
    } finally {
      setLoadingStates((prev) => ({ ...prev, feedback: false }));
    }
  }, [pendingFeedbacks]);

  const fetchAllData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setDataLoadingError(false);

    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      setDataLoadingError(true);
      message.error('Loading took too long. Please try refreshing the page.');
    }, 30000);

    setLoading(true);
    try {
      const profileRes = await fetchProfileData();

      const unitsPromise = fetchUnitsData();

      let attendancePromise = null;
      if (profileRes && profileRes._id) {
        attendancePromise = fetchAttendanceData(profileRes._id);
      }

      await Promise.all([unitsPromise, attendancePromise].filter(Boolean));

      await fetchFeedbackData();

      clearTimeout(loadingTimeout);
    } catch (error) {
      console.error('Error fetching data:', error);
      setDataLoadingError(true);
      if (error.response && error.response.status === 429) {
        message.error('Too many requests. Please wait a moment and try again.');
      } else {
        message.error('Unable to load data. Please check your connection and try again.');
      }
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  }, [fetchProfileData, fetchUnitsData, fetchAttendanceData, fetchFeedbackData]);

  useEffect(() => {
    let isMounted = true;

    const returnFromAttendance = sessionStorage.getItem('returnFromAttendance');
    if (returnFromAttendance === 'true') {
      sessionStorage.removeItem('returnFromAttendance');

      const getCachedData = async () => {
        try {
          const cachedAttendanceData = await getFromIndexedDB('attendance', 'studentAttendance');
          if (cachedAttendanceData && isMounted) {
            setAttendanceData(cachedAttendanceData);
          }

          const cachedUnitsData = await getFromIndexedDB('units', 'studentUnits');
          if (cachedUnitsData && cachedUnitsData.length > 0 && isMounted) {
            setUnits(cachedUnitsData);
            if (!selectedUnit && cachedUnitsData.length > 0) {
              setSelectedUnit(cachedUnitsData[0]._id);
            }
          }
        } catch (err) {
          console.log('Error retrieving cached data', err);
        }
      };

      getCachedData();
    }

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [navigate, fetchAllData]);

  const storeInIndexedDB = async (storeName, key, data) => {
    try {
      const db = await initDB();
      await db.put(storeName, data, key);
    } catch (err) {
      console.error('Error storing data in IndexedDB:', err);
    }
  };

  const getFromIndexedDB = async (storeName, key) => {
    try {
      const db = await initDB();
      return await db.get(storeName, key);
    } catch (err) {
      console.error('Error getting data from IndexedDB:', err);
      return null;
    }
  };

  const initDB = async () => {
    return openDB('attendance-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile');
        }
        if (!db.objectStoreNames.contains('attendance')) {
          db.createObjectStore('attendance');
        }
        if (!db.objectStoreNames.contains('units')) {
          db.createObjectStore('units');
        }
      },
    });
  };

  return (
    <Layout style={styles.layout} data-theme={isDarkMode ? 'dark' : 'light'}>
      {/* Content omitted for brevity */}
    </Layout>
  );
};

export default StudentDashboard;