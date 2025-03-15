import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, Form, Input, message, Spin, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { ThemeContext } from '../../context/ThemeContext';

const { Header, Content } = Layout;
const { Title } = Typography;

const SettingsCard = styled(Card)`
  max-width: 800px; // Increased from 600px to 800px for better use of space
  margin: 30px auto 12px; // Increased top margin from 20px to 30px
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: ${props => props.background};
  overflow: visible;
  
  .ant-card-head {
    background-color: ${props => props.headcolor || props.theme.primary};
    color: #ffffff;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
  
  .ant-card-head-title {
    color: #ffffff;
  }

  // Reduce padding in card body to save space
  .ant-card-body {
    padding: 16px;
  }
  
  @media (min-height: 900px) {
    margin-top: 80px; // Add more top margin on tall screens
  }
  
  @media (max-width: 768px) {
    width: 90%;
    margin: 16px auto; // Reduced from 24px to 16px
  }
  
  @media (max-width: 576px) {
    width: 95%;
    padding: 0;
    margin: 8px auto; // Reduced from 16px to 8px
  }
  
  @media (min-width: 1200px) {
    max-width: 800px; // Maintain wider card on large screens
  }
  
  @media (min-width: 992px) and (max-width: 1199px) {
    max-width: 700px; // Slightly narrower on medium-large screens
  }
  
  @media (min-width: 769px) and (max-width: 991px) {
    max-width: 650px; // Adjusted size for smaller laptops
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
      padding: '12px', // Reduced from 16px to 12px
      background: themeColors.background,
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      boxSizing: 'border-box',
      overflowY: 'auto',
      overflowX: 'hidden',
      marginTop: '40px', // Increased from 30px to 40px to add more space
      paddingBottom: '0px', // Reduce bottom padding
      minHeight: 'calc(100vh - 45px)', // Adjusted to match new header height and margin
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start', // Change from default to flex-start
      alignItems: 'center',
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
      padding: '0 16px',
      background: themeColors.cardBg,
      position: 'fixed',
      width: '100%',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '45px',
      borderBottom: `1px solid ${themeColors.border}`,
    },
    responsiveOverrides: `
      html, body, #root {
        margin: 0;
        padding: 0;
        width: 100%;
        overflow-x: hidden;
        background: ${themeColors.background};
        color: ${themeColors.text};
      }

      .ant-layout, .ant-layout-content {
        padding: 0 !important;
        margin: 0 !important;
        background: ${themeColors.background} !important;
      }
      
      .ant-layout {
        min-height: 100vh;
        height: auto;
      }

      .ant-form-item-label > label {
        color: ${themeColors.text} !important;
      }

      .ant-input {
        background: ${themeColors.inputBg} !important;
        border-color: ${themeColors.inputBorder} !important;
        color: ${themeColors.text} !important;
      }

      /* Placeholder styling for better visibility in dark mode */
      .ant-input::placeholder {
        color: rgba(255, 255, 255, 0.45) !important;
        opacity: 0.7;
      }
      
      /* For Edge/IE */
      .ant-input:-ms-input-placeholder {
        color: rgba(255, 255, 255, 0.45) !important;
        opacity: 0.7;
      }
      
      /* For Firefox */
      .ant-input::-moz-placeholder {
        color: rgba(255, 255, 255, 0.45) !important;
        opacity: 0.7;
      }

      .ant-input-password-icon {
        color: rgba(255, 255, 255, 0.65) !important;
      }
      
      .ant-input-password-icon:hover {
        color: rgba(255, 255, 255, 0.85) !important;
      }

      .ant-input:hover, .ant-input:focus {
        border-color: ${themeColors.primary} !important;
      }
      
      .ant-form {
        padding: 8px; // Reduced from 16px to 8px
      }
      
      .ant-form-item {
        margin-bottom: 12px; // Reduce default margin-bottom
      }

      @media (min-height: 900px) {
        .settings-container {
          margin-top: 20px;
          justify-content: flex-start !important;
        }
      }

      @media (max-width: 768px) {
        .ant-layout-content { 
          padding: 8px !important; 
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
        }
        .header-row { 
          padding: 8px !important; 
        }
        
        .settings-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: calc(100vh - 100px);
          width: 100%;
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
      
      .ant-card {
        margin-bottom: 24px;
      }

      /* Fix for large screens to eliminate bottom margin */
      @media (min-height: 750px) {
        .ant-layout-content {
          padding-bottom: 0 !important;
          min-height: auto !important;
          height: auto !important;
        }
        
        .ant-card {
          margin-bottom: 0 !important;
        }
      }
    `,
    settingsContainer: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      marginTop: '35px', // Added top margin to the container
      flexGrow: 0, // Prevent container from growing to fill space
    }
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
            style={{ fontSize: '16px', width: 56, height: 45, color: themeColors.text }}
          />
          <Title level={4} style={{ margin: 0, color: themeColors.primary }}>Settings</Title>
        </Space>
      </Header>
      <Content style={styles.content}>
        {/* Breadcrumb removed */}

        <div className="settings-container" style={styles.settingsContainer}>
          <SettingsCard
            background={themeColors.cardBg}
            headcolor={themeColors.primary}
            title="Edit Profile"
            style={{ marginBottom: '0px' }}
          >
            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 0',
                minHeight: '400px', // Add minimum height when showing spinner
                minWidth: '300px', // Add minimum width when showing spinner
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Spin size="large" tip="Loading profile data..." />
                <p style={{ marginTop: '10px', color: themeColors.text }}>Please wait while we fetch your profile information</p>
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

                <Form.Item style={{ marginTop: 0 }}> {/* Reduced from 4 to 0 */}
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
                    marginTop: 0, // Reduced from 1 to 0
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
        </div>
      </Content>
    </Layout>
  );
};

export default StudentSettings;