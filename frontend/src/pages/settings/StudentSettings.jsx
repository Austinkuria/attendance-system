import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, Form, Input, message, Spin, Space, Breadcrumb } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { ThemeContext } from '../../context/ThemeContext';

const { Header, Content } = Layout;
const { Title } = Typography;

const SettingsCard = styled(Card)`
  max-width: 600px;
  margin: 24px auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: ${props => props.background};
  @media (max-width: 576px) {
    padding: 16px;
    margin: 16px;
  }
`;

const StudentSettings = () => {
  const { themeColors } = useContext(ThemeContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const styles = {
    layout: {
      minHeight: '100vh',
      background: themeColors.background,
      padding: 0,
      margin: 0,
      width: '100%',
      overflowX: 'hidden',
    },
    content: {
      maxWidth: '100%',
      width: '100%',
      margin: 0,
      padding: '16px',
      background: themeColors.background,
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      marginTop: '64px',
    },
    headerRow: {
      marginBottom: '16px',
      padding: '8px',
      background: themeColors.cardBg,
      borderRadius: '8px 8px 0 0',
      flexWrap: 'wrap',
      gap: '8px',
      alignItems: 'center',
      width: '100%',
      boxSizing: 'border-box',
    },
    header: {
      padding: '0 24px',
      background: themeColors.cardBg,
      position: 'fixed',
      width: '100%',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 64,
      borderBottom: `1px solid ${themeColors.border}`,
    },
    responsiveOverrides: `
      html, body, #root {
        margin: 0;
        padding: 0;
        width: 100%;
        overflow-x: 'hidden';
        background: ${themeColors.background};
        color: ${themeColors.text};
      }

      .ant-layout, .ant-layout-content {
        padding: 0 !important;
        margin: 0 !important;
        background: ${themeColors.background} !important;
      }

      .ant-form-item-label > label {
        color: ${themeColors.text} !important;
      }

      .ant-input {
        background: ${themeColors.inputBg} !important;
        border-color: ${themeColors.inputBorder} !important;
        color: ${themeColors.text} !important;
      }

      .ant-input:hover, .ant-input:focus {
        border-color: ${themeColors.primary} !important;
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getUserProfile();
        form.setFieldsValue({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        message.error('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [form]);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      await updateUserProfile(values);
      message.success('Profile updated successfully!');
      navigate('/student/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout style={styles.layout}>
      <style>{styles.responsiveOverrides}</style>
      <Header style={styles.header}>
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined style={{ color: themeColors.primary }} />}
            onClick={() => navigate('/student/profile')}
            style={{ fontSize: '16px', width: 64, height: 64, color: themeColors.text }}
          />
          <Title level={3} style={{ margin: 0, color: themeColors.primary }}>Settings</Title>
        </Space>
      </Header>
      <Content style={styles.content}>
        <Breadcrumb style={{ marginBottom: 16, padding: '0 16px' }}>
          <Breadcrumb.Item><a onClick={() => navigate('/student-dashboard')} style={{ color: themeColors.primary }}>Dashboard</a></Breadcrumb.Item>
          <Breadcrumb.Item><a onClick={() => navigate('/student/profile')} style={{ color: themeColors.primary }}>Profile</a></Breadcrumb.Item>
          <Breadcrumb.Item style={{ color: themeColors.text }}>Settings</Breadcrumb.Item>
        </Breadcrumb>

        <SettingsCard
          background={themeColors.cardBg}
          title={<span style={{ color: '#ffffff' }}>Edit Profile</span>}
          headStyle={{
            backgroundColor: themeColors.primary,
            color: '#ffffff' // Ensure text color is white
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{ remember: true }}
            >
              <Form.Item
                label={<span style={{ color: themeColors.text }}>First Name</span>}
                name="firstName"
                rules={[{ required: true, message: 'Please enter your first name' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: themeColors.primary }} />}
                  placeholder="First Name"
                  style={{ background: themeColors.inputBg, color: themeColors.text }}
                />
              </Form.Item>

              <Form.Item
                label={<span style={{ color: themeColors.text }}>Last Name</span>}
                name="lastName"
                rules={[{ required: true, message: 'Please enter your last name' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: themeColors.primary }} />}
                  placeholder="Last Name"
                  style={{ background: themeColors.inputBg, color: themeColors.text }}
                />
              </Form.Item>

              <Form.Item
                label={<span style={{ color: themeColors.text }}>Email</span>}
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: themeColors.primary }} />}
                  placeholder="Email"
                  disabled
                  style={{ background: themeColors.inputBg, color: themeColors.text }}
                />
              </Form.Item>

              <Form.Item
                label={<span style={{ color: themeColors.text }}>New Password (leave blank to keep current)</span>}
                name="password"
                rules={[
                  { min: 8, message: 'Password must be at least 8 characters long' },
                  { pattern: /[A-Z]/, message: 'Password must contain at least 1 uppercase letter' },
                  { pattern: /[0-9]/, message: 'Password must contain at least 1 number' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: themeColors.primary }} />}
                  placeholder="New Password"
                  style={{ background: themeColors.inputBg, color: themeColors.text }}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  style={{
                    width: '100%',
                    background: themeColors.primary,
                    borderColor: themeColors.primary,
                    color: themeColors.text
                  }}
                >
                  Save Changes
                </Button>
              </Form.Item>

              <Button
                onClick={() => navigate('/student/profile')}
                style={{
                  width: '100%',
                  marginTop: 8,
                  background: themeColors.accent,
                  borderColor: themeColors.accent,
                  color: '#ffffff'
                }}
              >
                Cancel
              </Button>
            </Form>
          )}
        </SettingsCard>
      </Content>
    </Layout>
  );
};

export default StudentSettings;