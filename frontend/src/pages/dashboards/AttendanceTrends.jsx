import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, getStudentAttendanceByFilter } from '../../services/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Layout, Button, Card, Space, Typography, Spin, Select, DatePicker, Switch, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons'; // Changed to LeftOutlined if preferred
import moment from 'moment';
import 'antd/dist/reset.css';
import zoomPlugin from 'chartjs-plugin-zoom';
import { ThemeContext } from '../../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const { Header, Content } = Layout;
const { Title: AntTitle } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const styles = {
  content: {
    marginTop: 64,
    padding: '24px',
    minHeight: 'calc(100vh - 64px)',
    overflowY: 'auto',
    overflowX: 'hidden',  // Force no horizontal scroll
    maxWidth: '100%',
    width: '100%',
    boxSizing: 'border-box',
  },
  chartContainer: {
    width: '100%',
    height: '500px',
    overflowX: 'auto', // Enable horizontal scroll
    overflowY: 'hidden', // Prevent vertical scroll
  },
  controls: {
    width: '100%',
    maxWidth: '600px',
    marginBottom: '16px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  header: {
    padding: '0 16px',
    position: 'fixed',
    width: '100%',
    zIndex: 10,
    maxWidth: '100%',
    overflowX: 'hidden',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  layoutStyle: {
    minHeight: '100vh',
    padding: '0 12px', // Added horizontal padding
    margin: '0 auto',  // Center the layout
    display: 'flex',
    flexDirection: 'column',
    width: 'calc(100% - 24px)', // Account for padding
    maxWidth: '100%',
    overflowX: 'hidden', // Prevent horizontal scrolling
  },
  responsiveOverrides: `
    /* Global overflow control */
    html, body, #root, .ant-layout {
      overflow-x: hidden !important;
      max-width: 100vw !important;
      width: 100% !important;
      background: var(--bg-color) !important;
    }
    
    body {
      background: var(--bg-color) !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .ant-spin-text {
      color: var(--text-color) !important;
    }

    .ant-select-dropdown {
      background-color: var(--dropdown-bg) !important;
    }

    .ant-select-item {
      color: var(--text-color) !important;
    }

    .ant-select-item-option-active,
    .ant-select-item-option-selected {
      background-color: var(--hover-color) !important;
    }
    
    /* Stop any element from causing horizontal overflow */
    * {
      max-width: 100vw;
      box-sizing: border-box;
    }
    
    body, html {
      margin: 0;
      padding: 0;
      position: relative;
    }
    
    .ant-layout {
      width: calc(100% - 24px) !important;
      max-width: calc(100% - 24px) !important;
      overflow-x: hidden !important;
      padding: 0 12px !important;
      margin: 0 auto !important;
    }
    
    .ant-layout-content {
      overflow-x: hidden !important;
      max-width: 100% !important;
      width: 100% !important;
      padding: 16px !important;
      margin: 0 !important;
      margin-top: 64px !important;
    }
    
    .ant-card {
      max-width: 100% !important;
      width: 100% !important;
      overflow: hidden !important;
    }
    
    /* Responsive styles */
    @media (max-width: 1600px) { 
      .ant-layout { padding: 0 12px !important; }
      .ant-layout-content { padding: 16px !important; margin-top: 64px !important; } 
    }
    @media (max-width: 1200px) { 
      .ant-layout { padding: 0 10px !important; }
      .ant-layout-content { padding: 14px !important; margin-top: 64px !important; } 
      .chart-container { height: 400px; } 
    }
    @media (max-width: 768px) { 
      .ant-layout { padding: 0 8px !important; }
      .ant-layout-content { padding: 12px !important; margin-top: 64px !important; } 
      .controls { max-width: 100%; flex-direction: column; align-items: stretch; } 
      .chart-container { height: 350px; } 
      .ant-typography { font-size: 18px; }
      .header-space { padding: 0 8px; }
    }
    @media (max-width: 480px) { 
      .ant-layout { padding: 0 6px !important; }
      .ant-layout-content { padding: 10px !important; margin-top: 64px !important; } 
      .chart-container { height: 250px; } 
      .ant-btn { font-size: 14px; padding: 4px 8px; height: 48px; }
      .ant-select, .ant-picker { width: 100% !important; } 
      .ant-typography { font-size: 16px; }
      .header-space { padding: 0 4px; }
    }

    /* Dark mode Select styles */
    .ant-select-selector {
      color: var(--text-color) !important;
    }

    .ant-select-selection-placeholder {
      color: var(--text-color) !important;
      opacity: 0.65;
    }

    .ant-select-arrow {
      color: var(--text-color) !important;
    }

    /* Dark mode DatePicker styles */
    .ant-picker {
      background-color: var(--input-bg) !important;
    }

    .ant-picker-input > input {
      color: var(--text-color) !important;
    }

    .ant-picker-suffix,
    .ant-picker-clear {
      color: var(--text-color) !important;
    }

    .ant-picker-range-separator {
      color: var(--text-color) !important;
    }

    .ant-select-selection-item {
      color: var(--text-color) !important;
      background-color: var(--dropdown-bg) !important;
    }

    .ant-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
      background-color: var(--hover-color) !important;
      color: var(--text-color) !important;
    }

    /* Enhanced Select dark mode styles */
    .ant-select {
      background-color: var(--input-bg) !important;
      border-color: var(--calendar-border) !important;
    }

    .ant-select:not(.ant-select-disabled):hover .ant-select-selector {
      border-color: var(--hover-color) !important;
    }

    .ant-select-selector {
      background-color: var(--input-bg) !important;
      border-color: var(--calendar-border) !important;
    }

    .ant-select-dropdown {
      background-color: var(--dropdown-bg) !important;
      border: 1px solid var(--calendar-border) !important;
      box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.48) !important;
    }

    .ant-select-item {
      color: var(--text-color) !important;
      background: var(--dropdown-bg) !important;
    }

    .ant-select-item-option-active,
    .ant-select-item-option-selected {
      color: var(--text-color) !important;
      background-color: var(--hover-color) !important;
    }

    .ant-select-selection-item {
      color: var(--text-color) !important;
    }

    /* DatePicker separator icon in dark mode */
    .ant-picker-range-separator .ant-picker-separator {
      color: var(--text-color) !important;
    }

    .ant-picker-separator {
      color: var(--text-color) !important;
    }

    /* Make sure the separator icon is visible */
    .ant-picker-range .ant-picker-active-bar {
      background: var(--text-color) !important;
    }

    /* Enhanced DatePicker placeholder styles */
    .ant-picker-input > input::placeholder {
      color: var(--text-color) !important;
      opacity: 0.7 !important;
    }

    .ant-picker {
      color: var(--text-color) !important;
    }

    .ant-picker-input > input:-internal-autofill-selected {
      -webkit-text-fill-color: var(--text-color) !important;
      transition: background-color 5000s ease-in-out 0s;
    }

    /* Make placeholder text more visible in dark mode */
    .ant-picker:not(.ant-picker-disabled) input::-webkit-input-placeholder {
      color: var(--text-color) !important;
      opacity: 0.7 !important;
    }

    /* Switch component dark mode styles */
    .ant-switch {
      background-color: var(--disabled-color) !important;
    }

    .ant-switch.ant-switch-checked {
      background-color: var(--secondary-color) !important;
    }

    .ant-switch:not(.ant-switch-disabled):hover {
      background-color: var(--hover-color) !important;
    }

    .ant-switch .ant-switch-handle::before {
      background-color: var(--text-color) !important;
    }

    /* Dashboard navigation button hover styles */
    .dashboard-nav-btn:hover {
      background-color: var(--hover-color) !important;
      color: var(--text-color) !important;
      transition: all 0.3s ease;
    }

    /* Chart container responsive styles */
    .chart-container {
      min-width: 600px !important; // Minimum width to prevent squishing
      padding-bottom: 16px !important; // Space for scrollbar
    }

    .chart-wrapper {
      overflow-x: auto !important;
      overflow-y: hidden !important;
      margin-bottom: 16px !important;
      -webkit-overflow-scrolling: touch !important; // Smooth scroll on iOS
    }

    /* Hide scrollbar for Chrome, Safari and Opera */
    .chart-wrapper::-webkit-scrollbar {
      height: 8px;
    }

    /* Track */
    .chart-wrapper::-webkit-scrollbar-track {
      background: var(--calendar-border);
      border-radius: 4px;
    }

    /* Handle */
    .chart-wrapper::-webkit-scrollbar-thumb {
      background: var(--primary-color);
      border-radius: 4px;
    }

    /* Handle on hover */
    .chart-wrapper::-webkit-scrollbar-thumb:hover {
      background: var(--secondary-color);
    }
  `,
  // Force global styles
  globalStyles: `
    html, body, #root {
      overflow-x: hidden !important;
      width: 100% !important;
      max-width: 100% !important;
      position: relative;
    }
  `,
  calendarOverrides: `
    .ant-picker-panel {
      background-color: var(--calendar-bg) !important;
    }
    .ant-picker-panel-container {
      background-color: var(--calendar-bg) !important;
    }
    .ant-picker-content th,
    .ant-picker-content td {
      color: var(--calendar-text) !important;
    }
    .ant-picker-header {
      color: var(--calendar-text) !important;
      border-bottom: 1px solid var(--calendar-border) !important;
    }
    .ant-picker-header button {
      color: var(--calendar-text) !important;
    }
    .ant-picker-cell:hover .ant-picker-cell-inner {
      background: var(--calendar-hover) !important;
    }
    .ant-picker-cell-in-view {
      color: var(--calendar-text) !important;
    }
    .ant-picker-time-panel-column > li.ant-picker-time-panel-cell .ant-picker-time-panel-cell-inner {
      color: var(--calendar-text) !important;
    }
    .ant-picker-time-panel {
      background-color: var(--calendar-bg) !important;
    }
    .ant-picker-footer {
      border-top: 1px solid var(--calendar-border) !important;
      background-color: var(--calendar-bg) !important;
    }
  `,
};

const AttendanceTrends = () => {
  const { themeColors } = useContext(ThemeContext);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('30days');
  const [dateRange, setDateRange] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [debugMode, setDebugMode] = useState(false);
  const navigate = useNavigate();

  // Debug styles with colorful borders
  const debugStyles = {
    layout: debugMode ? { border: '3px solid red', boxSizing: 'border-box' } : {},
    header: debugMode ? { border: '3px dashed purple', boxSizing: 'border-box' } : {},
    content: debugMode ? { border: '3px solid blue', boxSizing: 'border-box' } : {},
    card: debugMode ? { border: '3px dashed green', boxSizing: 'border-box' } : {},
    controls: debugMode ? { border: '3px dotted orange', boxSizing: 'border-box' } : {},
    chartContainer: debugMode ? { border: '3px solid magenta', boxSizing: 'border-box' } : {},
    space: debugMode ? { border: '2px dashed cyan', boxSizing: 'border-box' } : {},
  };

  const fetchAttendanceData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const profileRes = await getUserProfile(token);
      if (profileRes._id) {
        const start = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : null;
        const end = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : null;
        const attendanceRes = await getStudentAttendanceByFilter(profileRes._id, filter, start, end);
        const normalizedEvents = attendanceRes.events.flatMap(item => {
          if (filter === 'weekly') {
            return item.events.map(event => ({
              ...event,
              week: item.week,
              date: moment(event.startTime).format('YYYY-MM-DD'),
            }));
          } else {
            return item.events.map(event => ({
              ...event,
              date: item.date || moment(event.startTime).format('YYYY-MM-DD'),
            }));
          }
        });
        setAttendanceData(normalizedEvents);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error(`Failed to load data: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [navigate, filter, dateRange]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  useEffect(() => {
    // Apply global style to prevent scroll and add calendar styles
    const style = document.createElement('style');
    style.innerHTML = `
      ${styles.globalStyles}
      ${styles.responsiveOverrides}
      :root {
        --bg-color: ${themeColors.background};
        --text-color: ${themeColors.text};
        --dropdown-bg: ${themeColors.cardBg};
        --hover-color: ${themeColors.hover};
        --calendar-bg: ${themeColors.cardBg};
        --calendar-text: ${themeColors.text};
        --calendar-border: ${themeColors.border};
        --calendar-hover: ${themeColors.hover};
        --input-bg: ${themeColors.inputBg};
        --primary-color: ${themeColors.primary};
        --disabled-color: ${themeColors.disabled};
        --secondary-color: ${themeColors.secondary};
      }
      ${styles.calendarOverrides}
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [themeColors]);

  const getTrendData = useCallback(() => {
    let labels = [];
    let dataPoints = [];

    if (filter === '30days' || (filter === 'daily' && dateRange)) {
      const startDate = dateRange && dateRange[0] ? dateRange[0] : moment().subtract(29, 'days');
      const endDate = dateRange && dateRange[1] ? dateRange[1] : moment();
      const days = [];
      for (let m = moment(startDate); m.isSameOrBefore(endDate); m.add(1, 'days')) {
        days.push(m.format('YYYY-MM-DD'));
      }
      labels = days.map(date => moment(date).format('MMM D'));
      dataPoints = days.map(date => {
        const dayRecords = attendanceData.filter(event =>
          moment(event.date).format('YYYY-MM-DD') === date
        );
        const total = dayRecords.length;
        const present = dayRecords.filter(event => event.status === 'Present').length;
        return total ? (present / total) * 100 : 0;
      });
    } else if (filter === 'daily') {
      const dailyEvents = {};
      attendanceData.forEach(event => {
        const dateStr = moment(event.date).format('YYYY-MM-DD');
        if (!dailyEvents[dateStr]) dailyEvents[dateStr] = { present: 0, total: 0 };
        dailyEvents[dateStr].total += 1;
        if (event.status === 'Present') dailyEvents[dateStr].present += 1;
      });
      labels = Object.keys(dailyEvents).sort().map(date => moment(date).format('MMM D'));
      dataPoints = Object.values(dailyEvents).map(day => day.total ? (day.present / day.total) * 100 : 0);
    } else if (filter === 'weekly') {
      const weeklyEvents = {};
      attendanceData.forEach(event => {
        const weekLabel = event.week || moment(event.startTime).startOf('week').format('MMM D - MMM D, YYYY');
        if (!weeklyEvents[weekLabel]) weeklyEvents[weekLabel] = { present: 0, total: 0 };
        weeklyEvents[weekLabel].total += 1;
        if (event.status === 'Present') weeklyEvents[weekLabel].present += 1;
      });
      labels = Object.keys(weeklyEvents).sort();
      dataPoints = Object.values(weeklyEvents).map(week => week.total ? (week.present / week.total) * 100 : 0);
    }

    const barColors = [
      `${themeColors.primary}99`,    // Primary with opacity
      `${themeColors.secondary}99`,  // Secondary with opacity
      `${themeColors.accent}99`,     // Accent with opacity
      `${themeColors.focus}99`,      // Focus with opacity
      `${themeColors.placeholder}99`, // Placeholder with opacity
      `${themeColors.disabled}99`,    // Disabled with opacity
    ];

    return {
      labels,
      datasets: [{
        label: `${filter === '30days' ? 'Daily (Last 30 Days)' : filter === 'daily' ? 'Daily' : 'Weekly'} Attendance (%)`,
        data: dataPoints,
        borderColor: chartType === 'line' ? themeColors.primary : barColors,
        backgroundColor: chartType === 'line' ? `${themeColors.primary}33` : barColors,
        borderWidth: chartType === 'line' ? 2 : 1,
        fill: chartType === 'line',
        tension: chartType === 'line' ? 0.3 : 0,
        barThickness: chartType === 'bar' ? 20 : undefined,
      }],
    };
  }, [attendanceData, filter, dateRange, chartType, themeColors]);

  const getXAxisLabel = useCallback(() => {
    switch (filter) {
      case '30days':
        return 'Date (Last 30 Days)';
      case 'daily':
        return 'Date';
      case 'weekly':
        return 'Week';
      default:
        return 'Time Period';
    }
  }, [filter]);

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: themeColors.text
        }
      },
      title: {
        display: true,
        text: `Attendance Trend (${filter === '30days' ? 'Last 30 Days' : filter === 'daily' ? 'Daily' : 'Weekly'}${dateRange ? ` from ${dateRange[0]?.format('MMM D, YYYY')} to ${dateRange[1]?.format('MMM D, YYYY')}` : ''})`,
        font: { size: 16 },
        color: themeColors.primary,
      },
      tooltip: { callbacks: { label: (context) => `${context.raw.toFixed(2)}%` } },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        },
        pan: {
          enabled: true,
          mode: 'x',
        },
        limits: {
          x: { min: 'original', max: 'original' },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Attendance Rate (%)',
          color: themeColors.accent,
          font: { size: 14 },
        },
        grid: {
          color: themeColors.border
        },
        ticks: {
          color: themeColors.text
        }
      },
      x: {
        title: {
          display: true,
          text: getXAxisLabel(),
          color: themeColors.secondary,
          font: { size: 14 },
        },
        grid: {
          color: themeColors.border
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: { size: 12 },
          color: themeColors.text
        }
      },
    },
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    if (value === '30days') setDateRange(null);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    if (!filter.includes('daily')) setFilter('daily');
  };

  const handleChartTypeChange = (checked) => {
    setChartType(checked ? 'bar' : 'line');
  };

  const handleToggleDebug = () => {
    setDebugMode(!debugMode);
  };

  return (
    <>
      <style>{styles.responsiveOverrides}</style>
      <Layout style={{
        ...styles.layoutStyle,
        background: themeColors.background,
        ...debugStyles.layout
      }}>
        <Header style={{
          ...styles.header,
          background: themeColors.cardBg,
          width: 'calc(100% - 24px)',
          maxWidth: 'calc(100% - 24px)',
          left: '12px',
          right: '12px',
          ...debugStyles.header
        }}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined style={{ color: themeColors.text }} />}
            onClick={() => navigate('/student-dashboard')}
            style={{ color: themeColors.text }}
            className="dashboard-nav-btn"
          >
            Dashboard
          </Button>
          <AntTitle level={3} style={{
            margin: 0,
            textAlign: 'center',
            flexGrow: 1,
            color: themeColors.text
          }}>
            Attendance Trends
          </AntTitle>
          <Button
            type="text"
            onClick={handleToggleDebug}
            size="small"
            style={{
              backgroundColor: debugMode ? themeColors.accent : themeColors.primary,
              color: themeColors.text
            }}
          >
            {debugMode ? 'Debug: ON' : 'Debug'}
          </Button>
        </Header>

        <Content style={{
          ...styles.content,
          margin: 0,
          marginTop: 64,
          padding: debugMode ? '10px' : '16px', // Added padding, conditional on debug mode
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          background: themeColors.background,
          ...debugStyles.content
        }} className="ant-layout-content">
          <Spin
            spinning={loading}
            tip="Loading data..."
            style={{ color: themeColors.text }}
          >
            <Space direction="vertical" size={debugMode ? 0 : 16} style={{
              width: '100%',
              maxWidth: '100%',
              margin: 0,
              padding: 0,
              overflowX: 'hidden',
              ...debugStyles.space
            }}>
              <Space style={{
                ...styles.controls,
                marginBottom: debugMode ? 0 : '16px', // Remove margin in debug mode
                ...debugStyles.controls
              }} className="controls">
                <Select
                  value={filter}
                  onChange={handleFilterChange}
                  style={{
                    minWidth: '150px',
                    width: '100%',
                  }}
                  dropdownStyle={{
                    backgroundColor: themeColors.cardBg,
                  }}
                  placeholder="Select Filter"
                >
                  <Option value="30days">Last 30 Days</Option>
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                </Select>
                <RangePicker
                  onChange={handleDateRangeChange}
                  value={dateRange}
                  format="YYYY-MM-DD"
                  style={{
                    minWidth: '200px',
                    width: '100%',
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.inputBorder,
                    color: themeColors.text
                  }}
                  popupStyle={{
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border
                  }}
                  disabled={filter === 'weekly'}
                />
                <Switch
                  checked={chartType === 'bar'}
                  onChange={handleChartTypeChange}
                  checkedChildren="Bar"
                  unCheckedChildren="Line"
                />
              </Space>
              <Card style={{
                marginTop: debugMode ? 0 : 16, // Remove margin in debug mode
                borderRadius: 10,
                width: '100%',
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
                ...debugStyles.card
              }}>
                <div className="chart-wrapper" style={{ width: '100%' }}>
                  <div style={{
                    ...styles.chartContainer,
                    ...debugStyles.chartContainer
                  }} className="chart-container">
                    {chartType === 'line' ? (
                      <Line data={getTrendData()} options={trendOptions} />
                    ) : (
                      <Bar data={getTrendData()} options={trendOptions} />
                    )}
                  </div>
                </div>
              </Card>
            </Space>
          </Spin>
        </Content>
      </Layout>
    </>
  );
};

export default AttendanceTrends;