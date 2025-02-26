import { useState, useEffect } from 'react';
import { Card, List, Typography, Rate } from 'antd';
import { getFeedbackForLecturer } from '../../services/api';

const { Title, Text } = Typography;

const LecturerFeedbackView = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const data = await getFeedbackForLecturer();
        console.log('Received feedback data:', data); // Debug log
        setFeedback(data || []); // Default to empty array if data is null
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Session Feedback</Title>
      <List
        loading={loading}
        dataSource={feedback}
        renderItem={(item) => (
          <Card style={{ marginBottom: '16px' }}>
            <Text strong>Unit: </Text>
            {item.unit ? `${item.unit.name || 'Unnamed'} (${item.unit.code || 'N/A'})` : 'N/A'}<br />
            <Text strong>Course: </Text>{item.course?.name || 'N/A'}<br />
            <Text strong>Student: </Text>{item.studentId?.name || 'Unknown'}<br />
            <Text strong>Rating: </Text><Rate disabled value={item.rating || 0} /><br />
            <Text strong>Comments: </Text>{item.feedbackText || 'None'}<br />
            <Text strong>Pace: </Text>{item.pace || 'N/A'}<br />
            <Text strong>Interactivity: </Text><Rate disabled value={item.interactivity || 0} /><br />
            <Text strong>Clarity: </Text>{item.clarity ? 'Yes' : 'No'}<br />
            <Text strong>Resources: </Text>{item.resources || 'None'}
          </Card>
        )}
        locale={{ emptyText: 'No feedback available' }} // Custom empty message
      />
    </div>
  );
};

export default LecturerFeedbackView;