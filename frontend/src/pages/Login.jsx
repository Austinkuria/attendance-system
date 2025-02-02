import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// import * as jwtDecode from 'jwt-decode';
import { jwtDecode } from 'jwt-decode';
import { Form, Input, Button, Alert, Typography } from 'antd';
import '../styles.css';

const { Title, Text } = Typography;

const Login = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Called when the form is submitted successfully
  const onFinish = async (values) => {
    try {
      // Make the login API call using the form values
      const response = await axios.post('/api/login', {
        email: values.email,
        password: values.password,
      });
      
      // Store token in localStorage
      const token = response.data.token;
      localStorage.setItem('token', token);

      // Decode token to extract the user role
      const decodedToken = jwtDecode(token);
      const role = decodedToken.role;
      localStorage.setItem('role', role);

      // Redirect based on user role
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
    <div className="login-container" style={{ maxWidth: 400, margin: '50px auto', padding: 24, border: '1px solid #f0f0f0', borderRadius: 8 }}>
      <Title level={2} style={{ textAlign: 'center' }}>Login</Title>
      {error && (
        <Alert
          message={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 24 }}
        />
      )}
      <Form
        name="login"
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input placeholder="Email" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' }
          ]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Login
          </Button>
        </Form.Item>
      </Form>
      <Text>
        Don&apos;t have an account? <a href="/signup">Signup</a>
      </Text>
    </div>
  );
};

export default Login;
