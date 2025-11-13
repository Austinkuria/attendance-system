import { useState } from 'react';
import { Form, Input, Button, message, Card, Alert } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../services/secureApiClient';
import './ChangePassword.css';

const ChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isForced = location.state?.isForced || false;
  const tempToken = localStorage.getItem('tempToken');

  const onFinish = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        newPassword: values.newPassword
      };

      // Only include current password if not forced change
      if (!isForced) {
        payload.currentPassword = values.currentPassword;
      }

      // If forced, use temp token in header
      const config = isForced && tempToken ? {
        headers: {
          'Authorization': `Bearer ${tempToken}`
        }
      } : {};

      const response = await apiClient.post('/auth/change-password', payload, config);
      
      message.success('Password changed successfully!');
      
      // Clear temp token
      localStorage.removeItem('tempToken');
      
      // Store user info
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      // Redirect based on role
      setTimeout(() => {
        const user = response.data.user || JSON.parse(localStorage.getItem('user') || '{}');
        
        switch (user.role) {
          case 'super_admin':
            navigate('/super-admin');
            break;
          case 'department_admin':
            navigate('/department-admin');
            break;
          case 'lecturer':
            navigate('/lecturer-dashboard');
            break;
          case 'student':
            navigate('/student-dashboard');
            break;
          default:
            navigate('/');
        }
      }, 1000);

    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <Card className="change-password-card" style={{ maxWidth: 500, margin: '50px auto' }}>
        <div className="change-password-header" style={{ textAlign: 'center', marginBottom: 24 }}>
          <LockOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <h2>Change Password</h2>
          {isForced && (
            <Alert
              message="Password Change Required"
              description="For security reasons, you must change your password before continuing."
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}
        </div>

        <Form
          name="change-password"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          {!isForced && (
            <Form.Item
              label="Current Password"
              name="currentPassword"
              rules={[
                { required: true, message: 'Please enter your current password' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter current password"
              />
            </Form.Item>
          )}

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 8, message: 'Password must be at least 8 characters' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: 'Password must contain uppercase, lowercase, number and special character'
              }
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter new password"
            />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['newPassword']}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<CheckCircleOutlined />}
              placeholder="Confirm new password"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
            >
              Change Password
            </Button>
          </Form.Item>
        </Form>

        <div className="password-requirements" style={{ 
          marginTop: 24, 
          padding: 16, 
          background: '#f5f5f5', 
          borderRadius: 8 
        }}>
          <p><strong>Password Requirements:</strong></p>
          <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li>At least 8 characters long</li>
            <li>Contains uppercase letter (A-Z)</li>
            <li>Contains lowercase letter (a-z)</li>
            <li>Contains number (0-9)</li>
            <li>Contains special character (@$!%*?&)</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ChangePassword;
