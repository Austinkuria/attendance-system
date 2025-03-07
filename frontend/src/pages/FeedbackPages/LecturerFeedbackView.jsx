import React, { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Rate, Select, Row, Col, Spin, Alert, Tag, Button, Pagination, Statistic } from 'antd';
import { Bar, Pie, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, RadialLinearScale } from 'chart.js';
import { getFeedbackForLecturer } from '../../services/api';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom'; // For the back button

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, RadialLinearScale);

const { Title, Text } = Typography;
const { Option } = Select;

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
  `,
  chartCard: css`
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    .chart-container {
      height: 400px;
      position: relative;
    }
  `,
  emptyText: css`
    text-align: center;
    padding: 24px;
    color: #999;
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
    .ant-statistic {
      &-title {
        font-size: 14px;
      }
      &-content {
        font-size: 20px;
      }
    }
  `,
  backButton: css`
    margin-bottom: 24px;
  `,
});

const LecturerFeedbackView = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    unit: null,
    rating: null,
    clarity: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Cards per page
  const styles = useStyles();

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

  // Filtered feedback based on selected filters
  const filteredFeedback = useMemo(() => {
    return feedback.filter((item) => {
      const matchesUnit = !filters.unit || (item.unit?.code === filters.unit);
      const matchesRating = !filters.rating || (item.rating === filters.rating);
      const matchesClarity = filters.clarity === null || (item.clarity === filters.clarity);
      return matchesUnit && matchesRating && matchesClarity;
    });
  }, [feedback, filters]);

  // Extract unique units for filter dropdown
  const unitOptions = useMemo(() => {
    const units = feedback.map((item) => item.unit?.code).filter(Boolean);
    return [...new Set(units)];
  }, [feedback]);

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      unit: null,
      rating: null,
      clarity: null,
    });
    setCurrentPage(1); // Reset to the first page
  };

  // Paginated feedback
  const paginatedFeedback = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredFeedback.slice(startIndex, endIndex);
  }, [filteredFeedback, currentPage, pageSize]);

  // Summary metrics
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

  // Comprehensive chart data
  const comprehensiveChartData = {
    labels: ['Average Rating', 'Average Pace', 'Average Interactivity', 'Clarity (Yes)', 'Clarity (No)'],
    datasets: [
      {
        label: 'Feedback Metrics',
        data: [
          summaryMetrics.averageRating,
          summaryMetrics.averagePace,
          summaryMetrics.averageInteractivity,
          summaryMetrics.clarityYes,
          summaryMetrics.clarityNo,
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: {
        beginAtZero: true,
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
      {/* Back to Lecturer Dashboard Button */}
      <Link to="/lecturer-dashboard">
        <Button type="primary" className={styles.backButton}>
          Back to Lecturer Dashboard
        </Button>
      </Link>

      <Title level={2}>Session Feedback Analytics</Title>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} className={styles.summaryCard}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Feedback"
              value={summaryMetrics.totalFeedback}
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Average Rating"
              value={summaryMetrics.averageRating}
              precision={1}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Clarity (Yes)"
              value={summaryMetrics.clarityYes}
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Average Pace"
              value={summaryMetrics.averagePace}
              precision={1}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Average Interactivity"
              value={summaryMetrics.averageInteractivity}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      {/* Comprehensive Chart */}
      <Card className={styles.chartCard}>
        <Title level={4} style={{ marginBottom: 16 }}>Feedback Summary Metrics</Title>
        <div className="chart-container">
          <Bar
            data={comprehensiveChartData}
            options={chartOptions}
          />
        </div>
      </Card>

      {/* Charts Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card className={styles.chartCard}>
            <Title level={4} style={{ marginBottom: 16 }}>Average Ratings by Unit</Title>
            <div className="chart-container">
              <Bar
                data={unitRatingsData}
                options={chartOptions}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className={styles.chartCard}>
            <Title level={4} style={{ marginBottom: 16 }}>Clarity Distribution</Title>
            <div className="chart-container">
              <Pie
                data={clarityData}
                options={chartOptions}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filter Bar */}
      <Row gutter={[16, 16]} className={styles.filterBar}>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            placeholder="Filter by Unit"
            value={filters.unit}
            onChange={(value) => setFilters((prev) => ({ ...prev, unit: value }))}
          >
            {unitOptions.map((unit) => (
              <Option key={unit} value={unit}>
                {unit}
              </Option>
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
          >
            Reset Filters
          </Button>
        </Col>
      </Row>

      {/* Feedback Grid */}
      <Spin spinning={loading} tip="Loading feedback..." size="large">
        {filteredFeedback.length > 0 ? (
          <>
            <div className={styles.gridContainer}>
              {paginatedFeedback.map((item) => (
                <Card key={item._id} className={styles.feedbackCard}>
                  <div className={styles.feedbackHeader}>
                    <Text strong>{item.unit?.name || 'Unnamed Unit'}</Text>
                    <Tag color="blue" className={styles.ratingTag}>
                      {item.unit?.code || 'N/A'}
                    </Tag>
                  </div>

                  <div className={styles.feedbackSection}>
                    <Text strong>Course: </Text>
                    {item.course?.name || 'N/A'}
                  </div>

                  <div className={styles.feedbackSection}>
                    <Text strong>Student: </Text>
                    {item.studentId?.name || 'Anonymous'}
                  </div>

                  <div className={styles.feedbackSection}>
                    <Text strong>Rating: </Text>
                    <Rate disabled value={item.rating || 0} />
                    <Text type="secondary" className={styles.ratingTag}>
                      ({item.rating || 0} Stars)
                    </Text>
                  </div>

                  <div className={styles.feedbackSection}>
                    <Text strong>Comments: </Text>
                    {item.feedbackText || 'No comments provided.'}
                  </div>

                  <div className={styles.feedbackSection}>
                    <Text strong>Pace: </Text>
                    {item.pace || 'N/A'}
                  </div>

                  <div className={styles.feedbackSection}>
                    <Text strong>Interactivity: </Text>
                    <Rate disabled value={item.interactivity || 0} />
                  </div>

                  <div className={styles.feedbackSection}>
                    <Text strong>Clarity: </Text>
                    <Tag color={item.clarity ? 'green' : 'red'}>
                      {item.clarity ? 'Clear' : 'Unclear'}
                    </Tag>
                  </div>

                  <div className={styles.feedbackSection}>
                    <Text strong>Resources: </Text>
                    {item.resources || 'None'}
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
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
              />
            </div>
          </>
        ) : (
          <div className={styles.emptyText}>No feedback available</div>
        )}
      </Spin>
    </div>
  );
};

export default LecturerFeedbackView;