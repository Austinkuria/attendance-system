import { useState, useEffect } from 'react';
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
  theme,
  message,
  Typography,
  Spin
} from 'antd';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { getStudents, getLecturers, getCourses, getCourseAttendanceRate } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;

const AdminPanel = () => {
  const { token: { colorBgContainer } } = theme.useToken();
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
      if (window.scrollY > 200) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
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
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
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
      legend: { position: 'top' },
      title: { display: true, text: 'Course Attendance Overview' },
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
      y: { min: 0, max: 100, title: { display: true, text: 'Rate (%)' }, grid: { display: true } },
      x: { title: { display: true, text: 'Courses' }, ticks: { maxRotation: 45, minRotation: 45 }, grid: { display: false } },
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
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ].slice(0, courses.length || 1),
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ].slice(0, courses.length || 1),
        borderWidth: 1,
      },
    ],
  };

  const quickStatsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Session Distribution by Course' },
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
      })
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
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
            display: window.innerWidth < 992 ? 'none' : 'block'
          }}
        >
          Admin Dashboard
        </AntTitle>
        <AntTitle
          level={3}
          style={{
            margin: 0,
            display: window.innerWidth >= 992 ? 'none' : 'inline',
          }}
        >
          Admin Dashboard
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
              { key: '1', icon: <TeamOutlined />, label: 'Students', onClick: () => window.location.href = '/admin/manage-students' },
              { key: '2', icon: <BookOutlined />, label: 'Courses', onClick: () => window.location.href = '/admin/manage-courses' },
              { key: '3', icon: <CheckCircleOutlined />, label: 'Attendance', onClick: () => document.getElementById('attendance-overview').scrollIntoView({ behavior: 'smooth' }) },
              { key: '4', icon: <UserOutlined />, label: 'Lecturers', onClick: () => window.location.href = '/admin/manage-lecturers' },
              { key: '5', icon: <LineChartOutlined />, label: 'Analytics', onClick: () => window.location.href = '/admin/analytics' },
              { key: '6', icon: <FormOutlined />, label: 'Feedback', onClick: () => window.location.href = '/admin/feedback' }
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
          <Spin spinning={studentsLoading || lecturersLoading || coursesLoading} tip="Loading dashboard data...">
            <Row gutter={[16, 16]} justify="center">
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  style={{ 
                    background: 'linear-gradient(135deg, #1890ff, #096dd9)', 
                    color: 'white', 
                    borderRadius: 10, 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    height: '200px', // Fixed height for all cards
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                  onClick={() => window.location.href = '/admin/manage-students'}
                >
                  <Space direction="vertical">
                    <TeamOutlined style={{ fontSize: 24 }} />
                    <h3>Total Students</h3>
                    <h1>{studentsLoading ? 'Loading...' : (students.length || 'N/A')}</h1>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  style={{ 
                    background: 'linear-gradient(135deg, #52c41a, #389e0d)', 
                    color: 'white', 
                    borderRadius: 10, 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    height: '200px', // Fixed height for all cards
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                  onClick={() => window.location.href = '/admin/manage-courses'}
                >
                  <Space direction="vertical">
                    <BookOutlined style={{ fontSize: 24 }} />
                    <h3>Total Courses</h3>
                    <h1>{coursesLoading ? 'Loading...' : (courses.length || 'N/A')}</h1>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  style={{ 
                    background: 'linear-gradient(135deg, #fa8c16, #d46b08)', 
                    color: 'white', 
                    borderRadius: 10, 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    height: '200px', // Fixed height for all cards
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                  onClick={() => window.location.href = '/admin/manage-lecturers'}
                >
                  <Space direction="vertical">
                    <UserOutlined style={{ fontSize: 24 }} />
                    <h3>Total Lecturers</h3>
                    <h1>{lecturersLoading ? 'Loading...' : (lecturers.length || 'N/A')}</h1>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Spin spinning={attendanceLoading} tip="Loading attendance data...">
                  <Card
                    style={{ 
                      background: 'linear-gradient(135deg, #f5222d, #cf1322)', 
                      color: 'white', 
                      borderRadius: 10, 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      height: '200px', // Fixed height for all cards
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                    onClick={() => window.location.href = '/admin/analytics'}
                  >
                    <Space direction="vertical">
                      <CheckCircleOutlined style={{ fontSize: 24 }} />
                      <h3>Attendance Rate</h3>
                      <h1>{attendanceLoading ? 'Loading...' : `${calculateOverallRate()}%`}</h1>
                    </Space>
                  </Card>
                </Spin>
              </Col>
            </Row>
          </Spin>

          <AntTitle level={2} style={{ marginTop: 24, textAlign: 'center' }} id="attendance-overview">Attendance Overview</AntTitle>
          <Card style={{ marginTop: 16 }}>
            <Spin spinning={attendanceLoading || coursesLoading} tip="Loading chart data...">
              <div style={{ height: '600px' }}>
                <Line data={overviewChartData} options={overviewChartOptions} />
              </div>
              <Button type="primary" style={{ marginTop: 16, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} onClick={() => window.location.href = '/admin/analytics'}>View Detailed Analytics</Button>
            </Spin>
          </Card>

          <AntTitle level={2} style={{ marginTop: 24, textAlign: 'center' }}>Quick Stats</AntTitle>
          <Card style={{ marginTop: 16, background: '#fafafa', borderRadius: 10 }}>
            <Spin spinning={attendanceLoading || coursesLoading} tip="Loading chart data...">
              <div style={{ height: '400px' }}>
                <Pie data={quickStatsChartData} options={quickStatsChartOptions} />
              </div>
            </Spin>
          </Card>

          {showBackToTop && (
            <Button
              type="primary"
              shape="circle"
              icon={<ArrowUpOutlined />}
              onClick={scrollToTop}
              style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1000,
              }}
            />
          )}
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