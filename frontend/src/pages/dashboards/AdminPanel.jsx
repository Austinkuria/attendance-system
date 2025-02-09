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
  FilterOutlined
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
  Select,
  Empty,
  Skeleton,
  Divider
} from 'antd';
import '../../styles.css';
import {
  getStudents,
  getLecturers,
  getCourses,
  getCourseAttendanceRate,
  getUnitsByCourse
} from '../../services/api';
import AttendanceChart from '../../components/AttendanceChart';

const { Option } = Select;
const { Header, Sider, Content } = Layout;

const AdminPanel = () => {
  const { token: { colorBgContainer }, theme: currentTheme } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Filter states – using hard-coded academic years and semesters
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);

  // Hard-coded options for academic years and semesters
  const hardCodedYears = [1, 2, 3, 4];
  const hardCodedSemesters = [1, 2, 3];

  // When no course is selected, extract unique unit names from all courses (filtering out null/undefined)
  const uniqueUnits = [...new Set(
    courses
      .map(c => c.unit)
      .filter(unit => unit != null)
  )].sort();

  // New state for storing the real units for a selected course
  const [courseUnits, setCourseUnits] = useState([]);

  // Fetch real units for the selected course
  useEffect(() => {
    if (selectedCourse) {
      getUnitsByCourse(selectedCourse)
        .then(units => {
          // Expecting each unit to be an object with _id and name
          setCourseUnits(units.filter(u => u && u._id && u.name));
        })
        .catch(() => message.error('Failed to fetch course units'));
    } else {
      setCourseUnits([]);
    }
  }, [selectedCourse]);

  // Filtered courses based on selections
  const filteredCourses = courses.filter(course => {
    return (
      (!selectedCourse || course._id === selectedCourse) &&
      (!selectedYear || course.year === selectedYear) &&
      (!selectedUnit || course.unit === (selectedCourse ? selectedUnit : selectedUnit)) &&
      (!selectedSemester || course.semester === selectedSemester)
    );
  });

  // Responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setCollapsed(true);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth/login';
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);

    const handlePopState = () => {
      if (!localStorage.getItem('token')) {
        window.location.href = '/auth/login';
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    window.location.href = '/auth/login';
    window.location.reload(true);
  };

  // Data fetching
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

      setAttendanceRates(attendanceData.reduce((acc, cur) => ({
        ...acc,
        [cur.courseId]: cur.data
      }), {}));
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

  // Dropdown menu items for profile/settings/logout
  const profileItems = [
    {
      key: '1',
      label: 'View Profile',
      icon: <UserOutlined />,
      onClick: () => window.location.href = '/admin/profile'
    },
    {
      key: '2',
      label: 'Settings',
      icon: <SettingOutlined />,
      onClick: () => window.location.href = '/admin/settings'
    },
    {
      type: 'divider',
    },
    {
      key: '3',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => Modal.confirm({
        title: 'Confirm Logout',
        content: 'Are you sure you want to logout?',
        onOk: logout,
        centered: true,
      })
    }
  ];

  return (
    <Layout hasSider style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="md"
        width={250}
        theme={currentTheme === 'dark' ? 'dark' : 'light'}
        trigger={null}
        collapsedWidth={isMobile ? 0 : 80}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme={currentTheme === 'dark' ? 'dark' : 'light'}
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: '1',
              icon: <TeamOutlined />,
              label: 'Students',
              onClick: () => window.location.href = '/admin/manage-students'
            },
            {
              key: '2',
              icon: <BookOutlined />,
              label: 'Courses',
              onClick: () => window.location.href = '/admin/manage-courses'
            },
            {
              key: '3',
              icon: <CheckCircleOutlined />,
              label: 'Attendance',
              onClick: () => window.location.href = '/admin/attendance-reports'
            },
            {
              key: '4',
              icon: <UserOutlined />,
              label: 'Lecturers',
              onClick: () => window.location.href = '/admin/manage-lecturers'
            }
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{
          padding: 0,
          background: colorBgContainer,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Dropdown menu={{ items: profileItems }} trigger={['click']}>
            <Button
              type="text"
              icon={<UserOutlined style={{ fontSize: 24 }} />}
              style={{ marginRight: 24 }}
            />
          </Dropdown>
        </Header>

        <Content style={{ margin: '24px 16px', overflow: 'initial' }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Space direction="vertical">
                  <TeamOutlined style={{ fontSize: 24 }} />
                  <h3>Total Students</h3>
                  <h1>{loading ? <Skeleton.Input active /> : students.length}</h1>
                  <Button
                    type="primary"
                    block
                    onClick={() => window.location.href = '/admin/manage-students'}
                  >
                    Manage
                  </Button>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Space direction="vertical">
                  <BookOutlined style={{ fontSize: 24 }} />
                  <h3>Total Courses</h3>
                  <h1>{loading ? <Skeleton.Input active /> : courses.length}</h1>
                  <Button
                    type="primary"
                    block
                    onClick={() => window.location.href = '/admin/manage-courses'}
                  >
                    Manage
                  </Button>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Space direction="vertical">
                  <UserOutlined style={{ fontSize: 24 }} />
                  <h3>Total Lecturers</h3>
                  <h1>{loading ? <Skeleton.Input active /> : lecturers.length}</h1>
                  <Button
                    type="primary"
                    block
                    onClick={() => window.location.href = '/admin/manage-lecturers'}
                  >
                    Manage
                  </Button>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Space direction="vertical">
                  <CheckCircleOutlined style={{ fontSize: 24 }} />
                  <h3>Attendance Rate</h3>
                  <h1>85%</h1>
                  <Button
                    type="primary"
                    block
                    onClick={() => window.location.href = '/admin/attendance-reports'}
                  >
                    View Reports
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            <Col xs={24} md={12}>
              <Card
                title={
                  <Space>
                    <FilterOutlined />
                    <span>Filter Attendance Data</span>
                  </Space>
                }
                style={{ marginBottom: 24 }}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Select
                      placeholder="Select Course"
                      allowClear
                      onChange={value => {
                        setSelectedCourse(value);
                        // Also clear the unit filter when a course is selected
                        setSelectedUnit(null);
                      }}
                      style={{ width: '100%' }}
                    >
                      {courses.map(course => (
                        <Option key={course._id} value={course._id}>
                          {course.name}
                        </Option>
                      ))}
                    </Select>
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <Select
                      placeholder="Select Academic Year"
                      allowClear
                      onChange={setSelectedYear}
                      style={{ width: '100%' }}
                    >
                      {hardCodedYears.map(year => (
                        <Option key={year} value={year}>Year {year}</Option>
                      ))}
                    </Select>
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <Select
                      placeholder="Select Unit"
                      allowClear
                      onChange={setSelectedUnit}
                      style={{ width: '100%' }}
                      value={selectedUnit}
                    >
                      {(selectedCourse ? courseUnits : uniqueUnits).map(unit => {
                        // If the unit is an object (real unit), use its _id and name;
                        // Otherwise, assume it's a string
                        if (typeof unit === 'object' && unit !== null) {
                          return (
                            <Option key={unit._id} value={unit._id}>
                              {unit.name}
                            </Option>
                          );
                        }
                        return (
                          <Option key={unit} value={unit}>
                            {`Unit ${unit}`}
                          </Option>
                        );
                      })}
                    </Select>
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <Select
                      placeholder="Select Semester"
                      allowClear
                      onChange={setSelectedSemester}
                      style={{ width: '100%' }}
                    >
                      {hardCodedSemesters.map(semester => (
                        <Option key={semester} value={semester}>Semester {semester}</Option>
                      ))}
                    </Select>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Divider orientation="left" style={{ fontSize: 18 }}>Attendance Charts</Divider>

          {filteredCourses.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No courses found matching the filters"
            />
          ) : (
            <Row gutter={[24, 24]}>
              {filteredCourses.map(course => (
                <Col key={course._id} xs={24} md={12} xl={8} xxl={6}>
                  <Card
                    title={`${course.name} (Year ${course.year}, Sem ${course.semester})`}
                    loading={loading}
                    hoverable
                  >
                    <div style={{ height: 250 }}>
                      {!loading && (
                        <AttendanceChart
                          data={attendanceRates[course._id]}
                        />
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminPanel;
