import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, Spin, Row, Col, Space, message } from 'antd';
import { ArrowLeftOutlined, MailOutlined, UserOutlined, EditOutlined, LogoutOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { ThemeContext } from '../../context/ThemeContext';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const ProfileCard = styled(Card)`
  max-width: 1200px;
  margin: 45px auto 24px;  // Reduced from 65px to 45px
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: ${props => props.background};
  padding: 24px;
  overflow: visible;
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
  
  @media (min-width: 1400px) {
    width: 70%;
    max-width: 1400px;
    margin-top: 40px;
  }
  
  @media (min-width: 1200px) and (max-width: 1399px) {
    width: 80%;
    max-width: 1200px;
    margin-top: 35px;
  }
  
  @media (min-width: 992px) and (max-width: 1199px) {
    width: 85%;
    margin: 35px auto 24px; // Reduced from 60px to 35px
  }
  
  @media (min-width: 769px) and (max-width: 991px) {
    width: 90%;
    margin: 30px auto 20px; // Reduced from 55px to 30px
  }
  
  @media (max-width: 768px) {
    width: 92%;
    margin: 55px auto 20px;
  }
  
  @media (max-width: 576px) {
    padding: 16px;
    margin: 0;
    width: 95%;
    max-height: 90vh;
    overflow-y: auto;
  }
`;

const ProfileInitialsCircle = styled.div`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: ${props => props.bgcolor};
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => Math.floor(props.size * 0.4)}px;
  font-weight:500;
  text-transform: uppercase;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  border: 6px solid #ffffff;
  margin: 0 auto;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%);
    border-radius: 50%;
  }
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  }
  
  @media (max-width: 768px) {
    width: 180px;
    height: 180px;
    font-size: 72px;
    border-width: 5px;
  }
  
  @media (max-width: 576px) {
    width: 140px;
    height: 140px;
    font-size: 56px;
    border-width: 4px;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
  gap: 12px;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 20px;
  }
`;

const ActionButton = styled(Button)`
  min-width: 140px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 576px) {
    min-width: 100%;
  }
`;

const AdminProfile = () => {
  const { themeColors } = useContext(ThemeContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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
      overflowY: 'auto',
      overflowX: 'hidden',
      marginTop: '45px',
      paddingTop: '10px',
      paddingBottom: '24px',
      minHeight: 'calc(100vh - 45px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
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

      @media (max-width: 768px) {
        .ant-layout-content { 
          padding: 12px !important; 
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
        }
        
        .header-row { 
          padding: 12px !important;
          margin-bottom: 12px !important;
        }
        
        .profile-card {
          padding: 16px !important;
        }
        
        .profile-card-wrapper {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          min-height: calc(100vh - 70px) !important;
        }
      }
      
      @media (max-width: 480px) {
        .ant-layout-content { 
          padding: 8px !important; 
        }
        
        .header-row { 
          padding: 6px !important;
          margin-bottom: 8px !important; 
        }
        
        .profile-card {
          padding: 12px !important;
        }
        
        .ant-space {
          gap: 12px !important;
        }
      }

      .profile-card-wrapper {
        margin-top: 5px !important;  // Reduced from 15px to 5px
        box-sizing: border-box;
        width: 100%;
      }
      
      @media (min-width: 992px) {
        .profile-card-wrapper {
          margin-top: 0 !important;
        }
      }
      
      @media (max-width: 768px) {
        .profile-card-wrapper {
          margin-top: 10px !important;
        }
      }
      
      @media (max-width: 480px) {
        .profile-card-wrapper {
          margin-top: 8px !important;
        }
      }
      
      @media (max-width: 576px) {
        .profile-card-wrapper {
          margin: 0 !important;
          height: calc(100vh - 45px) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
        }
        
        .profile-card {
          max-height: 90vh !important;
          overflow-y: auto !important;
          margin: 0 !important;
        }
      }
    `,
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getUserProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
        message.error('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    message.success('Logged out successfully.');
    navigate('/auth/login');
  };

  if (loading) {
    return (
      <Layout style={styles.layout}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
          <Spin size="large" tip="Loading admin profile data..." />
        </Content>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout style={styles.layout}>
        <Content style={{ padding: '24px' }}>
          <Card style={{ background: themeColors.cardBg, color: themeColors.text }}>
            <Title level={4} style={{ color: themeColors.text }}>Error Loading Profile</Title>
            <Button
              type="primary"
              onClick={() => window.location.reload()}
              style={{ background: themeColors.primary, borderColor: themeColors.primary }}
            >
              Retry
            </Button>
            <Button
              style={{
                marginLeft: 8,
                background: themeColors.cardBg,
                borderColor: themeColors.border,
                color: themeColors.text
              }}
              onClick={() => navigate('/admin')}
            >
              Back to Dashboard
            </Button>
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={styles.layout}>
      <style>{styles.responsiveOverrides}</style>
      <Header style={styles.header}>
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined style={{ color: themeColors.primary }} />}
            onClick={() => navigate('/admin')}
            style={{ fontSize: '16px', width: 56, height: 45, color: themeColors.text }}
          />
          <Title level={4} style={{ margin: 0, color: themeColors.primary }}>Profile</Title>
        </Space>
      </Header>
      <Content style={{
        ...styles.content,
        ...(window.innerWidth <= 768 ? {
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 0,
          paddingBottom: 0
        } : {
          paddingTop: '5px'  // Added minimal top padding for large screens
        })
      }}>
        <div className="profile-card-wrapper" style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          ...(window.innerWidth <= 768 ? {
            minHeight: 'calc(100vh - 70px)',
          } : {}),
          ...(window.innerWidth <= 576 ? {
            height: 'calc(100vh - 45px)',
            padding: 0,
            margin: 0
          } : {}),
          marginTop: window.innerWidth > 991 ? '0' : '45px',  // Adjusted margin for different screen sizes
        }}>
          <ProfileCard
            background={themeColors.cardBg}
            className="profile-card"
            style={{
              ...(window.innerWidth <= 576 ? {
                margin: 0
              } : window.innerWidth <= 768 ? {
                margin: '20px auto'
              } : {})
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <ActionBar>
                <ActionButton
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => navigate('/admin/settings')}
                  style={{
                    background: themeColors.primary,
                    borderColor: themeColors.primary,
                    color: '#ffffff'
                  }}
                >
                  Edit Profile
                </ActionButton>
                <ActionButton
                  type="default"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  style={{
                    background: themeColors.accent,
                    borderColor: themeColors.accent,
                    color: '#ffffff'
                  }}
                >
                  Logout
                </ActionButton>
              </ActionBar>

              <Row gutter={[24, 36]}>
                <Col xs={24} md={6} style={{
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '12px',
                  marginBottom: '20px'
                }}>
                  <ProfileInitialsCircle
                    bgcolor={themeColors.primary}
                    size={typeof window !== 'undefined' ?
                      (window.innerWidth <= 576 ? 140 :
                        window.innerWidth <= 768 ? 180 : 200)
                      : 200}
                  >
                    {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                  </ProfileInitialsCircle>
                </Col>

                <Col xs={24} md={18} style={{
                  paddingLeft: window.innerWidth > 768 ? '24px' : '0',
                  paddingTop: window.innerWidth <= 768 ? '12px' : '0'
                }}>
                  <div style={{ textAlign: window.innerWidth <= 768 ? 'center' : 'left' }}>
                    <Title level={2} style={{ margin: 0, color: themeColors.text }}>{profile.firstName} {profile.lastName}</Title>
                    <Text type="secondary" style={{ color: `${themeColors.text}80` }}>Administrator</Text>
                  </div>

                  <div style={{ marginTop: '32px' }}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Text strong style={{ color: themeColors.text }}><MailOutlined style={{ marginRight: 8, color: themeColors.primary }} /> Email:</Text>
                        <Text block style={{ color: themeColors.text }}>{profile.email}</Text>
                      </Col>
                      <Col xs={24} md={12}>
                        <Text strong style={{ color: themeColors.text }}><UserOutlined style={{ marginRight: 8, color: themeColors.primary }} /> Role:</Text>
                        <Text block style={{ color: themeColors.text }}>{profile.role}</Text>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </Space>
          </ProfileCard>
        </div>
      </Content>
    </Layout>
  );
};

export default AdminProfile;