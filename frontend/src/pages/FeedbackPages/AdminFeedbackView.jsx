import  { useState, useEffect, useMemo } from 'react';
import { Card, Table, Typography, Grid, Spin, Alert, Select, Input, DatePicker, Row, Col, Statistic } from 'antd';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { getFeedbackSummary } from '../../services/api';
import { css } from '@emotion/css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
const { Title } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const useStyles = () => ({
  container: css`
    padding: 16px;
    max-width: 1600px;
    margin: 0 auto;
    @media (max-width: 768px) {
      padding: 8px;
    }
  `,
  filterBar: css`
    margin-bottom: 16px;
    gap: 8px;
    .ant-select, .ant-picker, .ant-input {
      width: 100%;
    }
    @media (max-width: 768px) {
      margin-bottom: 8px;
    }
  `,
  chartCard: css`
    margin-bottom: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    .chart-container {
      height: 400px;
      position: relative;
      @media (max-width: 768px) {
        height: 300px;
      }
    }
  `,
  statsCard: css`
    margin-bottom: 16px;
    .ant-statistic {
      &-title {
        font-size: 14px;
        @media (max-width: 768px) {
          font-size: 12px;
        }
      }
      &-content {
        font-size: 20px;
        @media (max-width: 768px) {
          font-size: 16px;
        }
      }
    }
  `,
  dataTable: css`
    .muted {
      color: #999;
    }
    @media (max-width: 768px) {
      .ant-table {
        font-size: 12px;
      }
    }
  `,
  errorAlert: css`
    margin: 16px;
    @media (max-width: 768px) {
      margin: 8px;
    }
  `,
  title: css`
    margin-bottom: 16px;
    font-size: 24px;
    @media (max-width: 768px) {
      font-size: 20px;
      margin-bottom: 8px;
    }
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

  const filterOptions = useMemo(() => ({
    courses: [...new Set(summary.map(item => item.course?.code || 'N/A'))],
    units: [...new Set(summary.map(item => item.unit?.code || 'N/A'))]
  }), [summary]);

  const filteredData = useMemo(() => 
    summary.filter(item => {
      const matchesCourse = !filters.course || (item.course?.code || 'N/A') === filters.course;
      const matchesUnit = !filters.unit || (item.unit?.code || 'N/A') === filters.unit;
      const matchesSearch = item.sessionId.toLowerCase().includes(filters.search.toLowerCase());
      const sessionDate = new Date(item.sessionDate);
      const [start, end] = filters.dateRange || [null, null];
      const matchesDate = !start || !end || 
        (sessionDate >= start.startOf('day') && sessionDate <= end.endOf('day'));
      
      return matchesCourse && matchesUnit && matchesSearch && matchesDate;
    }),
  [summary, filters]);

  const metrics = useMemo(() => ({
    totalSessions: filteredData.length,
    avgRating: filteredData.reduce((sum, item) => sum + (item.averageRating || 0), 0) / filteredData.length || 0,
    totalFeedback: filteredData.reduce((sum, item) => sum + (item.totalFeedback || 0), 0)
  }), [filteredData]);

  const chartData = {
    labels: filteredData.map(s => [s.unit?.code || 'N/A', s.course?.code || 'N/A']),
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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: screens.xs ? 'bottom' : 'top',
        labels: { font: { size: screens.xs ? 12 : 14 } }
      },
      tooltip: {
        bodyFont: { size: screens.xs ? 12 : 14 },
        titleFont: { size: screens.xs ? 14 : 16 },
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          callback: function(value) {
            return this.getLabelForValue(value);
          },
          font: { size: screens.xs ? 10 : 12 },
          color: '#666',
          autoSkip: false,
          maxRotation: screens.xs ? 45 : 0
        },
        grid: { display: false }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          font: { size: screens.xs ? 10 : 12 },
          precision: 1
        }
      }
    }
  };

  const tableColumns = [
    { title: 'Session ID', dataIndex: 'sessionId', key: 'sessionId', fixed: 'left' },
    { 
      title: 'Unit Code', 
      dataIndex: 'unit', 
      key: 'unit',
      render: (unit) => unit?.code || <span className="muted">N/A</span>
    },
    { 
      title: 'Course Code', 
      dataIndex: 'course', 
      key: 'course',
      render: (course) => course?.code || <span className="muted">N/A</span>
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
      <Title level={3} className={styles.title}>
        <FilterOutlined /> Feedback Analytics Dashboard
      </Title>

      <Row gutter={[16, 16]} className={styles.filterBar}>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            placeholder="Filter by Course Code"
            options={filterOptions.courses.map(c => ({ value: c, label: c }))}
            onChange={v => setFilters(p => ({ ...p, course: v }))}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            placeholder="Filter by Unit Code"
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

      <Card className={styles.chartCard}>
        <div className="chart-container">
          <Bar 
            data={chartData} 
            options={chartOptions}
            plugins={[{
              id: 'multiline-labels',
              beforeDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();
                const xAxis = chart.scales.x;
                xAxis.ticks.forEach((tick, index) => {
                  const label = chart.data.labels[index];
                  if (Array.isArray(label)) {
                    const x = tick.labelX;
                    const y = tick.labelY + 10;
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#666';
                    ctx.font = screens.xs ? '10px Arial' : '12px Arial';
                    label.forEach((line, i) => {
                      ctx.fillText(line, x, y + (i * 14));
                    });
                  }
                });
                ctx.restore();
              }
            }]}
          />
        </div>
      </Card>

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