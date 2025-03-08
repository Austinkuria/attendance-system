import { useState, useEffect, createContext } from 'react';
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
  ArrowUpOutlined
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
  Switch
} from 'antd';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { motion } from 'framer-motion';
import { getStudents, getLecturers, getCourses, getCourseAttendanceRate } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;

// Theme Context
const ThemeContext = createContext();

const AdminPanel = () => {
  const [collapsed, setCollapsed] = useState(window.innerWidth < 992);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState({});
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [lecturersLoading, setLecturersLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    const handleResize = () => {
      setCollapsed(window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        console.log('Students fetched:', studentsRes);
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
        console.log('Lecturers fetched:', lecturersRes);
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
        console.log('Courses fetched:', coursesRes);
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
        console.log('Loaded attendance rates from cache:', JSON.parse(cachedRates));
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
        console.log('Attendance rates fetched:', rates);
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

  const modernColors = {
    light: {
      primary: '#6C5CE7',
      secondary: '#00CEC9',
      accent: '#FF7675',
      background: '#F7F9FC',
      text: '#2D3436',
      cardGradient1: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
      cardGradient2: 'linear-gradient(135deg, #00CEC9, #81ECEC)',
      cardGradient3: 'linear-gradient(135deg, #FF7675, #FAB1A0)',
      cardGradient4: 'linear-gradient(135deg, #0984E3, #74B9FF)',
    },
    dark: {
      primary: '#A29BFE',
      secondary: '#81ECEC',
      accent: '#FAB1A0',
      background: '#2D3436',
      text: '#F7F9FC',
      cardGradient1: 'linear-gradient(135deg, #5A4FCF, #8E86E5)',
      cardGradient2: 'linear-gradient(135deg, #00B7B3, #6CDADA)',
      cardGradient3: 'linear-gradient(135deg, #E65F5C, #E09B86)',
      cardGradient4: 'linear-gradient(135deg, #0773C4, #5DA8FF)',
    }
  };

  const themeColors = isDarkMode ? modernColors.dark : modernColors.light;

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
    { key: '1', icon: <TeamOutlined />, label: 'Students', onClick: () => window.location.href = '/admin/manage-students' },
    { key: '2', icon: <BookOutlined />, label: 'Courses', onClick: () => window.location.href = '/admin/manage-courses' },
    { key: '3', icon: <CheckCircleOutlined />, label: 'Attendance', onClick: () => document.getElementById('attendance-overview').scrollIntoView({ behavior: 'smooth' }) },
    { key: '4', icon: <UserOutlined />, label: 'Lecturers', onClick: () => window.location.href = '/admin/manage-lecturers' },
    { key: '5', icon: <LineChartOutlined />, label: 'Analytics', onClick: () => window.location.href = '/admin/analytics' },
    { key: '6', icon: <FormOutlined />, label: 'Feedback', onClick: () => window.location.href = '/admin/feedback' }
  ];

  const profileItems = [
    { key: '1', label: 'View Profile', icon: <UserOutlined />, onClick: () => window.location.href = '/admin/profile' },
    { key: '2', label: 'Settings', icon: <SettingOutlined />, onClick: () => window.location.href = '/admin/settings' },
    { type: 'divider' },
    {
      key: '3', label: 'Logout', icon: <LogoutOutlined />, danger: true, onClick: () => Modal.confirm({
        title: 'Confirm Logout',
        content: 'Are you sure you want to logout?',
        onOk: logout,
        centered: true,
        okButtonProps: { style: { background: themeColors.accent, border: 'none' } },
      })
    }
  ];

  // Framer Motion animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, themeColors }}>
      <Layout style={{ minHeight: '100vh', background: themeColors.background }}>
        <Header
          style={{
            padding: '0 16px',
            background: isDarkMode ? 'rgba(45, 52, 54, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            position: 'fixed',
            width: '100%',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${themeColors.primary}20`,
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '18px',
                width: 64,
                height: 64,
                color: themeColors.primary,
                transition: 'all 0.3s',
              }}
              ghost
            />
          </Space>
          <AntTitle
            level={3}
            style={{
              margin: 0,
              flex: 1,
              textAlign: 'center',
              color: themeColors.primary,
              fontWeight: 600,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: window.innerWidth < 992 ? 'none' : 'block',
            }}
          >
            Admin Dashboard
          </AntTitle>
          <AntTitle
            level={3}
            style={{
              margin: 0,
              color: themeColors.primary,
              fontWeight: 600,
              display: window.innerWidth >= 992 ? 'none' : 'inline',
            }}
          >
            Admin Dashboard
          </AntTitle>
          <Space>
            <Switch
              checked={isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
              checkedChildren="Dark"
              unCheckedChildren="Light"
              style={{ marginRight: 16 }}
            />
            <Dropdown menu={{ items: profileItems }} trigger={['click']}>
              <Button
                type="text"
                icon={<UserOutlined style={{ fontSize: 24, color: themeColors.primary }} />}
                style={{ marginRight: 24, transition: 'all 0.3s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            </Dropdown>
          </Space>
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
              background: isDarkMode ? 'rgba(45, 52, 54, 0.9)' : 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              marginTop: 64,
              position: 'fixed',
              height: 'calc(100vh - 64px)',
              overflow: 'auto',
              zIndex: 11,
              boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              items={menuItems}
              style={{ background: 'transparent', border: 'none', color: themeColors.text }}
              theme={isDarkMode ? 'dark' : 'light'}
            />
          </Sider>

          <Content
            style={{
              margin: collapsed ? '64px 16px 16px 80px' : '64px 16px 16px 250px',
              padding: 24,
              background: themeColors.background,
              minHeight: 'calc(100vh - 64px)',
              overflow: 'auto',
              transition: 'margin-left 0.3s ease-in-out',
            }}
          >
            <Spin spinning={studentsLoading || lecturersLoading || coursesLoading} tip="Loading dashboard data...">
              <Row gutter={[24, 24]} justify="center">
                <Col xs={24} sm={12} md={8} lg={6}>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                  >
                    <Card
                      hoverable
                      style={{
                        background: themeColors.cardGradient1,
                        color: 'white',
                        borderRadius: 16,
                        textAlign: 'center',
                        cursor: 'pointer',
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                      }}
                      onClick={() => window.location.href = '/admin/manage-students'}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Space direction="vertical">
                        <TeamOutlined style={{ fontSize: 28 }} />
                        <h3 style={{ fontWeight: 600, margin: '8px 0' }}>Total Students</h3>
                        <h1 style={{ fontSize: 32, margin: 0 }}>{studentsLoading ? 'Loading...' : (students.length || 'N/A')}</h1>
                      </Space>
                    </Card>
                  </motion.div>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                  >
                    <Card
                      hoverable
                      style={{
                        background: themeColors.cardGradient2,
                        color: 'white',
                        borderRadius: 16,
                        textAlign: 'center',
                        cursor: 'pointer',
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                      }}
                      onClick={() => window.location.href = '/admin/manage-courses'}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Space direction="vertical">
                        <BookOutlined style={{ fontSize: 28 }} />
                        <h3 style={{ fontWeight: 600, margin: '8px 0' }}>Total Courses</h3>
                        <h1 style={{ fontSize: 32, margin: 0 }}>{coursesLoading ? 'Loading...' : (courses.length || 'N/A')}</h1>
                      </Space>
                    </Card>
                  </motion.div>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                  >
                    <Card
                      hoverable
                      style={{
                        background: themeColors.cardGradient3,
                        color: 'white',
                        borderRadius: 16,
                        textAlign: 'center',
                        cursor: 'pointer',
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                      }}
                      onClick={() => window.location.href = '/admin/manage-lecturers'}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Space direction="vertical">
                        <UserOutlined style={{ fontSize: 28 }} />
                        <h3 style={{ fontWeight: 600, margin: '8px 0' }}>Total Lecturers</h3>
                        <h1 style={{ fontSize: 32, margin: 0 }}>{lecturersLoading ? 'Loading...' : (lecturers.length || 'N/A')}</h1>
                      </Space>
                    </Card>
                  </motion.div>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Spin spinning={attendanceLoading} tip="Loading attendance data...">
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                    >
                      <Card
                        hoverable
                        style={{
                          background: themeColors.cardGradient4,
                          color: 'white',
                          borderRadius: 16,
                          textAlign: 'center',
                          cursor: 'pointer',
                          height: '200px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          transition: 'transform 0.3s, box-shadow 0.3s',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                        }}
                        onClick={() => window.location.href = '/admin/analytics'}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <Space direction="vertical">
                          <CheckCircleOutlined style={{ fontSize: 28 }} />
                          <h3 style={{ fontWeight: 600, margin: '8px 0' }}>Attendance Rate</h3>
                          <h1 style={{ fontSize: 32, margin: 0 }}>{attendanceLoading ? 'Loading...' : `${calculateOverallRate()}%`}</h1>
                        </Space>
                      </Card>
                    </motion.div>
                  </Spin>
                </Col>
              </Row>
            </Spin>

            <AntTitle
              level={2}
              style={{
                marginTop: 32,
                textAlign: 'center',
                color: themeColors.primary,
                fontWeight: 700,
              }}
              id="attendance-overview"
            >
              Attendance Overview
            </AntTitle>
            <Card
              style={{
                marginTop: 16,
                borderRadius: 16,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                background: isDarkMode ? '#3A4042' : '#fff',
              }}
            >
              <Spin spinning={attendanceLoading || coursesLoading} tip="Loading chart data...">
                <div style={{ height: '600px', padding: 16 }}>
                  <Line data={overviewChartData} options={overviewChartOptions} />
                </div>
                <Button
                  type="primary"
                  style={{
                    marginTop: 16,
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    background: themeColors.primary,
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 24px',
                    transition: 'all 0.3s',
                  }}
                  onClick={() => window.location.href = '/admin/analytics'}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#8E86E5' : '#5A4FCF'}
                  onMouseLeave={(e) => e.currentTarget.style.background = themeColors.primary}
                >
                  View Detailed Analytics
                </Button>
              </Spin>
            </Card>

            <AntTitle
              level={2}
              style={{
                marginTop: 32,
                textAlign: 'center',
                color: themeColors.primary,
                fontWeight: 700,
              }}
            >
              Quick Stats
            </AntTitle>
            <Card
              style={{
                marginTop: 16,
                borderRadius: 16,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                background: isDarkMode ? '#3A4042' : '#fff',
              }}
            >
              <Spin spinning={attendanceLoading || coursesLoading} tip="Loading chart data...">
                <div style={{ height: '400px', padding: 16 }}>
                  <Pie data={quickStatsChartData} options={quickStatsChartOptions} />
                </div>
              </Spin>
            </Card>

            {showBackToTop && (
              <Button
                shape="circle"
                icon={<ArrowUpOutlined />}
                onClick={scrollToTop}
                style={{
                  position: 'fixed',
                  bottom: 32,
                  right: 32,
                  zIndex: 1000,
                  background: themeColors.primary,
                  border: 'none',
                  width: 50,
                  height: 50,
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#8E86E5' : '#5A4FCF'}
                onMouseLeave={(e) => e.currentTarget.style.background = themeColors.primary}
              />
            )}
          </Content>
        </Layout>
      </Layout>
    </ThemeContext.Provider>
  );

  function weeklyTrendsAvg() {
    const allRates = Object.values(attendanceRates).flatMap(rate => rate.weeklyTrends?.map(t => t.rate || 0) || []);
    return allRates.length ? allRates.reduce((sum, rate) => sum + rate, 0) / allRates.length : 0;
  }
};

export default AdminPanel;