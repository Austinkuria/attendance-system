import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, Form, Input, message, Spin } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title } = Typography;

const LecturerSettings = () => {
  const [profile, setProfile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getUserProfile();
        setProfile(profileData);
      } catch {
        message.error('Failed to load profile data. Please try again.');
      }
    };

    fetchProfile();
  }, [navigate]);

  const onFinish = async (values) => {
    setIsUpdating(true);
    try {
      await updateUserProfile(values);
      message.success('Profile updated successfully');
      navigate('/lecturer/profile');
    } catch {
      message.error('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!profile) {
    return (
      <Layout style={{ padding: '24px', minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ padding: '24px', minHeight: '100vh', background: '#f0f2f5' }}>
      <Content>
        <Card style={{ maxWidth: 600, margin: '0 auto' }}>
          <Title level={2}>Lecturer Settings</Title>
          <Form
            initialValues={profile}
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: 'Please input your first name!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter first name" />
            </Form.Item>
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: 'Please input your last name!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter last name" />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'The input is not valid E-mail!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Enter email" />
            </Form.Item>
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={isUpdating} 
                disabled={isUpdating}
                style={{ width: '100%', marginTop: 16 }}
              >
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </Button>
              <Button 
                style={{ marginTop: 8, width: '100%' }} 
                onClick={() => navigate('/lecturer/profile')}
              >
                Cancel
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default LecturerSettings;