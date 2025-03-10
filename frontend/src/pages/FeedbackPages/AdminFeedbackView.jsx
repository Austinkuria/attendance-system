import { useState, useEffect, useMemo, useContext } from 'react';
import { 
  Layout,
  Card,
  Table,
  Typography,
  Grid,
  Spin,
  Alert,
  Select,
  Input,
  DatePicker,
  Row,
  Col,
  Statistic,
  Button,
  Switch,
  Space // Added Space import
} from 'antd';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { 
  FilterOutlined,
  SearchOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { getFeedbackSummary } from '../../services/api';
import { css } from '@emotion/css';
import { ThemeContext } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const { Header } = Layout;
const { Title: AntTitle } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const useStyles = (themeColors) => ({
  container: css`
    padding: 16px;
    max-width: 1600px;
    margin: 0 auto;
    background: ${themeColors.background};
    min-height: 100vh;
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
    background: ${themeColors.cardBg};
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
        color: ${themeColors.text};
        @media (max-width: 768px) {
          font-size: 12px;
        }
      }
      &-content {
        font-size: 20px;
        color: ${themeColors.text};
        @media (max-width: 768px) {
          font-size: 16px;
        }
      }
    }
  `,
  dataTable: css`
    .muted {
      color: ${themeColors.text}80;
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
    color: ${themeColors.text};
    @media (max-width: 768px) {
      font-size: 20px;
      margin-bottom: 8px;
    }
  `,
});

const AdminFeedbackView = () => {
  const { themeColors, isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
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
  const styles = useStyles(themeColors);

  const summaryCardColors = {
    totalSessions: themeColors.summaryTotalSessions || themeColors.primary,
    avgRating: themeColors.summaryAvgRating || themeColors.accent,
    totalFeedback: themeColors.summaryTotalFeedback || themeColors.secondary,
  };

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
        backgroundColor: themeColors.primary,
        stack: 'metrics'
      },
      {
        label: 'Interactivity',
        data: filteredData.map(s => s.averageInteractivity || 0),
        backgroundColor: themeColors.secondary,
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
        labels: { font: { size: screens.xs ? 12 : 14 }, color: themeColors.text }
      },
      tooltip: {
        bodyFont: { size: screens.xs ? 12 : 14 },
        titleFont: { size: screens.xs ? 14 : 16 },
        mode: 'index',
        intersect: false,
        backgroundColor: isDarkMode ? '#333' : `${themeColors.text}CC`,
        titleColor: '#fff',
        bodyColor: '#fff'
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          callback: function (value) {
            return this.getLabelForValue(value);
          },
          font: { size: screens.xs ? 10 : 12 },
          color: themeColors.text,
          autoSkip: true,
          maxRotation: screens.xs ? 45 : 0,
          minRotation: screens.xs ? 45 : 0
        },
        grid: { display: false }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          font: { size: screens.xs ? 10 : 12 },
          color: themeColors.text,
          precision: 1
        },
        grid: { color: `${themeColors.text}20` }
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
        style={{
          background: isDarkMode ? '#8B0000' : '#ffcccc',
          color: '#fff',
          borderColor: isDarkMode ? '#ff4500' : '#ff0000'
        }}
      />
    );
  }

  return (
    <div style={{ borderBottom: `1px solid ${themeColors.primary}20`, padding:'10' }}>
      <Header
        style={{
          padding: '0 16px',
          background: isDarkMode ? '#1F2527' : 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          position: 'fixed',
          width: '100%',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${themeColors.primary}20`,
        }}
      >
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin')}
            style={{
              fontSize: '18px',
              width: 64,
              height: 64,
              color: themeColors.primary,
              transition: 'all 0.3s',
            }}
            ghost
          />
        </Space>
        <AntTitle
          level={3}
          style={{
            margin: 0,
            flex: 1,
            textAlign: 'center',
            color: themeColors.primary,
            fontWeight: 600,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: window.innerWidth < 992 ? 'none' : 'block',
          }}
        >
          Feedback Analytics Dashboard
        </AntTitle>
        <AntTitle
          level={3}
          style={{
            margin: 0,
            color: themeColors.primary,
            fontWeight: 600,
            display: window.innerWidth >= 992 ? 'none' : 'inline',
          }}
        >
          Feedback Analytics Dashboard
        </AntTitle>
        <Space>
          <Switch
            checked={isDarkMode}
            onChange={() => setIsDarkMode(!isDarkMode)}
            checkedChildren="Dark"
            unCheckedChildren="Light"
            style={{ marginRight: 16 }}
          />
        </Space>
      </Header>

      {/* Add paddingTop to the filters row to avoid overlap with the fixed header */}
      <Row gutter={[16, 16]} className={styles.filterBar} style={{ paddingTop: 75 }}>
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
          <Card style={{ background: summaryCardColors.totalSessions, borderColor: summaryCardColors.totalSessions }}>
            <Statistic
              title="Total Sessions"
              value={metrics.totalSessions}
              precision={0}
              valueStyle={{ color: '#fff' }}
              titleStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ background: summaryCardColors.avgRating, borderColor: summaryCardColors.avgRating }}>
            <Statistic
              title="Avg Rating"
              value={metrics.avgRating}
              precision={1}
              valueStyle={{ color: '#fff' }}
              titleStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ background: summaryCardColors.totalFeedback, borderColor: summaryCardColors.totalFeedback }}>
            <Statistic
              title="Total Feedback"
              value={metrics.totalFeedback}
              precision={0}
              valueStyle={{ color: '#fff' }}
              titleStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className={styles.chartCard} style={{ borderColor: themeColors.primary }}>
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
                    ctx.fillStyle = themeColors.text;
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
          rowClassName={(_, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
        />
      </Spin>

      <style>{`
        .ant-select-selector, .ant-picker, .ant-input {
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
        .ant-table-tbody > tr:hover > td {
          background: ${themeColors.hoverBg ? themeColors.hoverBg : themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
        }
        .ant-table-tbody > tr > td:first-child {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
        }
        .table-row-light {
          background: ${themeColors.cardBg} !important;
        }
        .table-row-dark {
          background: ${themeColors.background} !important;
        }
        ::placeholder {
          color: ${themeColors.text}80 !important;
          opacity: 1 !important;
        }
        .ant-select-selection-placeholder,
        .ant-picker-input input::placeholder,
        .ant-input::placeholder {
          color: ${themeColors.text}80 !important;
        }
        .anticon, .ant-typography {
          color: ${themeColors.text} !important;
        }
        .ant-pagination-total-text,
        .ant-pagination-item,
        .ant-pagination-item-active,
        .ant-pagination-prev,
        .ant-pagination-next {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
        }
        .ant-input-affix-wrapper {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
        }
      `}</style>
    </div>
  );
};

export default AdminFeedbackView;