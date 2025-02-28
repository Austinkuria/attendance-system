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
  FormOutlined
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
  Typography
} from 'antd';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { getStudents, getLecturers, getCourses, getCourseAttendanceRate } from '../../services/api';
// import '../../styles.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;

// Utility function to add delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const AdminPanel = () => {
  const { token: { colorBgContainer } } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState({});
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [lecturersLoading, setLecturersLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Authentication check
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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    window.location.href = '/auth/login';
    window.location.reload(true);
  };

  // Fetch Students
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

  // Fetch Lecturers
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

  // Fetch Courses
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

  // Fetch Attendance Rates (depends on courses)
  useEffect(() => {
    const fetchAttendanceRates = async () => {
      if (!courses.length) return; // Wait for courses to load
      setAttendanceLoading(true);
      try {
        const rates = {};
        for (const course of courses) {
          try {
            const rateData = await getCourseAttendanceRate(course._id);
            rates[course._id] = rateData || { totalPresent: 0, totalPossible: 0 };
            console.log(`Attendance for ${course._id}:`, rateData);
            await delay(5000); // Respect rate limits
          } catch (courseError) {
            console.error(`Failed to fetch attendance for ${course._id}:`, courseError.message || 'Unknown error');
            rates[course._id] = { totalPresent: 0, totalPossible: 0 };
          }
        }
        setAttendanceRates(rates);
      } catch (error) {
        console.error('Failed to fetch attendance rates:', error.message || 'Unknown error');
        message.error('Failed to load attendance data');
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchAttendanceRates();
  }, [courses]); // Dependency on courses

  const calculateOverallRate = () => {
    const totalPresent = Object.values(attendanceRates).reduce((sum, rate) => sum + (rate.totalPresent || 0), 0);
    const totalPossible = Object.values(attendanceRates).reduce((sum, rate) => sum + (rate.totalPossible || 0), 0);
    return totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
  };

  // Line Chart Data (Attendance Rates per Course)
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

  // Pie Chart Data (Quick Stats - Sessions per Course)
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
      <Header style={{ padding: '0 16px', background: colorBgContainer, position: 'fixed', width: '100%', zIndex: 10 }}>
        <Row align="middle">
          <Col flex="auto">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <AntTitle level={3} style={{ display: 'inline', margin: 0 }}>Admin Dashboard</AntTitle>
          </Col>
          <Col>
            <Dropdown menu={{ items: profileItems }} trigger={['click']}>
              <Button type="text" icon={<UserOutlined style={{ fontSize: 24 }} />} style={{ marginRight: 24 }} />
            </Dropdown>
          </Col>
        </Row>
      </Header>

      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={250}
          breakpoint="lg"
          collapsedWidth={80}
          style={{ background: colorBgContainer, marginTop: 64, position: 'fixed', height: 'calc(100vh - 64px)', overflow: 'auto' }}
        >
          <div className="demo-logo-vertical" />
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            items={[
              { key: '1', icon: <TeamOutlined />, label: 'Students', onClick: () => window.location.href = '/admin/manage-students' },
              { key: '2', icon: <BookOutlined />, label: 'Courses', onClick: () => window.location.href = '/admin/manage-courses' },
              { key: '3', icon: <CheckCircleOutlined />, label: 'Attendance', onClick: () => window.location.href = '/admin/analytics' },
              { key: '4', icon: <UserOutlined />, label: 'Lecturers', onClick: () => window.location.href = '/admin/manage-lecturers' },
              { key: '5', icon: <LineChartOutlined />, label: 'Analytics', onClick: () => window.location.href = '/admin/analytics' },
              { key: '6', icon: <FormOutlined />, label: 'Feedback', onClick: () => window.location.href = '/admin/feedback' }
            ]}
          />
        </Sider>

        <Content style={{
          margin: collapsed ? '64px 16px 16px 96px' : '64px 16px 16px 266px',
          padding: 24,
          background: '#f0f2f5',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto'
        }}>
          <Row gutter={[16, 16]} justify="center">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card
                loading={studentsLoading}
                style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}
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
                loading={coursesLoading}
                style={{ background: 'linear-gradient(135deg, #52c41a, #389e0d)', color: 'white', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}
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
                loading={lecturersLoading}
                style={{ background: 'linear-gradient(135deg, #fa8c16, #d46b08)', color: 'white', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}
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
              <Card
                loading={attendanceLoading}
                style={{ background: 'linear-gradient(135deg, #f5222d, #cf1322)', color: 'white', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}
                onClick={() => window.location.href = '/admin/analytics'}
              >
                <Space direction="vertical">
                  <CheckCircleOutlined style={{ fontSize: 24 }} />
                  <h3>Attendance Rate</h3>
                  <h1>{attendanceLoading ? 'Loading...' : `${calculateOverallRate()}%`}</h1>
                </Space>
              </Card>
            </Col>
          </Row>

          <AntTitle level={2} style={{ marginTop: 24, textAlign: 'center' }}>Attendance Overview</AntTitle>
          <Card style={{ marginTop: 16 }}>
            <div style={{ height: '600px' }}>
              <Line data={overviewChartData} options={overviewChartOptions} />
            </div>
            <Button type="primary" style={{ marginTop: 16, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} onClick={() => window.location.href = '/admin/analytics'}>View Detailed Analytics</Button>
          </Card>

          <AntTitle level={2} style={{ marginTop: 24, textAlign: 'center' }}>Quick Stats</AntTitle>
          <Card style={{ marginTop: 16, background: '#fafafa', borderRadius: 10 }}>
            <div style={{ height: '400px' }}>
              <Pie data={quickStatsChartData} options={quickStatsChartOptions} />
            </div>
          </Card>
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