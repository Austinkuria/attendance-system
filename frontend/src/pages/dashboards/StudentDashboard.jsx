import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStudentAttendance,
  getStudentUnits,
  getUserProfile,
  submitFeedback,
  getSessionQuiz,
  submitQuizAnswers,
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
  Button,
  Card,
  Row,
  Col,
  Dropdown,
  Menu,
  Alert,
  List,
  Modal,
  message,
  Input,
  Rate,
  Radio,
  Spin,
} from 'antd';
import {
  EyeOutlined,
  QrcodeOutlined,
  UserOutlined,
  CalendarOutlined,
  SettingOutlined,
  LogoutOutlined,
  ArrowUpOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const { Content } = Layout;

const StudentDashboard = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [units, setUnits] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [feedbackData, setFeedbackData] = useState({ rating: 3, text: '' });
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/login');
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const profileResponse = await getUserProfile(token);
        console.log('Profile Data:', profileResponse);
        const studentId = profileResponse._id || localStorage.getItem('userId');

        if (!studentId) {
          throw new Error('No student ID found');
        }

        console.log('Attempting to fetch attendance for studentId:', studentId);
        const attendanceResponse = await getStudentAttendance(studentId);
        console.log('Full Attendance Response:', attendanceResponse);

        if (!attendanceResponse.attendanceRecords) {
          throw new Error('No attendance records found or endpoint not available');
        }

        setAttendanceData(attendanceResponse.attendanceRecords || []);
        console.log('Set Attendance Data:', attendanceResponse.attendanceRecords);

        const unitsResponse = await getStudentUnits(token);
        const unitsData = unitsResponse.enrolledUnits || unitsResponse;
        setUnits(unitsData);
        console.log('Units Data:', unitsData);

      } catch (error) {
        console.error('Error fetching data:', error.message);
        setError(error.message || 'Failed to load data');
        message.error(error.message || 'An error occurred while loading data');
        setAttendanceData([]);
        setUnits([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const calculateAttendanceRate = useCallback((unitId) => {
    if (!Array.isArray(attendanceData)) {
      console.warn('attendanceData is not an array:', attendanceData);
      return 0;
    }
    const unitAttendance = attendanceData.filter((record) => 
      record.session && record.session.unit && record.session.unit.toString() === unitId
    );
    if (unitAttendance.length === 0) {
      console.warn('No attendance data found for unit:', unitId);
      return 0;
    }
    const attendedSessions = unitAttendance.filter((att) => att.status === 'Present').length;
    const totalSessions = unitAttendance.length;
    return totalSessions === 0 ? 0 : ((attendedSessions / totalSessions) * 100).toFixed(2);
  }, [attendanceData]);

  useEffect(() => {
    console.log('Current attendanceData:', attendanceData);
    const rates = units.map((unit) => ({
      label: unit.name,
      value: calculateAttendanceRate(unit._id),
    }));
    setAttendanceRates(rates);
  }, [attendanceData, units, calculateAttendanceRate]);

  const exportAttendanceData = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      attendanceRates.map((rate) => `${rate.label},${rate.value}%`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'attendance_data.csv');
    document.body.appendChild(link);
    link.click();
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    message.success('Logged out successfully.');
    navigate('/auth/login');
  };

  const handleViewProfile = () => navigate('/student/profile');
  const handleSettings = () => navigate('/student/settings');

  const chartData = {
    labels: attendanceRates.map((rate) => rate.label),
    datasets: [{
      label: 'Attendance Rate',
      data: attendanceRates.map((rate) => rate.value),
      backgroundColor: attendanceRates.map((rate) => 
        rate.value >= 75 ? 'rgba(0, 255, 0, 0.5)' : 
        rate.value >= 50 ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)'
      ),
      borderColor: attendanceRates.map((rate) => 
        rate.value >= 75 ? 'rgba(0, 255, 0, 1)' : 
        rate.value >= 50 ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 0, 0, 1)'
      ),
      borderWidth: 1,
      hoverBackgroundColor: 'rgba(75, 192, 192, 0.7)',
    }],
  };

  const lowAttendanceUnits = attendanceRates.filter((rate) => rate.value < 50);

  const renderCompactCalendar = () => {
    if (!Array.isArray(attendanceData)) {
      return (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ textAlign: 'center' }}><CalendarOutlined /> Attendance Events</h3>
          <p style={{ textAlign: 'center' }}>No attendance data available.</p>
        </div>
      );
    }

    const events = attendanceData.map((attendance) => ({
      title: `${attendance.session?.unit?.name || 'Unknown Unit'} - ${attendance.status}`,
      date: new Date(attendance.timestamp).toLocaleDateString(),
      status: attendance.status,
    }));

    return (
      <div style={{ marginTop: 24 }}>
        <h3 style={{ textAlign: 'center' }}><CalendarOutlined /> Attendance Events</h3>
        {events.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={events}
            renderItem={(item, index) => (
              <List.Item key={index}>
                <List.Item.Meta title={item.title} description={`${item.date} (${item.status})`} />
              </List.Item>
            )}
          />
        ) : (
          <p style={{ textAlign: 'center' }}>No attendance events found.</p>
        )}
      </div>
    );
  };

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 200);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (error) {
    return (
      <Layout style={{ padding: '24px' }}>
        <Content>
          <Alert message="Error Loading Dashboard" description={error} type="error" showIcon style={{ margin: '24px' }} />
        </Content>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout style={{ padding: '24px', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </Layout>
    );
  }

  const profileMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={handleViewProfile}>View Profile</Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />} onClick={handleSettings}>Settings</Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} danger onClick={() => Modal.confirm({
        title: 'Confirm Logout',
        content: 'Are you sure you want to logout?',
        onOk: confirmLogout,
        centered: true,
      })}>Logout</Menu.Item>
    </Menu>
  );

  const openFeedbackModal = (unitId) => {
    console.log('Opening feedback modal for unit:', unitId);
    const unitAttendance = attendanceData.filter(record => record.session?.unit?.toString() === unitId);
    if (unitAttendance.length > 0) {
      const latestSession = unitAttendance[unitAttendance.length - 1];
      setActiveSessionId(latestSession._id || 'test-session-id');
      setFeedbackModalVisible(true);
    } else {
      message.warning('No attendance record found for this unit.');
    }
  };

  const openQuizModal = async (unitId) => {
    const unitAttendance = attendanceData.filter(record => record.session?.unit?.toString() === unitId);
    if (unitAttendance.length > 0) {
      const latestSession = unitAttendance[unitAttendance.length - 1];
      setActiveSessionId(latestSession.session._id);
      try {
        const quizData = await getSessionQuiz(latestSession.session._id);
        if (quizData) {
          setQuiz(quizData);
          setQuizModalVisible(true);
        } else {
          message.info('No quiz available for this session.');
        }
      } catch (error) {
        message.error('Error fetching quiz: ' + error.message);
      }
    } else {
      message.warning('No attendance record found for this unit.');
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      await submitFeedback({ sessionId: activeSessionId, rating: feedbackData.rating, feedbackText: feedbackData.text });
      message.success('Feedback submitted!');
      setFeedbackModalVisible(false);
      setFeedbackData({ rating: 3, text: '' });
    } catch (error) {
      message.error('Error submitting feedback: ' + error.message);
    }
  };

  const handleQuizAnswerChange = (questionIndex, value) => setQuizAnswers(prev => ({ ...prev, [questionIndex]: value }));

  const handleQuizSubmit = async () => {
    try {
      await submitQuizAnswers({ quizId: quiz._id, answers: quizAnswers });
      message.success('Quiz submitted!');
      setQuizModalVisible(false);
      setQuizAnswers({});
      setQuiz(null);
    } catch (error) {
      message.error('Error submitting quiz: ' + error.message);
    }
  };

  return (
    <Layout style={{ padding: '24px' }}>
      <Content>
        <Row justify="center" align="middle" style={{ position: 'relative', marginBottom: 24 }}>
          <h1 style={{ textAlign: 'center' }}>Student Dashboard</h1>
          <div style={{ position: 'absolute', right: 0 }}>
            <Dropdown overlay={profileMenu} placement="bottomRight">
              <Button type="primary" shape="circle" icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Row>
        {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}
        {lowAttendanceUnits.length > 0 && !error && (
          <Alert message={<><strong>Warning:</strong> Your attendance is below 50% in the following units:<ul>{lowAttendanceUnits.map(unit => <li key={unit.label}>{unit.label}</li>)}</ul></>} type="warning" showIcon style={{ marginBottom: 24 }} />
        )}
        <Row gutter={[16, 16]}>
          {units.length > 0 ? units.map(unit => (
            <Col xs={24} sm={12} md={8} key={unit._id}>
              <Card title={unit.name || 'Untitled Unit'} extra={<span>{unit.code || 'N/A'}</span>} hoverable onClick={() => setSelectedUnit(unit)}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                    {unit._id ? (
                      <div style={{ width: `${calculateAttendanceRate(unit._id)}%`, background: '#1890ff', padding: '4px 0', color: '#fff', textAlign: 'center' }}>
                        {calculateAttendanceRate(unit._id)}%
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '4px 0' }}>No attendance data</div>
                    )}
                  </div>
                </div>
                <Row justify="space-between">
                  <Button type="default" icon={<EyeOutlined />} onClick={() => message.info(`Attendance Rate: ${calculateAttendanceRate(unit._id)}%`)}>View Rate</Button>
                  <Button type="primary" icon={<QrcodeOutlined />} onClick={() => navigate(`/qr-scanner/${unit._id}`)}>Mark Attendance</Button>
                </Row>
                <Row justify="space-around" style={{ marginTop: 16 }}>
                  <Button onClick={() => openFeedbackModal(unit._id)}>Submit Feedback</Button>
                  <Button onClick={() => openQuizModal(unit._id)}>Take Quiz</Button>
                </Row>
              </Card>
            </Col>
          )) : <p>No units found for your course, year, and semester.</p>}
        </Row>
        {renderCompactCalendar()}
        <div style={{ marginTop: 48 }}>
          <h3 style={{ textAlign: 'center' }}>Overall Attendance Rates</h3>
          <div style={{ height: 400 }}><Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
        </div>
        <div style={{ marginTop: 24, textAlign: 'center' }}><Button type="default" onClick={exportAttendanceData}>Export Attendance Data</Button></div>
        <Modal open={!!selectedUnit} title={selectedUnit?.name} onCancel={() => setSelectedUnit(null)} footer={[<Button key="close" onClick={() => setSelectedUnit(null)}>Close</Button>]}>
          {selectedUnit && (<div><p><strong>Code:</strong> {selectedUnit.code}</p><p><strong>Lecturer:</strong> {selectedUnit.lecturer}</p><p><strong>Description:</strong> {selectedUnit.description}</p></div>)}
        </Modal>
      </Content>
      {showBackToTop && <Button type="primary" shape="circle" icon={<ArrowUpOutlined />} style={{ position: 'fixed', bottom: 20, right: 20 }} onClick={() => window.scrollTo(0, 0)} />}
      <Modal open={feedbackModalVisible} onCancel={() => setFeedbackModalVisible(false)} onOk={handleFeedbackSubmit} title="Session Feedback">
        <p>How was today's class?</p><Rate allowHalf value={feedbackData.rating} onChange={value => setFeedbackData({ ...feedbackData, rating: value })} /><Input.TextArea rows={4} placeholder="Leave a comment (optional)" value={feedbackData.text} onChange={e => setFeedbackData({ ...feedbackData, text: e.target.value })} style={{ marginTop: 16 }} />
      </Modal>
      <Modal open={quizModalVisible} onCancel={() => setQuizModalVisible(false)} onOk={handleQuizSubmit} title={quiz?.title || 'Quiz'}>
        {quiz?.questions?.map((q, index) => (<div key={index} style={{ marginBottom: 16 }}><p>{q.question}</p><Radio.Group onChange={e => handleQuizAnswerChange(index, e.target.value)} value={quizAnswers[index]}>{q.options.map((opt, idx) => <Radio key={idx} value={opt.optionText}>{opt.optionText}</Radio>)}</Radio.Group></div>))}
      </Modal>
    </Layout>
  );
};

export default StudentDashboard;