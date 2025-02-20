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
  const [units, setUnits] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [studentId, setStudentId] = useState(null); // Added to store student ID
  const [isLoading, setIsLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // State for modals
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [feedbackData, setFeedbackData] = useState({ rating: 3, text: '' });
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});

  const navigate = useNavigate();

  // Check if the user is logged in when the component loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/login');
    }
  }, [navigate]);

  // Fetch student profile and get student ID
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    getUserProfile(token)
      .then((response) => {
        console.log('Profile Data:', response);
        setStudentId(response._id); // Assuming response contains the student's _id
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching profile:', error);
        setIsLoading(false);
      });
  }, []);

  // Fetch student units
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    getStudentUnits(token)
      .then((response) => {
        const unitsData = Array.isArray(response) ? response : response.enrolledUnits || [];
        setUnits(unitsData);
      })
      .catch((error) => console.error('Error fetching units:', error));
  }, []);

  // Fetch all attendance data for the student and filter by unit
  useEffect(() => {
    if (studentId && units.length > 0) {
      getStudentAttendance(studentId)
        .then((response) => {
          const attendanceRecords = response.attendanceRecords || [];
          console.log('All Attendance Records:', attendanceRecords);
          const unitAttendance = units.map((unit) => ({
            unitId: unit._id,
            data: attendanceRecords.filter((record) => record.session.unit === unit._id),
          }));
          setAttendanceData(unitAttendance);
        })
        .catch((error) => {
          console.error('Error fetching attendance data:', error);
          setAttendanceData(units.map((unit) => ({ unitId: unit._id, data: [] })));
        });
    }
  }, [studentId, units]);

  // Calculate attendance rate for a given unit
  const calculateAttendanceRate = useCallback(
    (unitId) => {
      const unitData = attendanceData.find((data) => data.unitId === unitId);
      if (!unitData || !unitData.data || unitData.data.length === 0) return 0;
      const attendedSessions = unitData.data.filter(
        (att) => att.status === 'Present'
      ).length;
      const totalSessions = unitData.data.length;
      return totalSessions === 0 ? 0 : ((attendedSessions / totalSessions) * 100).toFixed(2);
    },
    [attendanceData]
  );

  // Update attendance rates when data changes
  useEffect(() => {
    const rates = units.map((unit) => ({
      label: unit.name || 'Unnamed Unit',
      value: calculateAttendanceRate(unit._id),
    }));
    setAttendanceRates(rates);
  }, [attendanceData, units, calculateAttendanceRate]);

  // Export attendance data as CSV
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
  };

  // Logout handler
  const confirmLogout = () => {
    localStorage.removeItem('token');
    message.success('You have been logged out successfully.');
    navigate('/auth/login');
  };

  const handleViewProfile = () => {
    navigate('/student/profile');
  };

  const handleSettings = () => {
    navigate('/student/settings');
  };

  // Chart data configuration for overall attendance rates
  const chartData = {
    labels: attendanceRates.map((rate) => rate.label),
    datasets: [
      {
        label: 'Attendance Rate',
        data: attendanceRates.map((rate) => rate.value),
        backgroundColor: attendanceRates.map((rate) =>
          rate.value >= 75
            ? 'rgba(0, 255, 0, 0.5)'
            : rate.value >= 50
            ? 'rgba(255, 255, 0, 0.5)'
            : 'rgba(255, 0, 0, 0.5)'
        ),
        borderColor: attendanceRates.map((rate) =>
          rate.value >= 75
            ? 'rgba(0, 255, 0, 1)'
            : rate.value >= 50
            ? 'rgba(255, 255, 0, 1)'
            : 'rgba(255, 0, 0, 1)'
        ),
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
    ],
  };

  // Determine which units have low attendance (<50%)
  const lowAttendanceUnits = attendanceRates.filter((rate) => rate.value < 50);

  // Render a compact events list using Ant Design's List
  const renderCompactCalendar = () => {
    const events = attendanceData.flatMap((unitData) =>
      unitData.data.map((attendance) => ({
        title: `${unitData.unitId} - ${attendance.status || 'Unknown'}`,
        date: attendance.timestamp
          ? new Date(attendance.timestamp).toLocaleDateString()
          : 'No Date',
        status: attendance.status || 'Unknown',
      }))
    );
    return (
      <div style={{ marginTop: 24 }}>
        <h3 style={{ textAlign: 'center' }}>
          <CalendarOutlined /> Attendance Events
        </h3>
        {events.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={events}
            renderItem={(item) => (
              <List.Item key={item.title + item.date}>
                <List.Item.Meta
                  title={item.title}
                  description={`${item.date} (${item.status})`}
                />
              </List.Item>
            )}
          />
        ) : (
          <p style={{ textAlign: 'center' }}>No attendance events found.</p>
        )}
      </div>
    );
  };

  // "Back to Top" button state management
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 200);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // If still loading, show a loading indicator
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', marginTop: 50 }}>
        <LoadingOutlined style={{ fontSize: 24 }} spin /> Loading...
      </div>
    );
  }

  // Dropdown menu for profile options
  const profileMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={handleViewProfile}>
        View Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />} onClick={handleSettings}>
        Settings
      </Menu.Item>
      <Menu.Item
        key="logout"
        icon={<LogoutOutlined />}
        danger
        onClick={() =>
          Modal.confirm({
            title: 'Confirm Logout',
            content: 'Are you sure you want to logout?',
            onOk: confirmLogout,
            centered: true,
          })
        }
      >
        Logout
      </Menu.Item>
    </Menu>
  );

  // Functions to handle feedback and quiz modals
  const openFeedbackModal = (unitId) => {
    console.log('Opening feedback modal for unit:', unitId);
    const unitAttendance = attendanceData.find((data) => data.unitId === unitId);
    if (unitAttendance && unitAttendance.data.length > 0) {
      setActiveSessionId(unitAttendance.data[0]._id); // Use latest session ID
    } else {
      setActiveSessionId(null); // No session available
    }
    setFeedbackModalVisible(true);
  };

  const openQuizModal = async (unitId) => {
    const unitAttendance = attendanceData.find((data) => data.unitId === unitId);
    if (unitAttendance && unitAttendance.data.length > 0) {
      const latestSession = unitAttendance.data[0]; // Latest session
      setActiveSessionId(latestSession._id);
      try {
        const quizData = await getSessionQuiz(latestSession._id);
        if (quizData && quizData.questions) {
          setQuiz(quizData);
          setQuizModalVisible(true);
        } else {
          message.info('No quiz available for this session.');
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        message.error('Error fetching quiz.');
      }
    } else {
      message.warning('No attendance record found for this unit.');
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!activeSessionId) {
      message.error('No session selected for feedback.');
      return;
    }
    try {
      await submitFeedback({
        sessionId: activeSessionId,
        rating: feedbackData.rating,
        feedbackText: feedbackData.text,
      });
      message.success('Feedback submitted!');
      setFeedbackModalVisible(false);
      setFeedbackData({ rating: 3, text: '' });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Error submitting feedback.');
    }
  };

  const handleQuizAnswerChange = (questionIndex, value) => {
    setQuizAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const handleQuizSubmit = async () => {
    if (!quiz || !quiz._id) {
      message.error('No quiz data available.');
      return;
    }
    try {
      await submitQuizAnswers({
        quizId: quiz._id,
        answers: quizAnswers,
      });
      message.success('Quiz submitted!');
      setQuizModalVisible(false);
      setQuizAnswers({});
      setQuiz(null);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      message.error('Error submitting quiz.');
    }
  };

  return (
    <Layout style={{ padding: '24px' }}>
      <Content>
        <Row
          justify="center"
          align="middle"
          style={{ position: 'relative', marginBottom: 24 }}
        >
          <h1 style={{ textAlign: 'center' }}>Student Dashboard</h1>
          <div style={{ position: 'absolute', right: 0 }}>
            <Dropdown overlay={profileMenu} placement="bottomRight">
              <Button type="primary" shape="circle" icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Row>
        {lowAttendanceUnits.length > 0 && (
          <Alert
            message={
              <>
                <strong>Warning:</strong> Your attendance is below 50% in the
                following units:
                <ul>
                  {lowAttendanceUnits.map((unit) => (
                    <li key={unit.label}>{unit.label}</li>
                  ))}
                </ul>
              </>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}
        <Row gutter={[16, 16]}>
          {units.map((unit) => (
            <Col xs={24} sm={12} md={8} key={unit._id}>
              <Card
                title={unit.name || 'Untitled Unit'}
                extra={<span>{unit.code || 'N/A'}</span>}
                hoverable
                onClick={() => setSelectedUnit(unit)}
              >
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      background: '#f0f0f0',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${calculateAttendanceRate(unit._id)}%`,
                        background: '#1890ff',
                        padding: '4px 0',
                        color: '#fff',
                        textAlign: 'center',
                      }}
                    >
                      {calculateAttendanceRate(unit._id)}%
                    </div>
                  </div>
                </div>
                <Row justify="space-between">
                  <Button
                    type="default"
                    icon={<EyeOutlined />}
                    onClick={() =>
                      message.info(
                        `Attendance Rate: ${calculateAttendanceRate(unit._id)}%`
                      )
                    }
                  >
                    View Rate
                  </Button>
                  <Button
                    type="primary"
                    icon={<QrcodeOutlined />}
                    onClick={() => navigate(`/qr-scanner/${unit._id}`)}
                  >
                    Mark Attendance
                  </Button>
                </Row>
                <Row justify="space-around" style={{ marginTop: 16 }}>
                  <Button onClick={() => openFeedbackModal(unit._id)}>
                    Submit Feedback
                  </Button>
                  <Button onClick={() => openQuizModal(unit._id)}>
                    Take Quiz
                  </Button>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
        {renderCompactCalendar()}
        <div style={{ marginTop: 48 }}>
          <h3 style={{ textAlign: 'center' }}>Overall Attendance Rates</h3>
          <div style={{ height: 400 }}>
            <Bar
              data={chartData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button type="default" onClick={exportAttendanceData}>
            Export Attendance Data
          </Button>
        </div>
        <Modal
          open={!!selectedUnit}
          title={selectedUnit?.name}
          onCancel={() => setSelectedUnit(null)}
          footer={[
            <Button key="close" onClick={() => setSelectedUnit(null)}>
              Close
            </Button>,
          ]}
        >
          {selectedUnit && (
            <div>
              <p>
                <strong>Code:</strong> {selectedUnit.code || 'N/A'}
              </p>
              <p>
                <strong>Lecturer:</strong> {selectedUnit.lecturer || 'N/A'}
              </p>
              <p>
                <strong>Description:</strong> {selectedUnit.description || 'N/A'}
              </p>
            </div>
          )}
        </Modal>
      </Content>
      {showBackToTop && (
        <Button
          type="primary"
          shape="circle"
          icon={<ArrowUpOutlined />}
          style={{ position: 'fixed', bottom: 20, right: 20 }}
          onClick={() => window.scrollTo(0, 0)}
        />
      )}
      <Modal
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        onOk={handleFeedbackSubmit}
        title="Session Feedback"
      >
        <p>How was today&apos;s class?</p>
        <Rate
          allowHalf
          value={feedbackData.rating}
          onChange={(value) =>
            setFeedbackData({ ...feedbackData, rating: value })
          }
        />
        <Input.TextArea
          rows={4}
          placeholder="Leave a comment (optional)"
          value={feedbackData.text}
          onChange={(e) =>
            setFeedbackData({ ...feedbackData, text: e.target.value })
          }
          style={{ marginTop: 16 }}
        />
      </Modal>
      <Modal
        open={quizModalVisible}
        onCancel={() => setQuizModalVisible(false)}
        onOk={handleQuizSubmit}
        title={quiz?.title || 'Quiz'}
      >
        {quiz?.questions?.map((q, index) => (
          <div key={index} style={{ marginBottom: 16 }}>
            <p>{q.question}</p>
            <Radio.Group
              onChange={(e) => handleQuizAnswerChange(index, e.target.value)}
              value={quizAnswers[index]}
            >
              {q.options.map((opt, idx) => (
                <Radio key={idx} value={opt.optionText}>
                  {opt.optionText}
                </Radio>
              ))}
            </Radio.Group>
          </div>
        ))}
      </Modal>
    </Layout>
  );
};

export default StudentDashboard;