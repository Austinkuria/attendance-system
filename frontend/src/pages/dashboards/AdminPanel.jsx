import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useStyles } from '../../styles/styles.js';
import ThemeToggle from '../../components/ThemeToggle';
import {
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  LogoutOutlined,
  TeamOutlined,
  LineChartOutlined,
  FormOutlined,
} from '@ant-design/icons';
import {
  Layout,
  Menu,
  Button,
  Modal,
  Card,
  Row,
  Col,
  Dropdown,
  Space,
  message,
  Typography,
  Spin,
} from 'antd';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { motion } from 'framer-motion';
import { getStudents, getLecturers, getCourses, getCourseAttendanceRate } from '../../services/api';
import BackToTop from '../../components/BackToTop';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;

const AdminPanel = () => {
  const { isDarkMode, setIsDarkMode, themeColors } = useContext(ThemeContext);
  const styles = useStyles(isDarkMode, themeColors);

  const [collapsed, setCollapsed] = useState(window.innerWidth < 992);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState({});
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [lecturersLoading, setLecturersLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) window.location.href = '/auth/login';
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('popstate', () => {
      if (!localStorage.getItem('token')) window.location.href = '/auth/login';
    });
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('popstate', checkAuth);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setCollapsed(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('attendanceRates');
    sessionStorage.clear();
    window.location.href = '/auth/login';
    window.location.reload(true);
  };

  useEffect(() => {
    const fetchStudents = async () => {
      setStudentsLoading(true);
      try {
        const studentsRes = await getStudents();
        setStudents(studentsRes || []);
      } catch (error) {
        console.error('Failed to fetch students:', error.message || 'Unknown error');
        message.error('Failed to load students');
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchLecturers = async () => {
      setLecturersLoading(true);
      try {
        const lecturersRes = await getLecturers();
        setLecturers(lecturersRes || []);
      } catch (error) {
        console.error('Failed to fetch lecturers:', error.message || 'Unknown error');
        message.error('Failed to load lecturers');
      } finally {
        setLecturersLoading(false);
      }
    };
    fetchLecturers();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      setCoursesLoading(true);
      try {
        const coursesRes = await getCourses();
        setCourses(coursesRes || []);
      } catch (error) {
        console.error('Failed to fetch courses:', error.message || 'Unknown error');
        message.error('Failed to load courses');
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchAttendanceRates = async () => {
      if (!courses.length) return;
      const cachedRates = localStorage.getItem('attendanceRates');
      if (cachedRates) {
        setAttendanceRates(JSON.parse(cachedRates));
        return;
      }
      setAttendanceLoading(true);
      try {
        const attendancePromises = courses.map(course =>
          getCourseAttendanceRate(course._id)
            .then(rateData => ({ courseId: course._id, rate: rateData }))
            .catch(error => {
              console.error(`Failed to fetch attendance for ${course._id}:`, error.message || 'Unknown error');
              return { courseId: course._id, rate: { totalPresent: 0, totalPossible: 0 } };
            })
        );
        const results = await Promise.all(attendancePromises);
        const rates = results.reduce((acc, { courseId, rate }) => {
          acc[courseId] = rate;
          return acc;
        }, {});
        setAttendanceRates(rates);
        localStorage.setItem('attendanceRates', JSON.stringify(rates));
      } catch (error) {
        console.error('Failed to fetch attendance rates:', error.message || 'Unknown error');
        message.error('Failed to load attendance data');
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchAttendanceRates();
  }, [courses]);

  const calculateOverallRate = () => {
    const totalPresent = Object.values(attendanceRates).reduce((sum, rate) => sum + (rate.totalPresent || 0), 0);
    const totalPossible = Object.values(attendanceRates).reduce((sum, rate) => sum + (rate.totalPossible || 0), 0);
    return totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
  };

  const overviewChartData = {
    labels: courses.length ? courses.map(course => course.code) : ['No Data'],
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: courses.length
          ? courses.map(course => {
            const rate = attendanceRates[course._id];
            return rate && rate.totalPossible > 0 ? Math.round((rate.totalPresent / rate.totalPossible) * 100) : 0;
          })
          : [0],
        borderColor: themeColors.primary,
        backgroundColor: `${themeColors.primary}33`,
        fill: false,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const overviewChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: themeColors.text, font: { size: 14, weight: 'bold' } } },
      title: { display: true, text: 'Course Attendance Overview', color: themeColors.text, font: { size: 18, weight: 'bold' } },
      tooltip: {
        callbacks: {
          label: (context) => {
            const courseId = courses[context.dataIndex]?._id;
            const rate = attendanceRates[courseId];
            return rate ? `${context.dataset.label}: ${context.raw}% (Present: ${rate.totalPresent}/${rate.totalPossible})` : `${context.dataset.label}: ${context.raw}%`;
          },
        },
      },
    },
    scales: {
      y: { min: 0, max: 100, title: { display: true, text: 'Rate (%)', color: themeColors.text }, grid: { color: `${themeColors.text}20` }, ticks: { color: themeColors.text } },
      x: { title: { display: true, text: 'Courses', color: themeColors.text }, ticks: { maxRotation: 45, minRotation: 45, color: themeColors.text }, grid: { display: false } },
    },
    layout: { padding: { top: 20, bottom: 20, left: 20, right: 20 } },
  };

  const quickStatsChartData = {
    labels: courses.length ? courses.map(course => course.name) : ['No Data'],
    datasets: [
      {
        label: 'Total Sessions',
        data: courses.length
          ? courses.map(course => {
            const rate = attendanceRates[course._id];
            return rate ? rate.weeklyTrends?.reduce((acc, t) => acc + (t.sessionCount || 0), 0) || 0 : 0;
          })
          : [0],
        backgroundColor: [
          themeColors.primary,
          themeColors.secondary,
          themeColors.accent,
          '#0984E3',
          '#A29BFE',
          '#81ECEC',
        ].slice(0, courses.length || 1),
        borderColor: [
          isDarkMode ? '#5A4FCF' : '#6C5CE7',
          isDarkMode ? '#00B7B3' : '#00CEC9',
          isDarkMode ? '#E65F5C' : '#FF7675',
          '#0773C4',
          '#8E86E5',
          '#6CDADA',
        ].slice(0, courses.length || 1),
        borderWidth: 1,
      },
    ],
  };

  const quickStatsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: themeColors.text, font: { size: 14, weight: 'bold' } } },
      title: { display: true, text: 'Session Distribution by Course', color: themeColors.text, font: { size: 18, weight: 'bold' } },
      tooltip: {
        callbacks: {
          label: (context) => {
            const courseName = context.label;
            const sessions = context.raw;
            const avgRate = weeklyTrendsAvg();
            return `${courseName}: ${sessions} sessions (Avg Rate: ${avgRate.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  const menuItems = [
    { key: '1', icon: <TeamOutlined />, label: 'Manage Students', onClick: () => window.location.href = '/admin/manage-students' },
    { key: '2', icon: <BookOutlined />, label: 'Manage Courses', onClick: () => window.location.href = '/admin/manage-courses' },
    { key: '3', icon: <TeamOutlined />, label: 'Manage Lecturers', onClick: () => window.location.href = '/admin/manage-lecturers' },
    { key: '4', icon: <LineChartOutlined />, label: 'Analytics', onClick: () => window.location.href = '/admin/analytics' },
    { key: '5', icon: <FormOutlined />, label: 'View Feedbacks', onClick: () => window.location.href = '/admin/feedback' },
    { key: '6', icon: <CheckCircleOutlined />, label: 'Attendance', onClick: () => document.getElementById('attendance-overview').scrollIntoView({ behavior: 'smooth' }) },
  ];

  const profileItems = [
    { key: '1', label: 'View Profile', icon: <UserOutlined />, onClick: () => window.location.href = '/admin/profile' },
    { key: '2', label: 'Settings', icon: <SettingOutlined />, onClick: () => window.location.href = '/admin/settings' },
    { type: 'divider' },
    {
      key: '3',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
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
              borderColor: themeColors.text,
              color: themeColors.text
            }
          }
        }),
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <Layout style={styles.layout} data-theme={isDarkMode ? 'dark' : 'light'}>
      <style>{styles.globalStyles}</style>
      <Header style={styles.header}>
        <Space>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: 18,
              width: 64,
              height: 64,
              color: isDarkMode ? '#fff' : undefined // White color in dark mode
            }}
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
            color: isDarkMode ? themeColors.text : "#1890ff",
            fontSize: '20px',
          }}
        >
          Admin Dashboard
        </AntTitle>
        <AntTitle
          level={3}
          style={{
            margin: 0,
            display: window.innerWidth >= 992 ? 'none' : 'inline',
            color: isDarkMode ? themeColors.text : "#1890ff",
            fontSize: '20px',
          }}
        >
          Admin Dashboard
        </AntTitle>
        <Space>
          <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          <Dropdown menu={{ items: profileItems }} trigger={['click']}>
            <Button type="text" icon={<UserOutlined style={{ fontSize: 24 }} />} />
          </Dropdown>
        </Space>
      </Header>

      <Layout>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={250} breakpoint="lg" collapsedWidth={80} style={styles.sider}>
          <Menu mode="inline" defaultSelectedKeys={[]} items={menuItems} />
        </Sider>

        <Content style={{ ...styles.content, marginLeft: collapsed ? 88 : 258 }}>
          <Spin spinning={studentsLoading || lecturersLoading || coursesLoading} tip="Loading dashboard data...">
            <Row gutter={[24, 24]} justify="center">
              <Col xs={24} sm={12} md={8} lg={6}>
                <motion.div initial="hidden" animate="visible" variants={cardVariants}>
                  <Card hoverable className="summary-card-1" style={styles.summaryCard1} onClick={() => window.location.href = '/admin/manage-students'}>
                    <Space direction="vertical">
                      <TeamOutlined style={{ fontSize: 28, color: 'white' }} />
                      <h3 style={{ fontWeight: 600, margin: '8px 0', color: 'white' }}>Total Students</h3>
                      <h1 style={{ fontSize: 32, margin: 0, color: 'white' }}>{studentsLoading ? 'Loading...' : (students.length || 'N/A')}</h1>
                    </Space>
                  </Card>
                </motion.div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <motion.div initial="hidden" animate="visible" variants={cardVariants}>
                  <Card hoverable className="summary-card-2" style={styles.summaryCard2} onClick={() => window.location.href = '/admin/manage-courses'}>
                    <Space direction="vertical">
                      <BookOutlined style={{ fontSize: 28, color: 'white' }} />
                      <h3 style={{ fontWeight: 600, margin: '8px 0', color: 'white' }}>Total Courses</h3>
                      <h1 style={{ fontSize: 32, margin: 0, color: 'white' }}>{coursesLoading ? 'Loading...' : (courses.length || 'N/A')}</h1>
                    </Space>
                  </Card>
                </motion.div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <motion.div initial="hidden" animate="visible" variants={cardVariants}>
                  <Card hoverable className="summary-card-3" style={styles.summaryCard3} onClick={() => window.location.href = '/admin/manage-lecturers'}>
                    <Space direction="vertical">
                      <TeamOutlined style={{ fontSize: 28, color: 'white' }} />
                      <h3 style={{ fontWeight: 600, margin: '8px 0', color: 'white' }}>Total Lecturers</h3>
                      <h1 style={{ fontSize: 32, margin: 0, color: 'white' }}>{lecturersLoading ? 'Loading...' : (lecturers.length || 'N/A')}</h1>
                    </Space>
                  </Card>
                </motion.div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Spin spinning={attendanceLoading} tip="Loading attendance data...">
                  <motion.div initial="hidden" animate="visible" variants={cardVariants}>
                    <Card hoverable className="summary-card-4" style={styles.summaryCard4} onClick={() => window.location.href = '/admin/analytics'}>
                      <Space direction="vertical">
                        <CheckCircleOutlined style={{ fontSize: 28, color: 'white' }} />
                        <h3 style={{ fontWeight: 600, margin: '8px 0', color: 'white' }}>Attendance Rate</h3>
                        <h1 style={{ fontSize: 32, margin: 0, color: 'white' }}>{attendanceLoading ? 'Loading...' : `${calculateOverallRate()}%`}</h1>
                      </Space>
                    </Card>
                  </motion.div>
                </Spin>
              </Col>
            </Row>

            <AntTitle
              level={2}
              style={{
                margin: '32px 0 16px',
                textAlign: 'center',
                color: isDarkMode ? themeColors.text : "#1890ff",
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              id="attendance-overview"
            >
              <CheckCircleOutlined style={{ marginRight: 8 }} />
              Attendance Overview
            </AntTitle>
            <Card style={styles.card}>
              <Spin spinning={attendanceLoading || coursesLoading} tip="Loading chart data...">
                {/* Add a responsive container with horizontal scrolling */}
                <div style={{
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  width: '100%',
                  paddingBottom: 10 // Add padding to accommodate scrollbar
                }}>
                  <div style={{
                    height: 500,
                    padding: 16,
                    minWidth: courses.length > 5 ? Math.max(600, courses.length * 100) : '100%' // Set minimum width based on number of courses
                  }}>
                    <Line data={overviewChartData} options={overviewChartOptions} />
                  </div>
                </div>
                <Button
                  type="primary"
                  style={{
                    ...styles.button,
                    color: '#fff !important',
                  }}
                  onClick={() => window.location.href = '/admin/analytics'}
                >
                  <span style={{ color: '#fff' }}>View Detailed Analytics</span>
                </Button>
              </Spin>
            </Card>

            <AntTitle
              level={2}
              style={{
                margin: '32px 0 16px',
                textAlign: 'center',
                color: isDarkMode ? themeColors.text : "#1890ff",
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LineChartOutlined style={{ marginRight: 8 }} />
              Quick Stats
            </AntTitle>
            <Card style={styles.card}>
              <Spin spinning={attendanceLoading || coursesLoading} tip="Loading chart data...">
                <div style={{ height: 400, padding: 16 }}>
                  <Pie data={quickStatsChartData} options={quickStatsChartOptions} />
                </div>
              </Spin>
            </Card>

            <BackToTop />
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );

  function weeklyTrendsAvg() {
    const allRates = Object.values(attendanceRates).flatMap(rate => rate.weeklyTrends?.map(t => t.rate || 0) || []);
    return allRates.length ? allRates.reduce((sum, rate) => sum + rate, 0) / allRates.length : 0;
  }
};

export default AdminPanel;