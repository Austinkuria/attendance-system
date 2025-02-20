// src/pages/dashboards/AdminPanel.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  LogoutOutlined,
  TeamOutlined,
  LineChartOutlined
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
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { getStudents, getLecturers, getCourses, getCourseAttendanceRate } from '../../services/api';
import '../../styles.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;

const AdminPanel = () => {
  const { token: { colorBgContainer } } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState({});
  const [loading, setLoading] = useState(true);

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

  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, lecturersRes, coursesRes] = await Promise.all([
        getStudents(),
        getLecturers(),
        getCourses(),
      ]);
      setStudents(studentsRes);
      setLecturers(lecturersRes);
      setCourses(coursesRes);
      setLoading(false);
    } catch {
      message.error('Error loading data');
      setLoading(false);
    }
  }, []);

  const fetchCourseAttendanceRates = useCallback(async () => {
    try {
      const attendanceData = await Promise.all(
        courses.map(async (course) => ({
          courseId: course._id,
          data: await getCourseAttendanceRate(course._id)
        }))
      );
      const rates = attendanceData.reduce((acc, cur) => ({
        ...acc,
        [cur.courseId]: cur.data
      }), {});
      setAttendanceRates(rates);
    } catch {
      message.error('Error loading attendance data');
    }
  }, [courses]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (courses.length > 0) fetchCourseAttendanceRates();
  }, [courses, fetchCourseAttendanceRates]);

  const calculateOverallRate = () => {
    const totalPresent = Object.values(attendanceRates).reduce((sum, rate) => sum + (rate.totalPresent || 0), 0);
    const totalPossible = Object.values(attendanceRates).reduce((sum, rate) => sum + (rate.totalPossible || 0), 0);
    return totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
  };

  const overviewChartData = {
    labels: Object.values(attendanceRates).length ? Object.values(attendanceRates).map((_, i) => `Course ${i + 1}`) : ['No Data'],
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: Object.values(attendanceRates).length
          ? Object.values(attendanceRates).map(rate => rate.totalPossible > 0 ? Math.round((rate.totalPresent / rate.totalPossible) * 100) : 0)
          : [0],
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        fill: false,
        tension: 0.3,
      },
    ],
  };

  const overviewChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Course Attendance Overview' },
    },
    scales: {
      y: { min: 0, max: 100, title: { display: true, text: 'Rate (%)' } },
      x: { title: { display: true, text: 'Courses' } },
    },
  };

  const profileItems = [
    { key: '1', label: 'View Profile', icon: <UserOutlined />, onClick: () => window.location.href = '/admin/profile' },
    { key: '2', label: 'Settings', icon: <SettingOutlined />, onClick: () => window.location.href = '/admin/settings' },
    { type: 'divider' },
    { key: '3', label: 'Logout', icon: <LogoutOutlined />, danger: true, onClick: () => Modal.confirm({
      title: 'Confirm Logout',
      content: 'Are you sure you want to logout?',
      onOk: logout,
      centered: true,
    }) }
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
          style={{ background: colorBgContainer, marginTop: 64, position: 'fixed', height: 'calc(100vh - 64px)' }}
        >
          <div className="demo-logo-vertical" />
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            items={[
              { key: '1', icon: <TeamOutlined />, label: 'Students', onClick: () => window.location.href = '/admin/manage-students' },
              { key: '2', icon: <BookOutlined />, label: 'Courses', onClick: () => window.location.href = '/admin/manage-courses' },
              { key: '3', icon: <CheckCircleOutlined />, label: 'Attendance', onClick: () => window.location.href = '/admin/attendance-reports' },
              { key: '4', icon: <UserOutlined />, label: 'Lecturers', onClick: () => window.location.href = '/admin/manage-lecturers' },
              { key: '5', icon: <LineChartOutlined />, label: 'Analytics', onClick: () => window.location.href = '/admin/analytics' }
            ]}
          />
        </Sider>

        <Content style={{ margin: '64px 16px 16px 266px', padding: 24, background: '#f0f2f5' }}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card
                loading={loading}
                style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}
                onClick={() => window.location.href = '/admin/manage-students'}
              >
                <Space direction="vertical">
                  <TeamOutlined style={{ fontSize: 24 }} />
                  <h3>Total Students</h3>
                  <h1>{students.length}</h1>
                </Space>
              </Card>
            </Col>
            <Col span={6}>
              <Card
                loading={loading}
                style={{ background: 'linear-gradient(135deg, #52c41a, #389e0d)', color: 'white', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}
                onClick={() => window.location.href = '/admin/manage-courses'}
              >
                <Space direction="vertical">
                  <BookOutlined style={{ fontSize: 24 }} />
                  <h3>Total Courses</h3>
                  <h1>{courses.length}</h1>
                </Space>
              </Card>
            </Col>
            <Col span={6}>
              <Card
                loading={loading}
                style={{ background: 'linear-gradient(135deg, #fa8c16, #d46b08)', color: 'white', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}
                onClick={() => window.location.href = '/admin/manage-lecturers'}
              >
                <Space direction="vertical">
                  <UserOutlined style={{ fontSize: 24 }} />
                  <h3>Total Lecturers</h3>
                  <h1>{lecturers.length}</h1>
                </Space>
              </Card>
            </Col>
            <Col span={6}>
              <Card
                loading={loading || Object.keys(attendanceRates).length === 0}
                style={{ background: 'linear-gradient(135deg, #f5222d, #cf1322)', color: 'white', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}
                onClick={() => window.location.href = '/admin/analytics'}
              >
                <Space direction="vertical">
                  <CheckCircleOutlined style={{ fontSize: 24 }} />
                  <h3>Attendance Rate</h3>
                  <h1>{calculateOverallRate()}%</h1>
                </Space>
              </Card>
            </Col>
          </Row>

          <AntTitle level={2} style={{ marginTop: 24 }}>Attendance Overview</AntTitle>
          <Card style={{ marginTop: 16 }}>
            <Line data={overviewChartData} options={overviewChartOptions} height={100} />
            <Button type="primary" style={{ marginTop: 16 }} onClick={() => window.location.href = '/admin/analytics'}>View Detailed Analytics</Button>
          </Card>

          {/* Creative Addition: Quick Stats or Timeline */}
          <Card style={{ marginTop: 16, background: '#fafafa', borderRadius: 10 }}>
            <AntTitle level={4}>Quick Stats</AntTitle>
            <Row gutter={[16, 16]}>
              <Col span={12}><p>Total Sessions: {Object.values(attendanceRates).reduce((sum, rate) => sum + rate.weeklyTrends.reduce((acc, t) => acc + t.sessionCount, 0), 0)}</p></Col>
              <Col span={12}><p>Average Weekly Rate: {Object.values(attendanceRates).length ? Math.round(weeklyTrendsAvg()) : 0}%</p></Col>
            </Row>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );

  function weeklyTrendsAvg() {
    const allRates = Object.values(attendanceRates).flatMap(rate => rate.weeklyTrends.map(t => t.rate));
    return allRates.length ? allRates.reduce((sum, rate) => sum + rate, 0) / allRates.length : 0;
  }
};

export default AdminPanel;