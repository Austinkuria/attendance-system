import { useState, useEffect, useMemo } from 'react';
import { Card, Table, Typography, Grid, Spin, Alert, Select, Input, DatePicker, Row, Col, Statistic } from 'antd';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { getFeedbackSummary } from '../../services/api';
import { css } from '@emotion/css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// Styled components
const useStyles = () => ({
  container: css`
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  `,
  filterBar: css`
    margin-bottom: 24px;
    gap: 12px;
    .ant-select, .ant-picker, .ant-input {
      width: 100%;
    }
  `,
  chartCard: css`
    margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    .chart-container {
      height: 400px;
      position: relative;
    }
  `,
  statsCard: css`
    margin-bottom: 24px;
    .ant-statistic {
      &-title {
        font-size: 14px;
      }
      &-content {
        font-size: 20px;
      }
    }
  `,
  dataTable: css`
    .muted {
      color: #999;
    }
  `,
  errorAlert: css`
    margin: 24px;
  `,
});

const AdminFeedbackView = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    course: null,
    unit: null,
    dateRange: null,
    search: ''
  });
  const screens = useBreakpoint();
  const styles = useStyles();

  // Fetch feedback summary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getFeedbackSummary();
        setSummary(data || []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Extract filter options from data
  const filterOptions = useMemo(() => ({
    courses: [...new Set(summary.map(item => item.course || 'N/A'))],
    units: [...new Set(summary.map(item => item.unit || 'N/A'))]
  }), [summary]);

  // Filtered data calculation
  const filteredData = useMemo(() => 
    summary.filter(item => {
      const matchesCourse = !filters.course || (item.course || 'N/A') === filters.course;
      const matchesUnit = !filters.unit || (item.unit || 'N/A') === filters.unit;
      const matchesSearch = item.sessionId.toLowerCase().includes(filters.search.toLowerCase());
      
      // Date filtering (assuming item has sessionDate)
      const sessionDate = new Date(item.sessionDate);
      const [start, end] = filters.dateRange || [null, null];
      const matchesDate = !start || !end || 
        (sessionDate >= start.startOf('day') && sessionDate <= end.endOf('day'));
      
      return matchesCourse && matchesUnit && matchesSearch && matchesDate;
    }),
  [summary, filters]);

  // Key metrics calculation
  const metrics = useMemo(() => ({
    totalSessions: filteredData.length,
    avgRating: filteredData.reduce((sum, item) => sum + (item.averageRating || 0), 0) / filteredData.length || 0,
    totalFeedback: filteredData.reduce((sum, item) => sum + (item.totalFeedback || 0), 0)
  }), [filteredData]);

  // Chart configuration
  const chartData = {
    labels: filteredData.map(s => `${s.unit || 'N/A'} • ${s.course || 'N/A'}`),
    datasets: [
      {
        label: 'Rating',
        data: filteredData.map(s => s.averageRating || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        stack: 'metrics'
      },
      {
        label: 'Interactivity',
        data: filteredData.map(s => s.averageInteractivity || 0),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        stack: 'metrics'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: screens.xs ? 'bottom' : 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { stacked: true, ticks: { maxRotation: 45 } },
      y: { stacked: true, beginAtZero: true }
    }
  };

  // Table columns
  const tableColumns = [
    { title: 'Session ID', dataIndex: 'sessionId', key: 'sessionId', fixed: 'left' },
    { 
      title: 'Unit', 
      dataIndex: 'unit', 
      key: 'unit',
      render: (unit) => unit || <span className="muted">N/A</span>
    },
    { 
      title: 'Course', 
      dataIndex: 'course', 
      key: 'course',
      render: (course) => course || <span className="muted">N/A</span>
    },
    { 
      title: 'Avg Rating', 
      dataIndex: 'averageRating', 
      key: 'averageRating',
      render: (value) => value?.toFixed(2) || <span className="muted">N/A</span>
    },
    { 
      title: 'Avg Pace', 
      dataIndex: 'averagePace', 
      key: 'averagePace',
      render: (value) => value?.toFixed(2) || <span className="muted">N/A</span>
    },
    { 
      title: 'Avg Interactivity', 
      dataIndex: 'averageInteractivity', 
      key: 'averageInteractivity',
      render: (value) => value?.toFixed(2) || <span className="muted">N/A</span>
    },
    { 
      title: 'Clarity (Yes)', 
      dataIndex: 'clarityYes', 
      key: 'clarityYes',
      sorter: (a, b) => a.clarityYes - b.clarityYes
    },
    { 
      title: 'Total Feedback', 
      dataIndex: 'totalFeedback', 
      key: 'totalFeedback',
      sorter: (a, b) => a.totalFeedback - b.totalFeedback
    },
  ];

  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to Load Data"
        description={error}
        showIcon
        className={styles.errorAlert}
      />
    );
  }

  return (
    <div className={styles.container}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <FilterOutlined /> Feedback Analytics Dashboard
      </Title>

      {/* Filter Controls */}
      <Row gutter={[16, 16]} className={styles.filterBar}>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            placeholder="Filter by Course"
            options={filterOptions.courses.map(c => ({ value: c, label: c }))}
            onChange={v => setFilters(p => ({ ...p, course: v }))}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            placeholder="Filter by Unit"
            options={filterOptions.units.map(u => ({ value: u, label: u }))}
            onChange={v => setFilters(p => ({ ...p, unit: v }))}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <RangePicker
            placeholder={['Start Date', 'End Date']}
            onChange={dates => setFilters(p => ({ ...p, dateRange: dates }))}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="Search sessions..."
            suffix={<SearchOutlined />}
            onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          />
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} className={styles.statsCard}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={metrics.totalSessions}
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Avg Rating"
              value={metrics.avgRating}
              precision={1}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Feedback"
              value={metrics.totalFeedback}
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card className={styles.chartCard}>
        <div className="chart-container">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </Card>

      {/* Data Table */}
      <Spin spinning={loading} tip="Loading..." size="large">
        <Table
          columns={tableColumns}
          dataSource={filteredData}
          rowKey="sessionId"
          scroll={{ x: true }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Showing ${total} entries`,
            hideOnSinglePage: true
          }}
          className={styles.dataTable}
          bordered
        />
      </Spin>
    </div>
  );
};

export default AdminFeedbackView;