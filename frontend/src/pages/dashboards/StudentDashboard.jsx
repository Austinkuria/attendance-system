import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStudentAttendance,
  getStudentUnits,
  getUserProfile,
  submitFeedback,
  getSessionQuiz,
  submitQuizAnswers,
  getActiveSessionForUnit, // New import for student-specific session check
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
  Radio,
  DatePicker,
  Space,
  theme,
  Typography,
  Spin,
  Select,
  List,
} from 'antd';
import {
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  LogoutOutlined,
  QrcodeOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import './StudentDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;
const { Option } = Select;

const StudentDashboard = () => {
  const { token: { colorBgContainer } } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
  const [units, setUnits] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ attendanceRecords: [], weeklyEvents: [], dailyEvents: [] });
  const [attendanceRates, setAttendanceRates] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [studentId, setStudentId] = useState(null); // eslint-disable-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [feedbackData, setFeedbackData] = useState({ rating: 3, text: '' });
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/auth/login');
  }, [navigate]);

  const fetchAllData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const [profileRes, unitsRes] = await Promise.all([
        getUserProfile(token),
        getStudentUnits(token),
      ]);

      setStudentId(profileRes._id); // Assigned but not used directly; kept for consistency
      const unitsData = Array.isArray(unitsRes) ? unitsRes : unitsRes.enrolledUnits || [];
      setUnits(unitsData);

      if (profileRes._id) {
        const attendanceRes = await getStudentAttendance(profileRes._id);
        setAttendanceData(attendanceRes);
      }
    } catch (error) {
      message.error(`Failed to load data: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const calculateAttendanceRate = useCallback(
    (unitId) => {
      const unitData = attendanceData.attendanceRecords.filter(
        (record) => record.session.unit._id.toString() === unitId.toString()
      );
      if (!unitData || unitData.length === 0) return 0;
      const attendedSessions = unitData.filter((att) => att.status === 'Present').length;
      const totalSessions = unitData.length;
      return totalSessions === 0 ? 0 : ((attendedSessions / totalSessions) * 100).toFixed(2);
    },
    [attendanceData]
  );

  useEffect(() => {
    const rates = units.map((unit) => ({
      label: unit.name || 'Unnamed Unit',
      value: calculateAttendanceRate(unit._id),
    }));
    setAttendanceRates(rates);
  }, [units, attendanceData, calculateAttendanceRate]);

  const exportAttendanceData = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      attendanceRates.map((rate) => `${rate.label},${rate.value}%`).join('\n');
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
    message.success('Logged out successfully.');
    navigate('/auth/login');
  };

  const chartData = {
    labels: attendanceRates.map((rate) => rate.label),
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: attendanceRates.map((rate) => rate.value),
        backgroundColor: attendanceRates.map((rate) =>
          rate.value >= 75 ? '#52c41a' : rate.value >= 50 ? '#faad14' : 'rgba(255, 99, 132, 0.8)'
        ),
        borderColor: attendanceRates.map((rate) =>
          rate.value >= 75 ? '#389e0d' : rate.value >= 50 ? '#d48806' : 'rgba(255, 99, 132, 1)'
        ),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Attendance Overview' },
      tooltip: { callbacks: { label: (context) => `${context.raw}%` } },
    },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Rate (%)' } },
      x: { ticks: { maxRotation: 45, minRotation: 0 } },
    },
  };

  const filteredEvents = () => {
    if (!selectedDate) {
      return attendanceData.attendanceRecords.map(record => ({
        title: `${record.session.unit?.name || 'Unknown'} - ${record.status || 'Unknown'}`,
        date: record.session.startTime ? moment(record.session.startTime) : null,
        status: record.status || 'Unknown'
      }));
    }

    if (viewMode === 'weekly') {
      const selectedWeek = attendanceData.weeklyEvents.find(week => 
        week.week === selectedDate.format('MMM D - MMM D, YYYY')
      );
      return selectedWeek ? selectedWeek.events.map(event => ({
        title: `${event.unitName} - ${event.status}`,
        date: moment(event.startTime),
        status: event.status
      })) : [];
    } else {
      const selectedDay = attendanceData.dailyEvents.find(day => 
        day.date === selectedDate.format('YYYY-MM-DD')
      );
      return selectedDay ? selectedDay.events.map(event => ({
        title: `${event.unitName} - ${event.status}`,
        date: moment(event.startTime),
        status: event.status
      })) : [];
    }
  };

  const renderCalendarEvents = () => (
    <Card style={{ marginTop: '24px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <AntTitle level={3} style={{ textAlign: 'center' }}>
          <CalendarOutlined /> Attendance Events
        </AntTitle>
        <Space>
          <Select
            value={viewMode}
            onChange={(value) => {
              setViewMode(value);
              setSelectedDate(null);
            }}
            style={{ width: 120 }}
          >
            <Option value="weekly">Weekly</Option>
            <Option value="daily">Daily</Option>
          </Select>
          <DatePicker
            picker={viewMode === 'weekly' ? 'week' : 'date'}
            onChange={(date) => setSelectedDate(date)}
            value={selectedDate}
            format={viewMode === 'weekly' ? 'MMM D - MMM D, YYYY' : 'YYYY-MM-DD'}
            placeholder={`Select ${viewMode === 'weekly' ? 'Week' : 'Date'}`}
            style={{ width: 200 }}
          />
        </Space>
        {filteredEvents().length > 0 ? (
          <List
            dataSource={filteredEvents()}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.title}
                  description={item.date ? item.date.format('YYYY-MM-DD') + ` (${item.status})` : 'No Date'}
                />
              </List.Item>
            )}
          />
        ) : (
          <p style={{ textAlign: 'center', color: '#888' }}>No events found for the selected period.</p>
        )}
      </Space>
    </Card>
  );

  const profileItems = [
    { key: '1', label: 'View Profile', icon: <UserOutlined />, onClick: () => navigate('/student/profile') },
    { key: '2', label: 'Settings', icon: <SettingOutlined />, onClick: () => navigate('/student/settings') },
    { type: 'divider' },
    {
      key: '3',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () =>
        Modal.confirm({
          title: 'Confirm Logout',
          content: 'Are you sure you want to logout?',
          onOk: logout,
          centered: true,
        }),
    },
  ];

  const openFeedbackModal = (unitId) => {
    const unitAttendance = attendanceData.attendanceRecords.filter(
      (data) => data.session.unit._id.toString() === unitId.toString()
    );
    setActiveSessionId(unitAttendance?.[0]?._id || null);
    setFeedbackModalVisible(true);
  };

  const openQuizModal = async (unitId) => {
    const unitAttendance = attendanceData.attendanceRecords.filter(
      (data) => data.session.unit._id.toString() === unitId.toString()
    );
    if (unitAttendance?.length > 0) {
      const latestSession = unitAttendance[0];
      setActiveSessionId(latestSession._id);
      try {
        const quizData = await getSessionQuiz(latestSession.session._id);
        if (quizData?.questions) {
          setQuiz(quizData);
          setQuizModalVisible(true);
        } else {
          message.info('No quiz available.');
        }
      } catch { 
        message.error('Error fetching quiz.');
      }
    } else {
      message.warning('No attendance records found.');
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!activeSessionId) return message.error('No session selected.');
    try {
      await submitFeedback({
        sessionId: activeSessionId,
        rating: feedbackData.rating,
        feedbackText: feedbackData.text,
      });
      message.success('Feedback submitted!');
      setFeedbackModalVisible(false);
      setFeedbackData({ rating: 3, text: '' });
    } catch { 
      message.error('Error submitting feedback.');
    }
  };

  const handleQuizAnswerChange = (questionIndex, value) => {
    setQuizAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const handleQuizSubmit = async () => {
    if (!quiz?._id) return message.error('No quiz data.');
    try {
      await submitQuizAnswers({ quizId: quiz._id, answers: quizAnswers });
      message.success('Quiz submitted!');
      setQuizModalVisible(false);
      setQuizAnswers({});
      setQuiz(null);
    } catch { 
      message.error('Error submitting quiz.');
    }
  };

  const handleAttendClick = async (unitId) => {
    try {
      const session = await getActiveSessionForUnit(unitId);
      if (session && session._id && !session.ended) {
        navigate(`/qr-scanner/${unitId}`);
      } else {
        message.error("No active session available for this unit.");
      }
    } catch{
      message.error("No active session available or error checking session.");
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header
        style={{
          padding: '0 16px',
          background: colorBgContainer,
          position: 'fixed',
          width: '100%',
          zIndex: 10,
        }}
      >
        <Row align="middle">
          <Col flex="auto">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <AntTitle level={3} style={{ display: 'inline', margin: 0 }}>
              Student Dashboard
            </AntTitle>
          </Col>
          <Col>
            <Dropdown menu={{ items: profileItems }} trigger={['click']}>
              <Button
                type="text"
                icon={<UserOutlined style={{ fontSize: 24 }} />}
                style={{ marginRight: 24 }}
              />
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
          style={{
            background: colorBgContainer,
            marginTop: 64,
            position: 'fixed',
            height: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            items={[
              { key: '1', icon: <BookOutlined />, label: 'Units', onClick: () => navigate('/student/dashboard') },
              { key: '2', icon: <CheckCircleOutlined />, label: 'Attendance', onClick: () => navigate('/student/attendance') },
              { key: '3', icon: <UserOutlined />, label: 'Profile', onClick: () => navigate('/student/profile') },
            ]}
          />
        </Sider>

        <Content
          style={{
            marginTop: 64,
            marginBottom: 16,
            marginLeft: collapsed ? 96 : 266,
            marginRight: 16,
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
            maxWidth: 1200,
          }}
          className="ant-layout-content"
        >
          <Spin spinning={loading} tip="Loading data...">
            <Row gutter={[16, 16]} justify="center">
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  style={{
                    background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                    color: 'white',
                    borderRadius: 10,
                    textAlign: 'center',
                    width: '100%',
                    minWidth: 200,
                    height: 150,
                  }}
                  styles={{ body: { padding: '16px' } }}
                >
                  <Space direction="vertical">
                    <BookOutlined style={{ fontSize: 24 }} />
                    <h3>Total Units</h3>
                    <h1>{units.length}</h1>
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
                    width: '100%',
                    minWidth: 200,
                    height: 150,
                  }}
                  styles={{ body: { padding: '16px' } }}
                >
                  <Space direction="vertical">
                    <CheckCircleOutlined style={{ fontSize: 24 }} />
                    <h3>Attendance Rate</h3>
                    <h1>
                      {attendanceRates.length
                        ? Math.round(
                            attendanceRates.reduce((sum, rate) => sum + parseFloat(rate.value), 0) /
                              attendanceRates.length
                          )
                        : 0}
                      %
                    </h1>
                  </Space>
                </Card>
              </Col>
            </Row>

            <AntTitle level={2} style={{ marginTop: 24, textAlign: 'center' }}>
              My Units
            </AntTitle>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {units.map((unit) => (
                <Col xs={24} sm={12} md={8} lg={6} key={unit._id}>
                  <Card
                    title={unit.name || 'Untitled Unit'}
                    extra={<span>{unit.code || 'N/A'}</span>}
                    style={{ borderRadius: 10, width: '100%' }}
                    styles={{ 
                      body: { padding: '16px' }, 
                      header: { padding: '8px 16px', whiteSpace: 'normal', wordBreak: 'break-word' }
                    }}
                    onClick={() => setSelectedUnit(unit)}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size={16}>
                      <div
                        style={{
                          background: '#e8ecef',
                          borderRadius: 6,
                          overflow: 'hidden',
                          height: 20,
                        }}
                      >
                        <div
                          style={{
                            width: `${calculateAttendanceRate(unit._id)}%`,
                            background: 'linear-gradient(90deg, #1890ff, #40c4ff)',
                            color: '#fff',
                            textAlign: 'center',
                            padding: '2px 0',
                            transition: 'width 0.5s ease',
                          }}
                        >
                          {calculateAttendanceRate(unit._id)}%
                        </div>
                      </div>
                      <Row gutter={[8, 8]} justify="space-between">
                        <Col span={12}>
                          <Button
                            type="primary"
                            icon={<QrcodeOutlined />}
                            block
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAttendClick(unit._id);
                            }}
                          >
                            Attend
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button
                            block
                            onClick={(e) => {
                              e.stopPropagation();
                              openQuizModal(unit._id);
                            }}
                          >
                            Quiz
                          </Button>
                        </Col>
                      </Row>
                      <Button
                        block
                        onClick={(e) => {
                          e.stopPropagation();
                          openFeedbackModal(unit._id);
                        }}
                      >
                        Feedback
                      </Button>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>

            {renderCalendarEvents()}

            <AntTitle level={2} style={{ marginTop: 24, textAlign: 'center' }}>
              Attendance Overview
            </AntTitle>
            <Card style={{ marginTop: 16, borderRadius: 10 }}>
              <div style={{ height: '400px' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
              <Button
                type="primary"
                style={{ marginTop: 16, display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
                onClick={exportAttendanceData}
              >
                Export Data
              </Button>
            </Card>

            <Modal
              open={!!selectedUnit}
              title={selectedUnit?.name}
              onCancel={() => setSelectedUnit(null)}
              footer={<Button onClick={() => setSelectedUnit(null)}>Close</Button>}
              centered
              width={Math.min(window.innerWidth * 0.9, 500)}
            >
              {selectedUnit && (
                <Space direction="vertical">
                  <p><strong>Code:</strong> {selectedUnit.code || 'N/A'}</p>
                  <p><strong>Lecturer:</strong> {selectedUnit.lecturer || 'N/A'}</p>
                  <p><strong>Description:</strong> {selectedUnit.description || 'N/A'}</p>
                </Space>
              )}
            </Modal>

            <Modal
              open={feedbackModalVisible}
              title="Session Feedback"
              onCancel={() => setFeedbackModalVisible(false)}
              onOk={handleFeedbackSubmit}
              centered
              width={Math.min(window.innerWidth * 0.9, 400)}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <p>How was today&apos;s class?</p>
                <Rate
                  allowHalf
                  value={feedbackData.rating}
                  onChange={(value) => setFeedbackData({ ...feedbackData, rating: value })}
                />
                <Input.TextArea
                  rows={4}
                  placeholder="Leave a comment (optional)"
                  value={feedbackData.text}
                  onChange={(e) => setFeedbackData({ ...feedbackData, text: e.target.value })}
                />
              </Space>
            </Modal>

            <Modal
              open={quizModalVisible}
              title={quiz?.title || 'Quiz'}
              onCancel={() => setQuizModalVisible(false)}
              onOk={handleQuizSubmit}
              centered
              width={Math.min(window.innerWidth * 0.9, 500)}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {quiz?.questions?.map((q, index) => (
                  <div key={index}>
                    <p>{q.question}</p>
                    <Radio.Group
                      onChange={(e) => handleQuizAnswerChange(index, e.target.value)}
                      value={quizAnswers[index]}
                    >
                      <Space direction="vertical">
                        {q.options?.map((opt, idx) => (
                          <Radio key={idx} value={opt.optionText}>
                            {opt.optionText}
                          </Radio>
                        ))}
                      </Space>
                    </Radio.Group>
                  </div>
                ))}
              </Space>
            </Modal>
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentDashboard;