import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Card, Input, Button, Typography, Alert, Form } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import '../styles.css';

const { Title, Text } = Typography;

const Login = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    const { email, password } = values;

    try {
      const response = await axios.post('https://attendance-system-w70n.onrender.com/api/auth/login', { email, password });

      // Store token in localStorage
      const token = response.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem("userId", response.data.user.id);

      // Decode token to get user role
      const decodedToken = jwtDecode(token);
      const role = decodedToken.role;

      // Store role in localStorage
      localStorage.setItem('role', role);

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
          navigate('/dashboard'); // Fallback
      }
    } catch (error) {
      console.error("Login error:", error.response ? error.response.data : error.message);
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <Title level={2} style={{ textAlign: 'center' }}>Login</Title>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '15px' }} />}

        <Form form={form} name="login" layout="vertical" onFinish={handleLogin}>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email!' },
              { type: 'email', message: 'Enter a valid email address!' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              type="email"
              placeholder="Email"
              size="large"
              style={{ marginBottom: '10px' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please enter your password!' },
              { min: 6, message: 'Password must be at least 6 characters long!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
              style={{ marginBottom: '15px' }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              Login
            </Button>
          </Form.Item>
        </Form>

        <Text style={{ display: 'block', textAlign: 'center', marginTop: '10px' }}>
          Don&apos;t have an account? <a href="/auth/signup">Signup</a>
        </Text>
      </Card>
    </div>
  );
};

export default Login;