import  { useState, useEffect, useMemo, useContext } from 'react';
import { Card, Typography, Rate, Select, Row, Col, Spin, Alert, Tag, Button, Pagination, Statistic } from 'antd';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { getFeedbackForLecturer } from '../../services/api';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const { Title, Text } = Typography;
const { Option } = Select;

const useStyles = (themeColors) => ({
  container: css`
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
    background: ${themeColors.background};
  `,
  filterBar: css`
    margin-bottom: 24px;
    gap: 12px;
    .ant-select {
      width: 100%;
    }
  `,
  resetButton: css`
    margin-left: 12px;
  `,
  feedbackCard: css`
    margin-bottom: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: opacity 0.3s ease, transform 0.3s ease;
    opacity: 1;
    transform: translateY(0);
    background: ${themeColors.cardBg};
  `,
  chartCard: css`
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    background: ${themeColors.cardBg};
    .chart-container {
      height: 400px;
      position: relative;
    }
  `,
  emptyText: css`
    text-align: center;
    padding: 24px;
    color: ${themeColors.text}80;
  `,
  gridContainer: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  `,
  pagination: css`
    text-align: center;
    margin-top: 24px;
  `,
  summaryCard: css`
    margin-bottom: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    .ant-statistic {
      &-title {
        font-size: 14px;
        color: #fff;
      }
      &-content {
        font-size: 20px;
        color: #fff;
      }
    }
  `,
  backButton: css`
    margin-bottom: 24px;
  `,
});

const LecturerFeedbackView = () => {
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    unit: null,
    rating: null,
    clarity: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const styles = useStyles(themeColors);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const data = await getFeedbackForLecturer();
        setFeedback(data || []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  const filteredFeedback = useMemo(() => {
    return feedback.filter((item) => {
      const matchesUnit = !filters.unit || (item.unit?.code === filters.unit);
      const matchesRating = !filters.rating || (item.rating === filters.rating);
      const matchesClarity = filters.clarity === null || (item.clarity === filters.clarity);
      return matchesUnit && matchesRating && matchesClarity;
    });
  }, [feedback, filters]);

  const unitOptions = useMemo(() => {
    const units = feedback.map((item) => item.unit?.code).filter(Boolean);
    return [...new Set(units)];
  }, [feedback]);

  const resetFilters = () => {
    setFilters({
      unit: null,
      rating: null,
      clarity: null,
    });
    setCurrentPage(1);
  };

  const paginatedFeedback = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredFeedback.slice(startIndex, endIndex);
  }, [filteredFeedback, currentPage, pageSize]);

  const summaryMetrics = useMemo(() => {
    const totalFeedback = filteredFeedback.length;
    const averageRating =
      filteredFeedback.reduce((sum, item) => sum + (item.rating || 0), 0) / totalFeedback || 0;
    const clarityYes = filteredFeedback.filter((item) => item.clarity).length;
    const clarityNo = totalFeedback - clarityYes;
    const averagePace =
      filteredFeedback.reduce((sum, item) => sum + (item.pace || 0), 0) / totalFeedback || 0;
    const averageInteractivity =
      filteredFeedback.reduce((sum, item) => sum + (item.interactivity || 0), 0) / totalFeedback || 0;

    return {
      totalFeedback,
      averageRating,
      clarityYes,
      clarityNo,
      averagePace,
      averageInteractivity,
    };
  }, [filteredFeedback]);

  const summaryCardGradients = {
    totalFeedback: isDarkMode
      ? 'linear-gradient(135deg, #5A4FCF, #A29BFE)'
      : 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
    averageRating: isDarkMode
      ? 'linear-gradient(135deg, #00A8B5, #81ECEC)'
      : 'linear-gradient(135deg, #00CEC9, #81ECEC)',
    clarityYes: isDarkMode
      ? 'linear-gradient(135deg, #D81E5B, #FAB1A0)'
      : 'linear-gradient(135deg, #FF7675, #FFB6C1)',
    clarityNo: isDarkMode
      ? 'linear-gradient(135deg, #2A9D8F, #56C596)'
      : 'linear-gradient(135deg, #34C759, #8EE4AF)',
    averagePace: isDarkMode
      ? 'linear-gradient(135deg, #F4A261, #E76F51)'
      : 'linear-gradient(135deg, #F4A261, #FF9F1C)',
  };

  const summaryCards = (
    <Row gutter={[16, 16]} className={styles.summaryCard}>
      <Col xs={24} sm={8}>
        <Card style={{ background: summaryCardGradients.totalFeedback }}>
          <Statistic title="Total Feedback" value={summaryMetrics.totalFeedback} precision={0} />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card style={{ background: summaryCardGradients.averageRating }}>
          <Statistic title="Average Rating" value={summaryMetrics.averageRating} precision={1} />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card style={{ background: summaryCardGradients.clarityYes }}>
          <Statistic title="Clarity (Yes)" value={summaryMetrics.clarityYes} precision={0} />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card style={{ background: summaryCardGradients.clarityNo }}>
          <Statistic title="Clarity (No)" value={summaryMetrics.clarityNo} precision={0} />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card style={{ background: summaryCardGradients.averagePace }}>
          <Statistic title="Average Pace" value={summaryMetrics.averagePace} precision={1} />
        </Card>
      </Col>
    </Row>
  );

  const unitRatingsData = useMemo(() => {
    const unitRatings = {};
    feedback.forEach((item) => {
      const unitCode = item.unit?.code;
      if (unitCode) {
        if (!unitRatings[unitCode]) {
          unitRatings[unitCode] = { total: 0, count: 0 };
        }
        unitRatings[unitCode].total += item.rating || 0;
        unitRatings[unitCode].count += 1;
      }
    });

    const labels = Object.keys(unitRatings);
    const data = labels.map((unitCode) => {
      const averageRating = unitRatings[unitCode].total / unitRatings[unitCode].count;
      return averageRating.toFixed(2);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Average Rating',
          data,
          backgroundColor: themeColors.secondary,
          borderColor: themeColors.secondary,
          borderWidth: 1,
        },
      ],
    };
  }, [feedback, themeColors]);

  const clarityData = useMemo(() => {
    const clarityYes = filteredFeedback.filter((item) => item.clarity).length;
    const clarityNo = filteredFeedback.length - clarityYes;

    return {
      labels: ['Clear', 'Unclear'],
      datasets: [
        {
          label: 'Clarity Distribution',
          data: [clarityYes, clarityNo],
          backgroundColor: [themeColors.secondary, themeColors.accent],
          borderColor: [themeColors.secondary, themeColors.accent],
          borderWidth: 1,
        },
      ],
    };
  }, [filteredFeedback, themeColors]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: themeColors.text } },
      tooltip: { backgroundColor: `${themeColors.text}CC`, titleColor: '#fff', bodyColor: '#fff' },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: themeColors.text },
        grid: { color: `${themeColors.text}20` },
      },
      x: {
        ticks: { color: themeColors.text },
        grid: { display: false },
      },
    },
  };

  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to Load Data"
        description={error}
        showIcon
        style={{ margin: 24 }}
      />
    );
  }

  return (
    <div className={styles.container}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Link to="/lecturer-dashboard">
            <Button
              type="primary"
              className={styles.backButton}
              style={{ background: themeColors.primary, borderColor: themeColors.primary }}
            >
              Back to Lecturer Dashboard
            </Button>
          </Link>
        </Col>
        <Col>
          <ThemeToggle />
        </Col>
      </Row>

      <Title level={2} style={{ color: themeColors.text }}>Session Feedback Analytics</Title>

      {summaryCards}

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card className={styles.chartCard}>
            <Title level={4} style={{ marginBottom: 16, color: themeColors.text }}>Average Ratings by Unit</Title>
            <div className="chart-container">
              <Bar data={unitRatingsData} options={chartOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card className={styles.chartCard}>
            <Title level={4} style={{ marginBottom: 16, color: themeColors.text }}>Clarity Distribution</Title>
            <div className="chart-container">
              <Pie data={clarityData} options={chartOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className={styles.filterBar}>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            placeholder="Filter by Unit"
            value={filters.unit}
            onChange={(value) => setFilters((prev) => ({ ...prev, unit: value }))}
          >
            {unitOptions.map((unit) => (
              <Option key={unit} value={unit}>{unit}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            placeholder="Filter by Rating"
            value={filters.rating}
            onChange={(value) => setFilters((prev) => ({ ...prev, rating: value }))}
          >
            {[1, 2, 3, 4, 5].map((rating) => (
              <Option key={rating} value={rating}>
                {rating} Star{rating > 1 ? 's' : ''}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            placeholder="Filter by Clarity"
            value={filters.clarity}
            onChange={(value) => setFilters((prev) => ({ ...prev, clarity: value }))}
          >
            <Option value={true}>Clear</Option>
            <Option value={false}>Unclear</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Button
            type="default"
            onClick={resetFilters}
            className={styles.resetButton}
            style={{ color: themeColors.primary, borderColor: themeColors.primary }}
          >
            Reset Filters
          </Button>
        </Col>
      </Row>

      <Spin spinning={loading} tip="Loading feedback..." size="large">
        {filteredFeedback.length > 0 ? (
          <>
            <div className={styles.gridContainer}>
              {paginatedFeedback.map((item) => (
                <Card key={item._id} className={styles.feedbackCard}>
                  <div className={styles.feedbackHeader}>
                    <Text strong style={{ color: themeColors.text }}>{item.unit?.name || 'Unnamed Unit'}</Text>
                    <Tag color={themeColors.primary} className={styles.ratingTag}>
                      {item.unit?.code || 'N/A'}
                    </Tag>
                  </div>
                  <div className={styles.feedbackSection}>
                    <Text strong style={{ color: themeColors.text }}>Course: </Text>
                    <Text style={{ color: themeColors.text }}>{item.course?.name || 'N/A'}</Text>
                  </div>
                  <div className={styles.feedbackSection}>
                    <Text strong style={{ color: themeColors.text }}>Student: </Text>
                    <Text style={{ color: themeColors.text }}>{item.studentId?.name || 'Anonymous'}</Text>
                  </div>
                  <div className={styles.feedbackSection}>
                    <Text strong style={{ color: themeColors.text }}>Rating: </Text>
                    <Rate disabled value={item.rating || 0} />
                    <Text type="secondary" style={{ color: themeColors.text, marginLeft: 8 }}>
                      ({item.rating || 0} Stars)
                    </Text>
                  </div>
                  <div className={styles.feedbackSection}>
                    <Text strong style={{ color: themeColors.text }}>Comments: </Text>
                    <Text style={{ color: themeColors.text }}>{item.feedbackText || 'No comments provided.'}</Text>
                  </div>
                  <div className={styles.feedbackSection}>
                    <Text strong style={{ color: themeColors.text }}>Pace: </Text>
                    <Text style={{ color: themeColors.text }}>{item.pace || 'N/A'}</Text>
                  </div>
                  <div className={styles.feedbackSection}>
                    <Text strong style={{ color: themeColors.text }}>Interactivity: </Text>
                    <Rate disabled value={item.interactivity || 0} />
                  </div>
                  <div className={styles.feedbackSection}>
                    <Text strong style={{ color: themeColors.text }}>Clarity: </Text>
                    <Tag color={item.clarity ? themeColors.secondary : themeColors.accent}>
                      {item.clarity ? 'Clear' : 'Unclear'}
                    </Tag>
                  </div>
                  <div className={styles.feedbackSection}>
                    <Text strong style={{ color: themeColors.text }}>Resources: </Text>
                    <Text style={{ color: themeColors.text }}>{item.resources || 'None'}</Text>
                  </div>
                </Card>
              ))}
            </div>
            <div className={styles.pagination}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredFeedback.length}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                showSizeChanger
                pageSizeOptions={['6', '12', '24', '48']}
                style={{ color: themeColors.text }}
              />
            </div>
          </>
        ) : (
          <div className={styles.emptyText}>No feedback available</div>
        )}
      </Spin>

      <style>{`
        .ant-select-selector {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
          border-color: ${themeColors.primary} !important;
        }
        .ant-select-dropdown {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
        }
        .ant-select-item-option-content {
          color: ${themeColors.text} !important;
        }
        .ant-btn-primary:hover, .ant-btn-primary:focus {
          background: ${isDarkMode ? '#8E86E5' : '#5A4FCF'} !important;
          border-color: ${isDarkMode ? '#8E86E5' : '#5A4FCF'} !important;
        }
        .ant-btn-default:hover, .ant-btn-default:focus {
          color: ${themeColors.primary} !important;
          border-color: ${themeColors.primary} !important;
        }
        .ant-pagination-item, .ant-pagination-prev, .ant-pagination-next {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
        }
        .ant-pagination-item-active {
          background: ${themeColors.primary} !important;
          border-color: ${themeColors.primary} !important;
        }
        .ant-pagination-item-active a {
          color: #fff !important;
        }
      `}</style>
    </div>
  );
};

export default LecturerFeedbackView;