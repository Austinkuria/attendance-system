import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, Form, Input, message, Spin, Space, Breadcrumb } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { theme } from 'antd';

const { Header, Content } = Layout;
const { Title } = Typography;

const SettingsCard = styled(Card)`
  max-width: 600px;
  margin: 24px auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #fff;
  @media (max-width: 576px) {
    margin: 16px;
    padding: 16px;
  }
`;

const AdminSettings = () => {
  const { token: { colorBgContainer } } = theme.useToken();
  const [profile, setProfile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getUserProfile();
        setProfile(profileData);
        form.setFieldsValue(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
        message.error('Failed to load profile data. Please try again.');
      }
    };

    fetchProfile();
  }, [navigate, form]);

  const onFinish = async (values) => {
    setIsUpdating(true);
    try {
      await updateUserProfile(values);
      message.success('Profile updated successfully!');
      navigate('/admin/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!profile) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
          <Spin size="large" tip="Loading settings..." />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header
        style={{
          padding: '0 24px',
          background: colorBgContainer,
          position: 'fixed',
          width: '100%',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/profile')}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>Settings</Title>
        </Space>
      </Header>
      <Content style={{ padding: '88px 24px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item><a onClick={() => navigate('/admin')}>Dashboard</a></Breadcrumb.Item>
          <Breadcrumb.Item><a onClick={() => navigate('/admin/profile')}>Profile</a></Breadcrumb.Item>
          <Breadcrumb.Item>Settings</Breadcrumb.Item>
        </Breadcrumb>
        <SettingsCard>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>Edit Profile</Title>
          <Form
            form={form}
            initialValues={profile}
            onFinish={onFinish}
            layout="vertical"
            style={{ maxWidth: 500, margin: '0 auto' }}
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
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Enter email" />
            </Form.Item>
            <Form.Item
              label="New Password (optional)"
              name="password"
              rules={[
                { min: 6, message: 'Password must be at least 6 characters long!' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" />
            </Form.Item>
            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={isUpdating} 
                  disabled={isUpdating}
                  style={{ flex: 1, minWidth: 120 }}
                >
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
                <Button 
                  style={{ flex: 1, minWidth: 120 }} 
                  onClick={() => navigate('/admin/profile')}
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </SettingsCard>
      </Content>
    </Layout>
  );
};

export default AdminSettings;