import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, Spin, Row, Col, Space, Avatar, Breadcrumb, message } from 'antd';
import { ArrowLeftOutlined, MailOutlined, BookOutlined, CalendarOutlined, LogoutOutlined, EditOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { ThemeContext } from '../../context/ThemeContext';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const ProfileCard = styled(Card)`
  max-width: 1200px;
  margin: 16px auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: ${props => props.background};
  padding: 24px;
  overflow: visible;
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 1200px) {
    margin: 16px auto;
    width: 90%;
  }
  
  @media (max-width: 576px) {
    padding: 16px;
    margin: 16px auto;
    width: 95%;
  }
`;

const StyledAvatar = styled(Avatar)`
  background-color: ${props => props.bgcolor};
  font-size: 48px;
  @media (max-width: 576px) {
    font-size: 32px;
    width: 80px;
    height: 80px;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
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
        <Breadcrumb style={{ marginBottom: 16, padding: '0 16px' }}>
          <Breadcrumb.Item><a onClick={() => navigate('/student-dashboard')} style={{ color: themeColors.primary }}>Dashboard</a></Breadcrumb.Item>
          <Breadcrumb.Item style={{ color: themeColors.text }}>Profile</Breadcrumb.Item>
        </Breadcrumb>
        <ProfileCard background={themeColors.cardBg}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <ActionBar>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate('/student/settings')}
                style={{
                  minWidth: 120,
                  background: themeColors.primary,
                  borderColor: themeColors.primary,
                  color: '#ffffff' // Change this to white instead of themeColors.text
                }}
              >
                Edit Profile
              </Button>
              <Button
                type="default"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{
                  minWidth: 120,
                  background: themeColors.accent,
                  borderColor: themeColors.accent,
                  color: '#ffffff'
                }}
              >
                Logout
              </Button>
            </ActionBar>
            <Row align="middle" gutter={[24, 24]}>
              <Col xs={24} sm={6} style={{ textAlign: 'center' }}>
                <StyledAvatar size={{ xs: 80, sm: 128 }} bgcolor={themeColors.primary}>
                  {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                </StyledAvatar>
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
    </Layout>
  );
};

export default StudentProfile;