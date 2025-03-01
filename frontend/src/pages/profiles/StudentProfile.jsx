import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, Spin, Row, Col, Space, Avatar, Breadcrumb, message } from 'antd';
import { ArrowLeftOutlined, MailOutlined, BookOutlined, CalendarOutlined, LogoutOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { theme } from 'antd';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const ProfileCard = styled(Card)`
  max-width: 900px;
  margin: 24px auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #fff;
  padding: 24px;
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-4px);
  }
`;

const StyledAvatar = styled(Avatar)`
  background-color: #1890ff;
  font-size: 48px;
`;

const StudentProfile = () => {
  const { token: { colorBgContainer } } = theme.useToken(); // Define colorBgContainer
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
          <Spin size="large" tip="Loading profile..." />
        </Content>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '24px' }}>
          <Card>
            <Title level={4}>Error Loading Profile</Title>
            <Button type="primary" onClick={() => window.location.reload()}>Retry</Button>
            <Button style={{ marginLeft: 8 }} onClick={() => navigate('/student-dashboard')}>
              Back to Dashboard
            </Button>
          </Card>
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
          justifyContent: 'space-between'
        }}
      >
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/student-dashboard')}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>Profile</Title>
        </Space>
      </Header>
      <Content style={{ padding: '88px 24px 24px' }}>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item><a onClick={() => navigate('/student-dashboard')}>Dashboard</a></Breadcrumb.Item>
          <Breadcrumb.Item>Profile</Breadcrumb.Item>
        </Breadcrumb>
        <ProfileCard>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row align="middle" gutter={[24, 24]}>
              <Col xs={24} sm={6} style={{ textAlign: 'center' }}>
                <StyledAvatar size={128}>
                  {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                </StyledAvatar>
              </Col>
              <Col xs={24} sm={18}>
                <Title level={2}>{profile.firstName} {profile.lastName}</Title>
                <Text type="secondary">Student Profile</Text>
                <Space style={{ marginTop: 16 }}>
                  <Button type="primary" onClick={() => navigate('/student/settings')}>
                    Edit Profile
                  </Button>
                  <Button type="default" icon={<LogoutOutlined />} onClick={handleLogout}>
                    Logout
                  </Button>
                </Space>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Text strong><MailOutlined style={{ marginRight: 8 }} /> Email:</Text>
                <Text block>{profile.email}</Text>
              </Col>
              <Col xs={24} md={12}>
                <Text strong><BookOutlined style={{ marginRight: 8 }} /> Registration Number:</Text>
                <Text block>{profile.regNo}</Text>
              </Col>
              <Col xs={24} md={12}>
                <Text strong><BookOutlined style={{ marginRight: 8 }} /> Course:</Text>
                <Text block>{profile.course?.name || 'N/A'}</Text>
              </Col>
              <Col xs={24} md={12}>
                <Text strong><BookOutlined style={{ marginRight: 8 }} /> Department:</Text>
                <Text block>{profile.department?.name || 'N/A'}</Text>
              </Col>
              <Col xs={24} md={12}>
                <Text strong><CalendarOutlined style={{ marginRight: 8 }} /> Year:</Text>
                <Text block>{profile.year}</Text>
              </Col>
              <Col xs={24} md={12}>
                <Text strong><CalendarOutlined style={{ marginRight: 8 }} /> Semester:</Text>
                <Text block>{profile.semester}</Text>
              </Col>
            </Row>
          </Space>
        </ProfileCard>
      </Content>
    </Layout>
  );
};

export default StudentProfile;