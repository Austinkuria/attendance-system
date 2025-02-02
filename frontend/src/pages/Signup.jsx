import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Alert, Typography, Card } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import '../styles.css';

const { Title, Text } = Typography;
const { Option } = Select;

const Signup = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const { firstName, lastName, email, password, confirmPassword, role } = values;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login'); // Redirect to login after successful signup
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch {
      setError('An error occurred during signup');
    }
  };

  return (
    <div className="signup-container">
      <Card className="signup-card">
        <Title level={2} style={{ textAlign: 'center' }}>Create an Account</Title>
        
        {error && (
          <Alert 
            message={error} 
            type="error" 
            closable 
            onClose={() => setError(null)} 
            style={{ marginBottom: 16 }} 
          />
        )}
        
        <Form name="signup" layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="firstName"
            rules={[{ required: true, message: 'Please enter your first name!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="First Name" />
          </Form.Item>

          <Form.Item
            name="lastName"
            rules={[{ required: true, message: 'Please enter your last name!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Last Name" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email!' },
              { type: 'email', message: 'Enter a valid email address!' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please enter a password!' },
              { min: 6, message: 'Password must be at least 6 characters long!' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                }
              })
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
          </Form.Item>

          <Form.Item
            name="role"
            initialValue="student"
            rules={[{ required: true, message: 'Please select your role!' }]}
          >
            <Select>
              <Option value="student">Student</Option>
              <Option value="lecturer">Lecturer</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Signup
            </Button>
          </Form.Item>
        </Form>

        <Text style={{ display: 'block', textAlign: 'center' }}>
          Already have an account? <a href="/login">Login</a>
        </Text>
      </Card>
    </div>
  );
};

export default Signup;
