import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, Form, Input, message, Spin, Space, Breadcrumb } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { theme } from 'antd';

const { Header, Content } = Layout;
const { Title } = Typography;

const styles = {
  layout: {
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: 0,
    margin: 0,
    width: '100%',
    overflowX: 'hidden', // Prevent horizontal overflow
  },
  content: {
    maxWidth: '100%',
    width: '100%',
    margin: 0,
    padding: '16px',
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    boxSizing: 'border-box',
    overflowX: 'hidden', // Prevent horizontal overflow
  },
  headerRow: {
    marginBottom: '16px',
    padding: '8px',
    background: '#fafafa',
    borderRadius: '8px 8px 0 0',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
  },
  responsiveOverrides: `
    /* Reset browser defaults */
    html, body, #root {
      margin: 0;
      padding: 0;
      width: 100%;
      overflow-x: hidden;
    }

    /* Reset Ant Design's Layout defaults */
    .ant-layout, .ant-layout-content {
      padding: 0 !important;
      margin: 0 !important;
    }

    @media (max-width: 768px) {
      .ant-layout-content { 
        padding: 8px !important; 
      }
      .header-row { 
        padding: 8px !important; 
      }
    }
    @media (max-width: 480px) {
      .ant-layout-content { 
        padding: 4px !important; 
      }
      .header-row { 
        padding: 4px !important; 
      }
    }
  `,
};

const SettingsCard = styled(Card)`
  max-width: 100%; // Ensure the card doesn't exceed the viewport width
  margin: 16px auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #fff;
  padding: 24px;
  @media (max-width: 576px) {
    padding: 16px;
    margin: 16px 0; // Adjusted margin for small screens
    border: 1px solid red; // Debugger border
  }
`;

const StudentSettings = () => {
  const { token: { colorBgContainer } } = theme.useToken(); // Define colorBgContainer
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
      navigate('/student/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!profile) {
    return (
      <Layout style={styles.layout}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
          <Spin size="large" tip="Loading settings..." />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={styles.layout}>
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
        }}
      >
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/student/profile')}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>Settings</Title>
        </Space>
      </Header>
      <Content style={styles.content}>
        <style>{styles.responsiveOverrides}</style>
        <Breadcrumb style={{ marginBottom: 16, padding: '0 16px' }}> {/* Add padding to Breadcrumb for small screens */}
          <Breadcrumb.Item><a onClick={() => navigate('/student-dashboard')}>Dashboard</a></Breadcrumb.Item>
          <Breadcrumb.Item><a onClick={() => navigate('/student/profile')}>Profile</a></Breadcrumb.Item>
          <Breadcrumb.Item>Settings</Breadcrumb.Item>
        </Breadcrumb>
        <SettingsCard>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>Edit Profile</Title>
          <Form
            form={form}
            initialValues={profile}
            onFinish={onFinish}
            layout="vertical"
            style={{ maxWidth: '100%', margin: '0 auto', padding: '0 16px' }} // Ensure form fits within the card
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
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={isUpdating} 
                  disabled={isUpdating}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
                <Button 
                  style={{ flex: 1 }} 
                  onClick={() => navigate('/student/profile')}
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

export default StudentSettings;