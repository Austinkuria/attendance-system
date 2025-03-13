import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, Spin, Row, Col, Space, message } from 'antd';
import { ArrowLeftOutlined, MailOutlined, BookOutlined, CalendarOutlined, LogoutOutlined, EditOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { ThemeContext } from '../../context/ThemeContext';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const ProfileCard = styled(Card)`
  max-width: 1200px;
  margin: 65px auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: ${props => props.background};
  padding: 24px;
  overflow: visible;
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 1200px) {
    margin: 24px auto;  // Increased from 16px to 24px
    width: 90%;
  }
  
  @media (max-width: 576px) {
    padding: 16px;
    margin: 20px auto;  // Increased from 16px to 20px
    width: 95%;
  }
`;

// Update ProfileInitialsCircle to ensure it's always a circle
const ProfileInitialsCircle = styled.div`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: ${props => props.bgcolor};
  color: white;
  border-radius: 50%;  /* This ensures a circle shape */
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
  flex-shrink: 0; /* Prevent the circle from being squished */
  
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

const StudentProfile = () => {
  const { themeColors } = useContext(ThemeContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Define styles with themeColors
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
      marginTop: '56px', // Reduced from 64px to 56px
      paddingTop: '20px',  // Added padding to the top of content
      paddingBottom: '24px',
      minHeight: 'calc(100vh - 56px)', // Adjusted to match new header height
      display: 'flex',
      flexDirection: 'column',
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

      /* Tablet Breakpoint */
      @media (max-width: 768px) {
        .ant-layout-content { 
          padding: 12px !important; 
        }
        
        .header-row { 
          padding: 12px !important;
          margin-bottom: 12px !important;
        }
        
        .profile-card {
          padding: 16px !important;
        }
      }
      
      /* Mobile Breakpoint */
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
          <Spin size="large" tip="Loading profile..." />
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
              onClick={() => navigate('/student-dashboard')}
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
      <Header style={styles.header}>
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined style={{ color: themeColors.primary }} />}
            onClick={() => navigate('/student-dashboard')}
            style={{ fontSize: '16px', width: 56, height: 56, color: themeColors.text }}
          />
          <Title level={4} style={{ margin: 0, color: themeColors.primary }}>Profile</Title>
        </Space>
      </Header>
      <Content style={styles.content}>
        <style>{styles.responsiveOverrides}</style>
        <ProfileCard background={themeColors.cardBg}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <ActionBar>
              <ActionButton
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate('/student/settings')}
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
            <Row align="middle" gutter={[24, 24]}>
              <Col xs={24} sm={6} style={{
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '12px'
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
              <Col xs={24} sm={18}>
                <Title level={2} style={{ margin: 0, color: themeColors.text }}>{profile.firstName} {profile.lastName}</Title>
                <Text type="secondary" style={{ color: `${themeColors.text}80` }}>Student Profile</Text>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Text strong style={{ color: themeColors.text }}><MailOutlined style={{ marginRight: 8, color: themeColors.primary }} /> Email:</Text>
                <Text block style={{ color: themeColors.text }}>{profile.email}</Text>
              </Col>
              <Col xs={24} md={12}>
                <Text strong style={{ color: themeColors.text }}><BookOutlined style={{ marginRight: 8, color: themeColors.primary }} /> Registration Number:</Text>
                <Text block style={{ color: themeColors.text }}>{profile.regNo}</Text>
              </Col>
              <Col xs={24} md={12}>
                <Text strong style={{ color: themeColors.text }}><BookOutlined style={{ marginRight: 8, color: themeColors.primary }} /> Course:</Text>
                <Text block style={{ color: themeColors.text }}>{profile.course?.name || 'N/A'}</Text>
              </Col>
              <Col xs={24} md={12}>
                <Text strong style={{ color: themeColors.text }}><BookOutlined style={{ marginRight: 8, color: themeColors.primary }} /> Department:</Text>
                <Text block style={{ color: themeColors.text }}>{profile.department?.name || 'N/A'}</Text>
              </Col>
              <Col xs={24} md={12}>
                <Text strong style={{ color: themeColors.text }}><CalendarOutlined style={{ marginRight: 8, color: themeColors.primary }} /> Year:</Text>
                <Text block style={{ color: themeColors.text }}>{profile.year}</Text>
              </Col>
              <Col xs={24} md={12}>
                <Text strong style={{ color: themeColors.text }}><CalendarOutlined style={{ marginRight: 8, color: themeColors.primary }} /> Semester:</Text>
                <Text block style={{ color: themeColors.text }}>{profile.semester}</Text>
              </Col>
            </Row>
          </Space>
        </ProfileCard>
      </Content>
    </Layout >
  );
};

export default StudentProfile;