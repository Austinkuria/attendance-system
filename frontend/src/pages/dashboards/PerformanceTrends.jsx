import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, getStudentAttendanceByFilter } from '../../services/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Layout, Button, Card, Space, theme, Typography, Spin, Select, DatePicker, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import moment from 'moment';
import 'antd/dist/reset.css';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const { Header, Content } = Layout;
const { Title: AntTitle } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const styles = {
  content: {
    marginTop: 64,
    padding: '24px',
    minHeight: 'calc(100vh - 64px)',
    overflow: 'auto',
    maxWidth: '1600px',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    boxSizing: 'border-box',
  },
  chartContainer: {
    height: '500px',
    width: '100%',
  },
  controls: {
    width: '100%',
    maxWidth: '600px',
    marginBottom: '16px',
  },
  responsiveOverrides: `
    @media (max-width: 1600px) { .ant-layout-content { max-width: 90vw; } }
    @media (max-width: 1200px) { .ant-layout-content { max-width: 95vw; padding: 16px; } .chart-container { height: 400px; } }
    @media (max-width: 768px) { .ant-layout-content { max-width: 100vw; padding: 12px; } .controls { max-width: 100%; flex-direction: column; align-items: stretch; } .chart-container { height: 300px; } }
    @media (max-width: 480px) { .chart-container { height: 250px; } }
  `,
};

const PerformanceTrends = () => {
  const { token: { colorBgContainer } } = theme.useToken();
  const [attendanceData, setAttendanceData] = useState([]); // Flat array
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('30days');
  const [dateRange, setDateRange] = useState(null);
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
        console.log('Raw API response:', attendanceRes);

        // Fully flatten the nested events structure
        const normalizedEvents = attendanceRes.events.flatMap(item => {
          if (filter === 'weekly') {
            return item.events.map(event => ({
              ...event,
              week: item.week,
              date: moment(event.startTime).format('YYYY-MM-DD'), // Add date for consistency
            }));
          } else {
            return item.events.map(event => ({
              ...event,
              date: item.date || moment(event.startTime).format('YYYY-MM-DD'),
            }));
          }
        });
        console.log('Normalized events:', normalizedEvents);
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

    console.log('Filter:', filter);
    console.log('Date Range:', dateRange ? dateRange.map(d => d.format('YYYY-MM-DD')) : 'None');
    console.log('Attendance Data:', attendanceData);

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
        const rate = total ? (present / total) * 100 : 0;
        console.log(`Date: ${date}, Total: ${total}, Present: ${present}, Rate: ${rate}%`);
        return rate;
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
      dataPoints = Object.values(dailyEvents).map(day => {
        const rate = day.total ? (day.present / day.total) * 100 : 0;
        console.log(`Daily - Date: ${labels[dataPoints.length]}, Total: ${day.total}, Present: ${day.present}, Rate: ${rate}%`);
        return rate;
      });
    } else if (filter === 'weekly') {
      const weeklyEvents = {};
      attendanceData.forEach(event => {
        const weekLabel = event.week || moment(event.startTime).startOf('week').format('MMM D - MMM D, YYYY');
        if (!weeklyEvents[weekLabel]) weeklyEvents[weekLabel] = { present: 0, total: 0 };
        weeklyEvents[weekLabel].total += 1;
        if (event.status === 'Present') weeklyEvents[weekLabel].present += 1;
      });
      labels = Object.keys(weeklyEvents).sort();
      dataPoints = Object.values(weeklyEvents).map(week => {
        const rate = week.total ? (week.present / week.total) * 100 : 0;
        console.log(`Weekly - Week: ${labels[dataPoints.length]}, Total: ${week.total}, Present: ${week.present}, Rate: ${rate}%`);
        return rate;
      });
    }

    return {
      labels,
      datasets: [{
        label: `${filter === '30days' ? 'Daily (Last 30 Days)' : filter === 'daily' ? 'Daily' : 'Weekly'} Attendance (%)`,
        data: dataPoints,
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        fill: true,
      }],
    };
  }, [attendanceData, filter, dateRange]);

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { 
        display: true, 
        text: `Attendance Trend (${filter === '30days' ? 'Last 30 Days' : filter === 'daily' ? 'Daily' : 'Weekly'}${dateRange ? ` from ${dateRange[0]?.format('MMM D, YYYY')} to ${dateRange[1]?.format('MMM D, YYYY')}` : ''})`
      },
      tooltip: { callbacks: { label: (context) => `${context.raw.toFixed(2)}%` } },
    },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Rate (%)' } },
      x: { ticks: { maxRotation: 45, minRotation: 0 } },
    },
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    if (value === '30days') {
      setDateRange(null);
    }
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    if (!filter.includes('daily')) {
      setFilter('daily');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header style={{ padding: '0 16px', background: colorBgContainer, position: 'fixed', width: '100%', zIndex: 10 }}>
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/student/dashboard')}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <AntTitle level={3} style={{ display: 'inline', margin: 0 }}>Performance Trends</AntTitle>
        </Space>
      </Header>

      <Content style={styles.content} className="ant-layout-content">
        <style>{styles.responsiveOverrides}</style>
        <Spin spinning={loading} tip="Loading data...">
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space style={styles.controls} className="controls">
              <Select
                value={filter}
                onChange={handleFilterChange}
                style={{ width: '200px' }}
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
                style={{ width: '300px' }}
                disabled={filter === 'weekly'}
              />
            </Space>
            <Card style={{ marginTop: 16, borderRadius: 10, width: '100%' }}>
              <div style={styles.chartContainer} className="chart-container">
                <Line data={getTrendData()} options={trendOptions} />
              </div>
            </Card>
          </Space>
        </Spin>
      </Content>
    </Layout>
  );
};

export default PerformanceTrends;