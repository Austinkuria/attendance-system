import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Card, Input, Button, Typography, Alert } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import '../styles.css';

const { Title, Text } = Typography;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/login', { email, password });

      // Store token in localStorage
      const token = response.data.token;
      localStorage.setItem('token', token);

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
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <Title level={2} style={{ textAlign: 'center' }}>Login</Title>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '15px' }} />}
        
        <form onSubmit={handleLogin}>
          <Input
            prefix={<MailOutlined />}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            size="large"
            style={{ marginBottom: '10px' }}
          />
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            size="large"
            style={{ marginBottom: '15px' }}
          />
          <Button type="primary" htmlType="submit" size="large" block>
            Login
          </Button>
        </form>
        
        <Text style={{ display: 'block', textAlign: 'center', marginTop: '10px' }}>
          Don&apos;t have an account? <a href="/signup">Signup</a>
        </Text>
      </Card>
    </div>
  );
};

export default Login;
