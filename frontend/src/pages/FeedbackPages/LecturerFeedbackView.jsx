import { useState, useEffect, useMemo } from 'react'; // Add useMemo here
import { Card, List, Typography, Rate, Select, Row, Col, Spin, Alert, Tag } from 'antd';
import { getFeedbackForLecturer } from '../../services/api';
import { css } from '@emotion/css';

const { Title, Text } = Typography;
const { Option } = Select;

// Styled components
const useStyles = () => ({
  container: css`
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
  `,
  filterBar: css`
    margin-bottom: 24px;
    .ant-select {
      width: 100%;
    }
  `,
  feedbackCard: css`
    margin-bottom: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.3s ease;
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  `,
  feedbackHeader: css`
    margin-bottom: 12px;
    .ant-typography {
      margin-bottom: 0;
    }
  `,
  feedbackSection: css`
    margin-bottom: 12px;
    .ant-typography {
      margin-bottom: 4px;
    }
  `,
  ratingTag: css`
    margin-left: 8px;
    font-size: 12px;
  `,
  emptyText: css`
    text-align: center;
    padding: 24px;
    color: #999;
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
      <Title level={2}>Session Feedback</Title>

      {/* Filter Bar */}
      <Row gutter={[16, 16]} className={styles.filterBar}>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            placeholder="Filter by Unit"
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
            onChange={(value) => setFilters((prev) => ({ ...prev, clarity: value }))}
          >
            <Option value={true}>Clear</Option>
            <Option value={false}>Unclear</Option>
          </Select>
        </Col>
      </Row>

      {/* Feedback List */}
      <Spin spinning={loading} tip="Loading feedback..." size="large">
        <List
          dataSource={filteredFeedback}
          renderItem={(item) => (
            <Card className={styles.feedbackCard}>
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
          )}
          locale={{ emptyText: <div className={styles.emptyText}>No feedback available</div> }}
        />
      </Spin>
    </div>
  );
};

export default LecturerFeedbackView;