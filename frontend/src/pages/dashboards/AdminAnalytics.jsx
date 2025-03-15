import { useState, useEffect, useCallback, useContext } from 'react';
import { Layout, Button, Card, Row, Col, Select, Space, Modal, Table, Typography, Spin, DatePicker, message } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Title } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useNavigate } from 'react-router-dom';
import { getCourses, getUnitsByCourse, getCourseAttendanceRate } from '../../services/api';
import dayjs from 'dayjs'; // Use dayjs instead of moment
import { ThemeContext } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Title, zoomPlugin);

const { Header, Content } = Layout;
const { Option } = Select;
const { Title: AntTitle } = Typography;

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const [courses, setCourses] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading data...');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseUnits, setCourseUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [viewMode, setViewMode] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingMessage('Fetching available courses...');
      const coursesRes = await getCourses();
      const enrichedCourses = await Promise.all(coursesRes.map(async (course) => {
        const units = await getUnitsByCourse(course._id);
        const firstUnit = units[0] || {};
        return { ...course, year: firstUnit.year || 'N/A', semester: firstUnit.semester || 'N/A' };
      }));
      setCourses(enrichedCourses);
    } catch {
      message.error('Error loading course data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourseAttendanceRates = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingMessage('Calculating attendance statistics...');
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
      message.error('Error loading attendance data');
    } finally {
      setLoading(false);
    }
  }, [courses, selectedCourse]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (courses.length > 0) fetchCourseAttendanceRates(); }, [courses, fetchCourseAttendanceRates]);

  useEffect(() => {
    if (selectedCourse) {
      setLoading(true);
      setLoadingMessage('Fetching course units...');
      getUnitsByCourse(selectedCourse)
        .then(units => setCourseUnits(units.filter(u => u && u._id && u.name)))
        .catch(() => message.error('Failed to fetch course units'))
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
      ? weeklyTrends.filter(w => w.week === dayjs(selectedDate).format('MMM D - MMM D, YYYY'))
      : dailyTrends.filter(d => d.date === dayjs(selectedDate).format('YYYY-MM-DD')))
    : (viewMode === 'weekly' ? weeklyTrends : dailyTrends);

  const chartData = {
    labels: trends.length ? trends.map(t => viewMode === 'weekly' ? t.week : t.date) : ['No Data'],
    datasets: [
      { type: 'bar', label: 'Present', data: trends.length ? trends.map(t => t.present) : [0], backgroundColor: themeColors.secondary, borderColor: themeColors.secondary, borderWidth: 1, yAxisID: 'y-count' },
      { type: 'bar', label: 'Absent', data: trends.length ? trends.map(t => t.absent) : [0], backgroundColor: themeColors.accent, borderColor: themeColors.accent, borderWidth: 1, yAxisID: 'y-count' },
      { type: 'line', label: 'Attendance Rate (%)', data: trends.length ? trends.map(t => t.rate) : [0], borderColor: themeColors.primary, backgroundColor: `${themeColors.primary}33`, fill: false, tension: 0.3, pointRadius: 4, pointHoverRadius: 6, yAxisID: 'y-rate' },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 }, padding: 10, color: themeColors.text } },
      title: { display: true, text: `Overall Attendance: ${overallRate}% (Present: ${totalPresent}/${totalPossible})`, font: { size: 14 }, padding: { top: 10, bottom: 20 }, color: themeColors.text },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: `${themeColors.text}CC`,
        titleColor: '#fff',
        bodyColor: '#fff',
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
      x: { stacked: true, title: { display: true, text: viewMode === 'weekly' ? 'Week' : 'Date', color: themeColors.text }, grid: { display: false }, ticks: { color: themeColors.text } },
      'y-count': { stacked: true, position: 'left', beginAtZero: true, title: { display: true, text: 'Student Attendances', color: themeColors.text }, suggestedMax: totalPossible > 0 ? totalPossible + Math.ceil(totalPossible * 0.2) : 5, ticks: { color: themeColors.text }, grid: { color: `${themeColors.text}20` } },
      'y-rate': { position: 'right', min: 0, max: 100, title: { display: true, text: 'Attendance Rate (%)', color: themeColors.text }, ticks: { callback: value => `${value}%`, color: themeColors.text }, grid: { drawOnChartArea: false } },
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
    <Layout style={{ minHeight: '100vh', background: themeColors.background, margin: 0, padding: 0, overflowX: 'hidden' }}>
      <Header style={{ padding: '0 16px', background: themeColors.cardBg, position: 'fixed', width: '100%', zIndex: 10 }}>
        <Row align="middle">
          <Col flex="auto">
            <Button type="text" icon={<LeftOutlined />} onClick={() => navigate('/admin')} style={{ fontSize: 16, color: themeColors.text }} />
            <AntTitle level={3} style={{ display: 'inline', margin: '0 16px', color: themeColors.text }}>Analytics</AntTitle>
          </Col>
          <Col>
            <ThemeToggle />
          </Col>
        </Row>
      </Header>

      <Content style={{ marginTop: 64, padding: '24px 12px 24px 12px', background: themeColors.background }}>
        <Spin spinning={loading} tip={loadingMessage}>
          <Card style={{ marginBottom: 24, borderRadius: 10, background: themeColors.cardBg, borderColor: themeColors.primary }}>
            {/* Added wrapper for filters */}
            <div className="filter-container">
              <Space direction="horizontal" style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
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
            </div>
          </Card>

          <Row gutter={[16, 16]}>
            {selectedCourse && (
              <Col span={24}>
                <Card
                  title={`${courses.find(c => c._id === selectedCourse)?.name || 'Selected Course'} (Year ${courses.find(c => c._id === selectedCourse)?.year || 'N/A'}, Sem ${courses.find(c => c._id === selectedCourse)?.semester || 'N/A'})`}
                  style={{ borderRadius: 10, background: themeColors.cardBg, borderColor: themeColors.primary }}
                  styles={{ header: { color: themeColors.text } }} // Updated headStyle to styles
                >
                  <div style={{ height: 400 }} className="chart-container">
                    <Chart type="bar" data={chartData} options={options} />
                  </div>
                </Card>
              </Col>
            )}
          </Row>

          <Modal
            title="Session Details"
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={null}
            width={800}
            style={{ background: themeColors.cardBg }}
            styles={{ body: { background: themeColors.cardBg, color: themeColors.text } }} // Updated bodyStyle to styles
          >
            <Table
              dataSource={modalData}
              columns={modalColumns}
              rowKey="sessionId"
              pagination={false}
              style={{ background: themeColors.cardBg }}
              rowClassName={(_, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
            />
          </Modal>
        </Spin>
      </Content>

      <style>{`
        /* Global resets and component styles */
        html, body {
          margin: 0;
          padding: 0;
        }
        body { overflow-x: hidden; }
        .ant-select-selector, .ant-picker {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
          border-color: ${themeColors.primary} !important;
        }
        .ant-select-dropdown, .ant-picker-dropdown {
          background: ${themeColors.cardBg} !important;
        }
        .ant-select-item-option-content {
          color: ${themeColors.text} !important;
        }
        .ant-table {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
        }
        .ant-table-thead > tr > th {
          background: ${themeColors.primary} !important;
          color: #fff !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid ${themeColors.text}20 !important;
          color: ${themeColors.text} !important;
        }
        .table-row-light {
          background: ${themeColors.cardBg} !important;
        }
        .table-row-dark {
          background: ${themeColors.background} !important;
        }
        .ant-modal-header {
          background: ${themeColors.cardBg} !important;
          border-bottom: 1px solid ${themeColors.text}20 !important;
        }
        .ant-modal-title {
          color: ${themeColors.text} !important;
        }
        /* Media queries for small screens */
        @media (max-width: 768px) {
          .ant-layout-content { padding: 12px !important; }
          .ant-card { margin-left: 0 !important; margin-right: 0 !important; }
          .filter-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
          }
        }
        /* Debug only the chart container */
        .chart-container { 
          border: 1px dashed red !important;
        }
        .ant-card { border: 1px dashed blue !important; }
      `}</style>
    </Layout>
  );
};

export default AdminAnalytics;