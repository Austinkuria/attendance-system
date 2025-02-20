// src/pages/dashboards/AdminAnalytics.jsx
import { useState, useEffect, useCallback } from 'react';
import { Layout, Button, Card, Row, Col, Select, Space, Modal, Table, Typography, Spin, DatePicker } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Title } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useNavigate } from 'react-router-dom';
import { getCourses, getUnitsByCourse, getCourseAttendanceRate } from '../../services/api';
import moment from 'moment'; // eslint-disable-line no-unused-vars
import '../../styles.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Title, zoomPlugin);

const { Header, Content } = Layout;
const { Option } = Select;
const { Title: AntTitle } = Typography;

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseUnits, setCourseUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'daily'
  const [selectedDate, setSelectedDate] = useState(null); // Moment object for selected week or day
  const [modalVisible, setModalVisible] = useState(false); // Added for modal visibility
  const [modalData, setModalData] = useState([]); // Added for modal data

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const coursesRes = await getCourses();
      const enrichedCourses = await Promise.all(coursesRes.map(async (course) => {
        const units = await getUnitsByCourse(course._id);
        const firstUnit = units[0] || {};
        return {
          ...course,
          year: firstUnit.year || 'N/A',
          semester: firstUnit.semester || 'N/A'
        };
      }));
      setCourses(enrichedCourses);
    } catch {
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourseAttendanceRates = useCallback(async () => {
    try {
      setLoading(true);
      const attendanceData = await Promise.all(
        courses.map(async (course) => ({
          courseId: course._id,
          data: await getCourseAttendanceRate(course._id)
        }))
      );
      const rates = attendanceData.reduce((acc, cur) => ({ ...acc, [cur.courseId]: cur.data }), {});
      setAttendanceRates(rates);
      if (courses.length && !selectedCourse) setSelectedCourse(courses[0]._id);
    } catch {
      alert('Error loading attendance data');
    } finally {
      setLoading(false);
    }
  }, [courses, selectedCourse]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (courses.length > 0) fetchCourseAttendanceRates(); }, [courses, fetchCourseAttendanceRates]);

  useEffect(() => {
    if (selectedCourse) {
      setLoading(true);
      getUnitsByCourse(selectedCourse)
        .then(units => setCourseUnits(units.filter(u => u && u._id && u.name)))
        .catch(() => alert('Failed to fetch course units'))
        .finally(() => setLoading(false));
    } else {
      setCourseUnits([]);
    }
  }, [selectedCourse]);

  const filteredData = selectedUnit
    ? attendanceRates[selectedCourse]?.weeklyTrends.filter(t => t.sessions.some(s => s.unit === selectedUnit))
    : attendanceRates[selectedCourse] || { totalPresent: 0, totalPossible: 0, weeklyTrends: [], dailyTrends: [] };

  const totalPresent = filteredData.totalPresent || 0;
  const totalPossible = filteredData.totalPossible || 0;
  const overallRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
  const weeklyTrends = filteredData.weeklyTrends || [];
  const dailyTrends = filteredData.dailyTrends || [];

  const trends = selectedDate
    ? (viewMode === 'weekly'
        ? weeklyTrends.filter(w => w.week === selectedDate.format('MMM D - MMM D, YYYY'))
        : dailyTrends.filter(d => d.date === selectedDate.format('YYYY-MM-DD')))
    : (viewMode === 'weekly' ? weeklyTrends : dailyTrends);

  const chartData = {
    labels: trends.length ? trends.map(t => viewMode === 'weekly' ? t.week : t.date) : ['No Data'],
    datasets: [
      { type: 'bar', label: 'Present', data: trends.length ? trends.map(t => t.present) : [0], backgroundColor: 'rgba(75, 192, 192, 0.8)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1, yAxisID: 'y-count' },
      { type: 'bar', label: 'Absent', data: trends.length ? trends.map(t => t.absent) : [0], backgroundColor: 'rgba(255, 99, 132, 0.8)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1, yAxisID: 'y-count' },
      { type: 'line', label: 'Attendance Rate (%)', data: trends.length ? trends.map(t => t.rate) : [0], borderColor: '#1890ff', backgroundColor: 'rgba(24, 144, 255, 0.2)', fill: false, tension: 0.3, pointRadius: 4, pointHoverRadius: 6, yAxisID: 'y-rate' },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 }, padding: 10 } },
      title: { display: true, text: `Overall Attendance: ${overallRate}% (Present: ${totalPresent}/${totalPossible})`, font: { size: 14 }, padding: { top: 10, bottom: 20 } },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: context => `${context.dataset.label}: ${context.dataset.type === 'line' ? `${context.raw}%` : `${context.raw} students`}`,
          footer: tooltipItems => `Sessions: ${trends[tooltipItems[0].dataIndex]?.sessionCount || 0}, Total Possible: ${trends[tooltipItems[0].dataIndex]?.present + trends[tooltipItems[0].dataIndex]?.absent || 0}`,
        },
      },
      zoom: {
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
        pan: { enabled: true, mode: 'x' },
      },
    },
    scales: {
      x: { stacked: true, title: { display: true, text: viewMode === 'weekly' ? 'Week' : 'Date' }, grid: { display: false } },
      'y-count': { stacked: true, position: 'left', beginAtZero: true, title: { display: true, text: 'Student Attendances' }, suggestedMax: totalPossible > 0 ? totalPossible + Math.ceil(totalPossible * 0.2) : 5 },
      'y-rate': { position: 'right', min: 0, max: 100, title: { display: true, text: 'Attendance Rate (%)' }, ticks: { callback: value => `${value}%` }, grid: { drawOnChartArea: false } },
    },
    onClick: (event, elements) => {
      if (elements.length) {
        setModalData(trends[elements[0].index].sessions);
        setModalVisible(true);
      }
    },
  };

  const modalColumns = [
    { title: 'Session ID', dataIndex: 'sessionId', key: 'sessionId' },
    { title: 'Start Time', dataIndex: 'startTime', key: 'startTime', render: time => new Date(time).toLocaleString() },
    { title: 'Present', dataIndex: 'present', key: 'present' },
    { title: 'Absent', dataIndex: 'absent', key: 'absent' },
    { title: 'Rate (%)', dataIndex: 'rate', key: 'rate' },
  ];

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: '0 16px', background: '#fff', position: 'fixed', width: '100%', zIndex: 10 }}>
        <Row align="middle">
          <Col flex="auto">
            <Button type="text" icon={<LeftOutlined />} onClick={() => navigate('/admin')} style={{ fontSize: 16 }} />
            <AntTitle level={3} style={{ display: 'inline', margin: '0 16px' }}>Analytics</AntTitle>
          </Col>
        </Row>
      </Header>

      <Content style={{ marginTop: 64, padding: 24, background: '#f0f2f5' }}>
        <Spin spinning={loading} tip="Loading data...">
          <Card style={{ marginBottom: 24, borderRadius: 10 }}>
            <Space direction="horizontal" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <Select
                  placeholder="Select Course"
                  allowClear
                  onChange={value => { setSelectedCourse(value); setSelectedUnit(null); setSelectedDate(null); }}
                  style={{ width: 200 }}
                >
                  {courses.map(course => (
                    <Option key={course._id} value={course._id}>{course.name}</Option>
                  ))}
                </Select>
                <Select
                  placeholder="Select Unit"
                  allowClear
                  onChange={setSelectedUnit}
                  value={selectedUnit}
                  style={{ width: 200 }}
                >
                  {courseUnits.map(unit => (
                    <Option key={unit._id} value={unit._id}>{unit.name}</Option>
                  ))}
                </Select>
              </Space>
              <Space>
                <Select
                  defaultValue="weekly"
                  style={{ width: 120 }}
                  onChange={value => { setViewMode(value); setSelectedDate(null); }}
                >
                  <Option value="weekly">Weekly View</Option>
                  <Option value="daily">Daily View</Option>
                </Select>
                <DatePicker
                  picker={viewMode === 'weekly' ? 'week' : 'date'}
                  onChange={handleDateChange}
                  value={selectedDate}
                  format={viewMode === 'weekly' ? 'MMM D - MMM D, YYYY' : 'YYYY-MM-DD'}
                  style={{ width: 200 }}
                  placeholder={`Select ${viewMode === 'weekly' ? 'Week' : 'Date'}`}
                />
              </Space>
            </Space>
          </Card>

          <Row gutter={[16, 16]}>
            {selectedCourse && (
              <Col span={24}>
                <Card
                  title={`${courses.find(c => c._id === selectedCourse)?.name || 'Selected Course'} (Year ${courses.find(c => c._id === selectedCourse)?.year || 'N/A'}, Sem ${courses.find(c => c._id === selectedCourse)?.semester || 'N/A'})`}
                  style={{ borderRadius: 10 }}
                >
                  <div style={{ height: 400 }}>
                    <Chart type="bar" data={chartData} options={options} />
                  </div>
                </Card>
              </Col>
            )}
          </Row>

          <Modal
            title="Session Details"
            open={modalVisible} // Changed from 'visible' to 'open' for Ant Design v5 compatibility (if applicable)
            onCancel={() => setModalVisible(false)}
            footer={null}
            width={800}
          >
            <Table dataSource={modalData} columns={modalColumns} rowKey="sessionId" pagination={false} />
          </Modal>
        </Spin>
      </Content>
    </Layout>
  );
};

export default AdminAnalytics;