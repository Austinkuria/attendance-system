import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, Input, Button, Typography, Alert, Form } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ResetPassword = () => {
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await axios.post(`https://attendance-system-w70n.onrender.com/api/auth/reset-password/${token}`, {
        password
      });

      setMessage(response.data.message);
      setTimeout(() => navigate('/auth/login'), 3000); // Redirect after success
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <Card className="reset-password-card" bordered={false}>
        <Title level={2} style={{ textAlign: 'center' }}>Set New Password</Title>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '15px' }} />}
        {message && <Alert message={message} type="success" showIcon style={{ marginBottom: '15px' }} />}

        <Form layout="vertical">
          <Form.Item>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="New Password"
              size="large"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm New Password"
              size="large"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" size="large" block onClick={handleResetPassword} loading={loading}>
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPassword;
