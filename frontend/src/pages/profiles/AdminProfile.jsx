import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, message, Spin, Row, Col, Space, Avatar } from 'antd';
import { UserOutlined, ArrowLeftOutlined, MailOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Content } = Layout;
const { Title, Text } = Typography;

const ProfileCard = styled(Card)`
  max-width: 800px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: linear-gradient(to right, #f5f5f5, #e8e8e8);
  padding: 24px;
`;

const AdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getUserProfile();
        setProfile(profileData);
      } catch {
        message.error('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <Layout style={{ padding: '24px', minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout style={{ padding: '24px', minHeight: '100vh', background: '#f0f2f5' }}>
        <Content>
          <Card>
            <Typography.Title level={4}>Error Loading Profile</Typography.Title>
            <Button type="primary" onClick={() => window.location.reload()}>Retry</Button>
            <Button style={{ marginLeft: 8 }} onClick={() => navigate('/admin')}>
              Back to Dashboard
            </Button>
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ padding: '24px', minHeight: '100vh', background: '#f0f2f5' }}>
      <Content>
        <ProfileCard>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/admin')} 
              style={{ marginBottom: 16 }}
            >
              Back to Dashboard
            </Button>

            <Row align="middle" gutter={[24, 16]}>
              <Col>
                <Avatar size={128} icon={<UserOutlined />} />
              </Col>
              <Col flex="auto">
                <Title level={2}>{profile.firstName} {profile.lastName}</Title>
                <Text type="secondary">Admin Profile</Text>
                <Button 
                  type="link" 
                  onClick={() => navigate('/admin/settings')}
                  style={{ marginTop: '10px', fontSize: '16px' }}
                >
                  Edit Profile
                </Button>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Text strong>Email:</Text> <Text><MailOutlined style={{ marginRight: 8 }} /> {profile.email}</Text>
              </Col>
              <Col span={24}>
                <Text strong>Role:</Text> <Text><UsergroupAddOutlined style={{ marginRight: 8 }} /> {profile.role}</Text>
              </Col>
            </Row>
          </Space>
        </ProfileCard>
      </Content>
    </Layout>
  );
};

export default AdminProfile;