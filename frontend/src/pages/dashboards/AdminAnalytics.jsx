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
      <Header style={{
        padding: '0 24px',
        background: themeColors.cardBg,
        position: 'fixed',
        width: '100%',
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        height: '64px',
        lineHeight: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type="primary"
            icon={<LeftOutlined />}
            onClick={() => navigate('/admin')}
            style={{ marginRight: 16 }}
          >
            Back to Admin
          </Button>
          <AntTitle level={3} style={{ margin: 0, color: themeColors.primary, display: 'inline-block', verticalAlign: 'middle' }}>Analytics</AntTitle>
        </div>
        <div>
          <ThemeToggle />
        </div>
      </Header>

      <Content style={{
        marginTop: 64,
        padding: 0,
        background: themeColors.background
      }}>
        <Spin spinning={loading} tip={loadingMessage}>
          <Card style={{
            marginBottom: 16,
            borderRadius: 0,
            background: themeColors.cardBg,
            borderColor: themeColors.primary
          }}>
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

          <Row gutter={[0, 16]}>
            {selectedCourse && (
              <Col span={24}>
                <Card
                  title={`${courses.find(c => c._id === selectedCourse)?.name || 'Selected Course'} (Year ${courses.find(c => c._id === selectedCourse)?.year || 'N/A'}, Sem ${courses.find(c => c._id === selectedCourse)?.semester || 'N/A'})`}
                  style={{
                    borderRadius: 0,
                    background: themeColors.cardBg,
                    borderColor: themeColors.primary
                  }}
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
        /* Global resets and core styles only */
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          overflow-x: hidden;
          color: ${themeColors.text};
          background: ${themeColors.background};
        }
        
        /* Direct styling for main components only */
        .ant-layout {
          background: ${themeColors.background};
          min-width: 100%;
          width: 100vw;
          overflow-x: hidden;
          color: ${themeColors.text};
        }
        
        .ant-layout-header {
          background: ${themeColors.cardBg};
          padding: 0 24px;
          height: 64px;
          line-height: 64px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          width: 100%;
          color: ${themeColors.text};
        }
        
        .ant-layout-content {
          margin-top: 64px;
          padding: 0;
          background: ${themeColors.background};
          width: 100%;
          overflow-x: hidden;
          color: ${themeColors.text};
        }
        
        /* Card styles */
        .ant-card {
          background: ${themeColors.cardBg};
          border-color: ${themeColors.primary};
          border-radius: 0;
          margin: 0;
          width: 100%;
          color: ${themeColors.text};
        }
        
        .ant-card-head {
          color: ${themeColors.text};
          background: ${themeColors.cardBg};
          border-bottom: 1px solid ${themeColors.primary};
        }
        
        .ant-card-body {
          background: ${themeColors.cardBg};
          color: ${themeColors.text};
        }
        
        /* Form elements */
        .ant-select-selector, .ant-picker {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
          border-color: ${themeColors.primary} !important;
        }
        
        /* Fix for dark mode placeholders */
        .ant-select-selection-placeholder,
        .ant-picker-input > input::placeholder {
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'} !important;
        }
        
        /* Make input text more visible */
        .ant-select-selection-item,
        .ant-picker-input > input {
          color: ${themeColors.text} !important;
        }
        
        /* Dropdown styling */
        .ant-select-dropdown {
          background: ${themeColors.cardBg} !important;
          border: 1px solid ${themeColors.primary} !important;
        }
        
        .ant-select-item {
          color: ${themeColors.text} !important;
          background: ${themeColors.cardBg} !important;
        }
        
        .ant-select-item-option-selected {
          background: ${themeColors.primary}33 !important;
          color: ${themeColors.text} !important;
          font-weight: bold;
        }
        
        .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
          background: ${themeColors.primary}22 !important;
          color: ${themeColors.text} !important;
        }
        
        /* DatePicker dropdown */
        .ant-picker-dropdown {
          background: ${themeColors.cardBg} !important;
          border: 1px solid ${themeColors.primary} !important;
        }
        
        /* Calendar styling */
        .ant-picker-panel {
          background: ${themeColors.cardBg} !important;
          border: none !important;
        }
        
        .ant-picker-panel-container {
          background: ${themeColors.cardBg} !important;
        }
        
        /* Calendar weekday header (Su Mo Tu We Th Fr Sa) */
        .ant-picker-content th {
          color: ${themeColors.primary} !important;
          font-weight: bold !important;
          padding: 5px 0 !important;
        }
        
        /* Make sure the content inside cell is visible */
        .ant-picker-content th, .ant-picker-content td {
          text-align: center !important;
        }
        
        /* Calendar cells */
        .ant-picker-cell {
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'} !important;
        }
        
        .ant-picker-cell-in-view {
          color: ${themeColors.text} !important;
        }
        
        .ant-picker-cell-disabled {
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'} !important;
          background: ${isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.04)'} !important;
        }
        
        /* Calendar hover and selected states */
        .ant-picker-cell:hover:not(.ant-picker-cell-selected):not(.ant-picker-cell-disabled) .ant-picker-cell-inner {
          background: ${themeColors.primary}33 !important;
        }
        
        .ant-picker-cell-selected .ant-picker-cell-inner,
        .ant-picker-cell-range-start .ant-picker-cell-inner,
        .ant-picker-cell-range-end .ant-picker-cell-inner {
          background: ${themeColors.primary} !important;
          color: #fff !important;
        }
        
        /* Calendar header */
        .ant-picker-header {
          color: ${themeColors.text} !important;
          border-bottom: 1px solid ${themeColors.primary}33 !important;
        }
        
        .ant-picker-header button {
          color: ${themeColors.text} !important;
        }
        
        .ant-picker-header-view {
          color: ${themeColors.primary} !important;
          font-weight: bold;
        }
        
        /* Footer and today button */
        .ant-picker-footer {
          border-top: 1px solid ${themeColors.primary}33 !important;
        }
        
        .ant-picker-today-btn {
          color: ${themeColors.primary} !important;
        }
        
        /* Week selection specific styling */
        .ant-picker-week-panel-row:hover td {
          background: ${themeColors.primary}22 !important;
        }
        
        .ant-picker-week-panel-row-selected td,
        .ant-picker-week-panel-row-selected:hover td {
          background: ${themeColors.primary}44 !important;
        }
        
        .ant-picker-week-panel-row-selected .ant-picker-cell-inner,
        .ant-picker-week-panel-row-selected:hover .ant-picker-cell-inner {
          color: ${themeColors.text} !important;
        }
        
        .ant-picker-week-panel-row-selected .ant-picker-cell-today .ant-picker-cell-inner {
          color: ${themeColors.primary} !important;
          font-weight: bold;
        }
        
        /* Button styling */
        .ant-btn-primary {
          background: ${themeColors.primary};
          border-color: ${themeColors.primary};
        }
        
        .ant-btn-primary:hover {
          background: ${themeColors.primary}dd;
          border-color: ${themeColors.primary};
        }
        
        /* Table styling */
        .ant-table {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
        }
        
        .ant-table-thead > tr > th {
          background: ${themeColors.primary} !important;
          color: #fff !important;
        }
        
        .ant-table-tbody > tr > td {
          color: ${themeColors.text};
          border-bottom: 1px solid ${themeColors.primary}33;
        }
        
        /* Modal styling */
        .ant-modal-content, 
        .ant-modal-header {
          background: ${themeColors.cardBg};
          color: ${themeColors.text};
        }
        
        .ant-modal-title {
          color: ${themeColors.text};
        }
        
        .ant-modal-close {
          color: ${themeColors.text};
        }
        
        /* Chart container */
        .chart-container {
          height: 400px;
          width: 100%;
          background: ${themeColors.cardBg};
        }
        
        /* Spin component */
        .ant-spin-text {
          color: ${themeColors.primary};
        }
        
        /* Override default Ant Design mobile styles */
        @media (max-width: 576px) {
          .ant-layout-content {
            margin: 64px 0 0 0 !important;
            padding: 0 !important;
            width: 100vw !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default AdminAnalytics;