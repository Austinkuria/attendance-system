import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, Form, Input, message, Spin, Space, Breadcrumb } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ArrowLeftOutlined, SettingOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { ThemeContext } from '../../context/ThemeContext';

const { Header, Content } = Layout;
const { Title } = Typography;

const SettingsCard = styled(Card)`
  max-width: 800px;
  margin: 30px auto 12px;
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

  .ant-card-body {
    padding: 16px;
  }
  
  @media (min-height: 900px) {
    margin-top: 40px;
    margin-bottom: 40px;
  }
  
  @media (max-width: 768px) {
    width: 90%;
    margin: 16px auto;
  }
  
  @media (max-width: 576px) {
    width: 95%;
    padding: 0;
    margin: 8px auto;
  }
  
  @media (min-width: 1200px) {
    max-width: 800px;
    width: 60%;
    min-height: auto;
    margin-top: 25px;
  }
  
  @media (min-width: 992px) and (max-width: 1199px) {
    max-width: 700px;
    width: 70%;
    min-height: auto;
    margin-top: 20px;
  }
  
  @media (min-width: 769px) and (max-width: 991px) {
    max-width: 650px;
    width: 80%;
    min-height: auto;
    margin-top: 20px;
  }
`;

const AdminSettings = () => {
  const { themeColors } = useContext(ThemeContext);
  const [profile, setProfile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
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
      padding: '12px',
      background: themeColors.background,
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      boxSizing: 'border-box',
      overflowY: 'auto',
      overflowX: 'hidden',
      marginTop: '40px',
      paddingBottom: '0px',
      minHeight: 'calc(100vh - 45px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: window.innerHeight > 900 ? 'center' : 'flex-start',
      alignItems: 'center',
      '@media (max-width: 768px)': {
        justifyContent: 'center',
      },
      '@media (min-width: 769px)': {
        marginTop: '35px',
      },
      '@media (min-width: 992px)': {
        marginTop: '30px',
      }
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

      .ant-input::placeholder {
        color: rgba(255, 255, 255, 0.45) !important;
        opacity: 0.7;
      }
      
      .ant-input:-ms-input-placeholder {
        color: rgba(255, 255, 255, 0.45) !important;
        opacity: 0.7;
      }
      
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
        padding: 8px;
      }
      
      .ant-form-item {
        margin-bottom: 12px;
      }

      @media (min-height: 900px) {
        .settings-container {
          margin-top: 0;
          justify-content: center !important;
          min-height: calc(100vh - 55px) !important;
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
          align-items: center;
          min-height: calc(100vh - 100px);
          width: 100%;
          margin-top: 10px !important;
        }

        .ant-card {
          width: 100%;
          margin: 8px auto !important;
        }
      }
      
      @media (max-width: 576px) {
        .settings-container {
          justify-content: center !important;
          align-items: center !important;
          padding-top: 0px;
          min-height: calc(100vh - 60px);
          margin-top: 0 !important;
        }

        .ant-card {
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          border-radius: 8px;
          max-height: 90vh;
          overflow-y: auto;
        }
      }
      
      @media (max-width: 480px) {
        .ant-layout-content { 
          padding: 4px !important;
        }
        .header-row { 
          padding: 4px !important; 
        }
        
        .settings-container {
          margin-top: 5px !important;
        }
      }
      
      @media (max-width: 576px) {
        .settings-container {
          justify-content: flex-start;
          padding-top: 10px;
        }

        .ant-card {
          margin-top: 0 !important;
          border-radius: 8px;
        }
        
        .ant-form-item-label > label {
          font-size: 14px;
        }
      }
      
      .ant-card {
        margin-bottom: 24px;
      }

      @media (min-height: 750px) and (max-height: 899px) {
        .settings-container {
          margin-top: 0;
          justify-content: center !important;
        }
      }

      @media (min-height: 750px) {
        .ant-layout-content {
          padding-bottom: 0 !important;
          min-height: auto !important;
          height: auto !important;
          justify-content: center !important;
          padding-top: 10px !important;
        }
        
        .ant-card {
          margin-bottom: 0 !important;
        }

        .settings-container {
          min-height: calc(100vh - 65px) !important;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .ant-breadcrumb {
        margin-bottom: 16px;
      }
      
      .ant-breadcrumb a {
        color: ${themeColors.primary};
      }
      
      .ant-breadcrumb-separator, .ant-breadcrumb-item:last-child {
        color: ${themeColors.text};
      }
    `,
    settingsContainer: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      marginTop: window.innerHeight > 900 ? '0' : window.innerWidth >= 992 ? '15px' : '25px',
      flexGrow: 0,
      height: 'auto',
      boxSizing: 'border-box',
      alignItems: 'center',
      justifyContent: window.innerHeight > 900 ? 'center' : 'flex-start',
      minHeight: window.innerHeight > 900 ? 'calc(100vh - 55px)' : 'auto',
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getUserProfile();
        setProfile(profileData);
        form.setFieldsValue(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
        message.error('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
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

  return (
    <Layout style={styles.layout}>
      <style>{styles.responsiveOverrides}</style>
      <Header style={styles.header}>
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined style={{ color: themeColors.primary }} />}
            onClick={() => navigate('/admin/profile')}
            style={{ fontSize: '16px', width: 56, height: 45, color: themeColors.text }}
          />
          <Title level={4} style={{ margin: 0, color: themeColors.primary }}>Settings</Title>
        </Space>
      </Header>
      <Content style={styles.content}>
        <Breadcrumb style={{
          marginBottom: 16,
          width: '100%',
          maxWidth: '800px',
          display: window.innerWidth <= 576 ? 'none' : 'flex'
        }}>
          <Breadcrumb.Item><a onClick={() => navigate('/admin')}>Dashboard</a></Breadcrumb.Item>
          <Breadcrumb.Item><a onClick={() => navigate('/admin/profile')}>Profile</a></Breadcrumb.Item>
          <Breadcrumb.Item>Settings</Breadcrumb.Item>
        </Breadcrumb>

        <div
          className="settings-container"
          style={{
            ...styles.settingsContainer,
            ...(window.innerWidth <= 768 || window.innerHeight > 750 ? {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: window.innerWidth <= 576 ? 'calc(100vh - 60px)' : 'calc(100vh - 65px)',
              marginTop: 0
            } : {})
          }}
        >
          <SettingsCard
            background={themeColors.cardBg}
            headcolor={themeColors.primary}
            title="Edit Profile"
            style={{
              marginBottom: '0px',
              ...(window.innerWidth <= 576 ? {
                maxHeight: '90vh',
                overflow: 'auto',
                width: '95%',
                margin: '0 auto'
              } : window.innerWidth <= 768 ? {
                width: '90%',
                margin: '0 auto'
              } : window.innerWidth <= 991 ? {
                width: '80%',
                maxHeight: window.innerHeight > 900 ? '80vh' : 'auto',
                overflow: window.innerHeight > 900 ? 'auto' : 'visible'
              } : window.innerWidth <= 1199 ? {
                width: '70%',
                maxHeight: window.innerHeight > 900 ? '80vh' : 'auto',
                overflow: window.innerHeight > 900 ? 'auto' : 'visible'
              } : {
                width: '60%',
                maxHeight: window.innerHeight > 900 ? '80vh' : 'auto',
                overflow: window.innerHeight > 900 ? 'auto' : 'visible'
              })
            }}
          >
            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 0',
                minHeight: '400px',
                minWidth: '300px',
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
                initialValues={profile}
                onFinish={onFinish}
                layout="vertical"
                style={{
                  maxWidth: 500,
                  margin: '0 auto',
                  padding: window.innerWidth <= 576 ? '8px 4px' : '8px 16px'
                }}
              >
                <Form.Item
                  label={<span style={{ color: themeColors.text }}>First Name</span>}
                  name="firstName"
                  rules={[{ required: true, message: 'Please input your first name!' }]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: themeColors.primary }} />}
                    placeholder="Enter first name"
                    style={{ background: themeColors.inputBg, color: themeColors.text }}
                  />
                </Form.Item>
                <Form.Item
                  label={<span style={{ color: themeColors.text }}>Last Name</span>}
                  name="lastName"
                  rules={[{ required: true, message: 'Please input your last name!' }]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: themeColors.primary }} />}
                    placeholder="Enter last name"
                    style={{ background: themeColors.inputBg, color: themeColors.text }}
                  />
                </Form.Item>
                <Form.Item
                  label={<span style={{ color: themeColors.text }}>Email</span>}
                  name="email"
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email!' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={{ color: themeColors.primary }} />}
                    placeholder="Enter email"
                    style={{ background: themeColors.inputBg, color: themeColors.text }}
                  />
                </Form.Item>
                <Form.Item
                  label={<span style={{ color: themeColors.text }}>New Password (optional)</span>}
                  name="password"
                  rules={[
                    { min: 6, message: 'Password must be at least 6 characters long!' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: themeColors.primary }} />}
                    placeholder="Enter new password"
                    style={{ background: themeColors.inputBg, color: themeColors.text }}
                  />
                </Form.Item>
                <Form.Item style={{ marginTop: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdating}
                    disabled={isUpdating}
                    style={{
                      width: '100%',
                      background: themeColors.primary,
                      borderColor: themeColors.primary,
                      color: themeColors.buttonText || '#ffffff'
                    }}
                  >
                    {isUpdating ? 'Updating...' : 'Update Profile'}
                  </Button>
                </Form.Item>
                <Button
                  onClick={() => navigate('/admin/profile')}
                  style={{
                    width: '100%',
                    marginTop: 0,
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

export default AdminSettings;