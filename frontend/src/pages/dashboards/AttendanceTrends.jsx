import { useState, useEffect, useCallback } from 'react';
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
import { Layout, Button, Card, Space, theme, Typography, Spin, Select, DatePicker, Switch, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons'; // Changed to LeftOutlined if preferred
import moment from 'moment';
import 'antd/dist/reset.css';
import zoomPlugin from 'chartjs-plugin-zoom';

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
    maxWidth: '1600px',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    boxSizing: 'border-box',
  },
  chartContainer: {
    width: '100%',
    height: '500px',
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
  responsiveOverrides: `
    @media (max-width: 1600px) { 
      .ant-layout-content { max-width: 90vw; } 
    }
    @media (max-width: 1200px) { 
      .ant-layout-content { max-width: 95vw; padding: 16px; } 
      .chart-container { height: 400px; } 
    }
    @media (max-width: 768px) { 
      .ant-layout-content { max-width: 100vw; padding: 12px; } 
      .controls { max-width: 100%; flex-direction: column; align-items: stretch; } 
      .chart-container { height: 350px; } 
      .ant-typography { font-size: 18px; }
      .header-space { padding: 0 8px; }
    }
    @media (max-width: 480px) { 
      .chart-container { height: 250px; } 
      .ant-btn { font-size: 14px; padding: 4px 8px; height: 48px; }
      .ant-select, .ant-picker { width: 100% !important; } 
      .ant-typography { font-size: 16px; }
      .header-space { padding: 0 4px; }
    }
  `,
};

const AttendanceTrends = () => {
  const { token: { colorBgContainer } } = theme.useToken();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('30days');
  const [dateRange, setDateRange] = useState(null);
  const [chartType, setChartType] = useState('line');
  const navigate = useNavigate();

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
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
    ];

    return {
      labels,
      datasets: [{
        label: `${filter === '30days' ? 'Daily (Last 30 Days)' : filter === 'daily' ? 'Daily' : 'Weekly'} Attendance (%)`,
        data: dataPoints,
        borderColor: chartType === 'line' ? '#1890ff' : barColors.map((color, index) => barColors[index % barColors.length]),
        backgroundColor: chartType === 'line' ? 'rgba(24, 144, 255, 0.2)' : barColors.map((color, index) => barColors[index % barColors.length]),
        borderWidth: chartType === 'line' ? 2 : 1,
        fill: chartType === 'line',
        tension: chartType === 'line' ? 0.3 : 0,
        barThickness: chartType === 'bar' ? 20 : undefined,
      }],
    };
  }, [attendanceData, filter, dateRange, chartType]);

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
      legend: { position: 'top' },
      title: {
        display: true,
        text: `Attendance Trend (${filter === '30days' ? 'Last 30 Days' : filter === 'daily' ? 'Daily' : 'Weekly'}${dateRange ? ` from ${dateRange[0]?.format('MMM D, YYYY')} to ${dateRange[1]?.format('MMM D, YYYY')}` : ''})`,
        font: { size: 16 },
        color: '#1890ff',
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
          color: '#FF5733',
          font: { size: 14 },
        },
      },
      x: {
        title: {
          display: true,
          text: getXAxisLabel(),
          color: '#28A745',
          font: { size: 14 },
        },
        ticks: { maxRotation: 45, minRotation: 0, font: { size: 12 } },
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

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header style={{ ...styles.header, background: colorBgContainer }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/student-dashboard')}
        >
          Dashboard
        </Button>
        <AntTitle level={3} style={{ margin: 0, textAlign: 'center', flexGrow: 1 }}>
          Attendance Trends
        </AntTitle>
        <div style={{ width: 64 }} /> {/* Spacer for symmetry */}
      </Header>

      <Content style={styles.content} className="ant-layout-content">
        <style>{styles.responsiveOverrides}</style>
        <Spin spinning={loading} tip="Loading data...">
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space style={styles.controls} className="controls">
              <Select
                value={filter}
                onChange={handleFilterChange}
                style={{ minWidth: '150px', width: '100%' }}
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
                style={{ minWidth: '200px', width: '100%' }}
                disabled={filter === 'weekly'}
              />
              <Switch
                checked={chartType === 'bar'}
                onChange={handleChartTypeChange}
                checkedChildren="Bar"
                unCheckedChildren="Line"
              />
            </Space>
            <Card style={{ marginTop: 16, borderRadius: 10, width: '100%', overflow: 'hidden' }}>
              <div style={styles.chartContainer} className="chart-container">
                {chartType === 'line' ? (
                  <Line data={getTrendData()} options={trendOptions} />
                ) : (
                  <Bar data={getTrendData()} options={trendOptions} />
                )}
              </div>
            </Card>
          </Space>
        </Spin>
      </Content>
    </Layout>
  );
};

export default AttendanceTrends;