import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Card, Input, Button, Typography, Alert, Form, theme } from 'antd';
import { LockOutlined, MailOutlined, ArrowRightOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { useToken } = theme;

const StyledCard = styled(Card)`
  max-width: 520px;
  margin: 42px auto;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  
  .ant-card-body {
    padding: 50px; 
  }
`;

const Login = () => {
  const { token: themeToken } = useToken();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    const { email, password } = values;

    setLoading(true);
    setError(null);

    try {
      // Create a cancellable request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

      const response = await axios.post(
        'https://attendance-system-w70n.onrender.com/api/auth/login',
        { email, password },
        {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      clearTimeout(timeoutId);

      // Store token and user data efficiently
      const { token } = response.data;  // Removed unused 'user' variable

      // Store essential data only
      localStorage.setItem('token', token);

      // Pre-decode token to avoid duplicate work across components
      const decodedToken = jwtDecode(token);
      const role = decodedToken.role;
      const userId = decodedToken.userId;

      // Store minimal user data
      const userData = JSON.stringify({
        id: userId,
        role: role,
        lastLogin: new Date().toISOString()
      });

      localStorage.setItem('userData', userData);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', userId);

      // Redirect based on role
      switch (role) {
        case 'student':
          navigate('/student-dashboard');
          break;
        case 'lecturer':
          navigate('/lecturer-dashboard');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/'); // Fallback
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setError('Login request timed out. Please check your internet connection and try again.');
      } else {
        console.error("Login error:", error.response ? error.response.data : error.message);
        setError(error.response?.data?.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      background: themeToken.colorBgContainer
    }}>
      <StyledCard>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 16, fontSize: '30px' }}>
          Welcome Back!
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 40, fontSize: '22px' }}>
          Login to access your account
        </Text>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 32, fontSize: '20px' }}
          />
        )}

        <Form
          form={form}
          name="login"
          layout="vertical"
          onFinish={handleLogin}
          disabled={loading}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email!' },
              {
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: 'Enter a valid email format (e.g., user@example.com)!'
              }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: themeToken.colorTextSecondary, fontSize: '20px' }} />} /* Increased icon size */
              placeholder="Email address"
              size="large"
              style={{ fontSize: '20px', padding: '12px' }}
              autoFocus
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please enter your password!' },
              { min: 8, message: 'Password must be at least 8 characters long!' },
              { pattern: /[a-z]/, message: 'Password must contain at least one lowercase letter!' },
              { pattern: /[0-9]/, message: 'Password must contain at least one number!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: themeToken.colorTextSecondary, fontSize: '20px' }} />} /* Increased icon size */
              placeholder="Password"
              size="large"
              style={{ fontSize: '20px', padding: '12px' }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 20 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              icon={<ArrowRightOutlined style={{ fontSize: '20px' }} />}
              style={{ height: '48px', fontSize: '20px' }}
            >
              Login
            </Button>
          </Form.Item>
        </Form>

        <div style={{
          textAlign: 'center',
          marginTop: 32,
          fontSize: '18px',
          color: themeToken.colorTextSecondary
        }}>
          Don&apos;t have an account?{' '}
          <Button
            type="link"
            onClick={() => navigate('/auth/signup')}
            style={{ padding: 0, fontSize: '18px' }}
          >
            Sign up here
          </Button>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: '18px',
          color: themeToken.colorTextSecondary
        }}>
          <Button
            type="link"
            onClick={() => navigate('/auth/reset-password')}
            style={{ padding: 0, fontSize: '18px' }}
          >
            Forgot your password?
          </Button>
        </div>
      </StyledCard>
    </div>
  );
};

export default Login;