// src/components/FeedbackView.jsx
import { useState } from 'react';
import { Form, Input, Button, List, Typography, message } from 'antd';
import { getSessionFeedback } from '../services/api';

const FeedbackView = () => {
  const [sessionId, setSessionId] = useState('');
  const [feedbackData, setFeedbackData] = useState(null);

  const handleFetchFeedback = async () => {
    if (!sessionId) {
      message.error("Please enter a session ID.");
      return;
    }
    try {
      const data = await getSessionFeedback(sessionId);
      setFeedbackData(data);
    } catch {
      message.error("Error fetching feedback.");
    }
  };

  return (
    <div>
      <h2>View Feedback</h2>
      <Form layout="inline" onFinish={handleFetchFeedback}>
        <Form.Item>
          <Input 
            placeholder="Enter Session ID" 
            value={sessionId} 
            onChange={(e) => setSessionId(e.target.value)} 
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Fetch Feedback</Button>
        </Form.Item>
      </Form>
      {feedbackData && (
        <div style={{ marginTop: 20 }}>
          <Typography.Title level={4}>
            Average Rating: {feedbackData.averageRating}
          </Typography.Title>
          <List
            header={<div>Comments</div>}
            bordered
            dataSource={feedbackData.comments}
            renderItem={(item) => (
              <List.Item>
                <Typography.Text strong>{item.studentName}: </Typography.Text>
                {item.feedbackText}
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default FeedbackView;
